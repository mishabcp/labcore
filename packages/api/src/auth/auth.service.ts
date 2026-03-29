import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterLabDto } from './dto/register-lab.dto';
import { LoginDto } from './dto/login.dto';
import type { $Enums } from '@prisma/client';

const SALT_ROUNDS = 12;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? '7d';

export interface TokenPayload {
  sub: string;
  labId: string;
  role: $Enums.UserRole;
  type: 'access' | 'refresh';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email: string | null; mobile: string; role: $Enums.UserRole; labId: string; labName: string; languagePref: string };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) { }

  /** Step logs for diagnosing login 500s. Set LOG_AUTH_DEBUG=1 or run with NODE_ENV!==production for verbose steps. */
  private authStep(message: string, meta?: Record<string, unknown>): void {
    const verbose =
      process.env.LOG_AUTH_DEBUG === '1' || process.env.NODE_ENV !== 'production';
    if (!verbose) return;
    if (meta && Object.keys(meta).length > 0) {
      this.logger.log(`[auth.login] ${message} ${JSON.stringify(meta)}`);
    } else {
      this.logger.log(`[auth.login] ${message}`);
    }
  }

  private logUnexpectedAuthError(err: unknown, context: string): void {
    const e = err instanceof Error ? err : new Error(String(err));
    const prisma = err as { code?: string; meta?: unknown; clientVersion?: string };
    const parts = [
      `[auth.${context}] unexpected`,
      `name=${e.name}`,
      `message=${e.message}`,
    ];
    if (prisma.code) parts.push(`prisma.code=${prisma.code}`);
    if (prisma.clientVersion) parts.push(`prisma.clientVersion=${prisma.clientVersion}`);
    this.logger.error(parts.join(' '));
    if (prisma.meta !== undefined) {
      try {
        this.logger.error(`[auth.${context}] prisma.meta=${JSON.stringify(prisma.meta)}`);
      } catch {
        this.logger.error(`[auth.${context}] prisma.meta=(unserializable)`);
      }
    }
    if (e.stack) this.logger.error(e.stack);
  }

  async registerLab(dto: RegisterLabDto): Promise<AuthResult> {
    const slug = dto.labName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const existing = await this.prisma.lab.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Lab with this name already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const lab = await this.prisma.lab.create({
      data: {
        name: dto.labName,
        slug: slug + '-' + Date.now().toString(36),
        maxUsers: 2,
      },
    });
    const user = await this.prisma.user.create({
      data: {
        labId: lab.id,
        name: dto.adminName,
        email: dto.adminEmail ?? null,
        mobile: dto.adminMobile,
        passwordHash,
        role: 'admin',
      },
    });
    return this.issueTokens(user, lab);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.email ?? dto.mobile;
    const identifierKind = dto.email ? 'email' : dto.mobile ? 'mobile' : 'none';
    this.authStep('start', {
      identifierKind,
      hasPassword: Boolean(dto.password),
    });

    if (!identifier) throw new UnauthorizedException('Email or mobile required');

    try {
      this.authStep('prisma.user.findFirst:before', { identifierKind });
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { mobile: identifier }],
          isActive: true,
        },
        include: { lab: true },
      });
      this.authStep('prisma.user.findFirst:after', {
        found: Boolean(user),
        userId: user?.id ?? null,
        labId: user?.labId ?? null,
      });

      if (!user) throw new UnauthorizedException('Invalid credentials');

      this.authStep('bcrypt.compare:before');
      const ok = await bcrypt.compare(dto.password, user.passwordHash);
      this.authStep('bcrypt.compare:after', { passwordMatch: ok });
      if (!ok) throw new UnauthorizedException('Invalid credentials');

      this.authStep('prisma.user.update:lastLoginAt:before', { userId: user.id });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      this.authStep('prisma.user.update:lastLoginAt:after');

      this.authStep('issueTokens:before', { userId: user.id });
      const result = await this.issueTokens(user, user.lab);
      this.authStep('issueTokens:after');

      this.authStep('audit.log:before');
      await this.audit.log(user.labId, user.id, 'login', 'user', user.id, undefined, {
        at: new Date().toISOString(),
      });
      this.authStep('audit.log:after');

      this.authStep('success', { userId: user.id });
      return result;
    } catch (err) {
      if (err instanceof HttpException) {
        const status = err.getStatus();
        this.authStep('http_exception', { status, response: err.getResponse() });
        throw err;
      }
      this.logUnexpectedAuthError(err, 'login');
      throw err;
    }
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET,
      });
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token');
      const session = await this.prisma.userSession.findFirst({
        where: { refreshToken, userId: payload.sub },
        include: { user: { include: { lab: true } } },
      });
      if (!session || session.expiresAt < new Date()) throw new UnauthorizedException('Session expired');
      return this.issueTokens(session.user, session.user.lab);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(payload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { lab: true },
    });
    if (!user || !user.isActive || user.labId !== payload.labId) return null;
    return user;
  }

  private async issueTokens(
    user: { id: string; name: string; email: string | null; mobile: string; role: $Enums.UserRole; labId: string; languagePref: string },
    lab: { id: string; name: string },
  ): Promise<AuthResult> {
    const accessPayload: TokenPayload = {
      sub: user.id,
      labId: user.labId,
      role: user.role,
      type: 'access',
    };
    const refreshPayload: TokenPayload = { ...accessPayload, type: 'refresh' };
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-min-32-characters';
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-refresh-secret';
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: accessSecret,
      expiresIn: ACCESS_EXPIRY,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: REFRESH_EXPIRY,
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.userSession.create({
      data: {
        labId: user.labId,
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });
    const expiresIn = 3600;
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        labId: user.labId,
        labName: lab.name,
        languagePref: user.languagePref,
      },
    };
  }
}
