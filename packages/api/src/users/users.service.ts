import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    async findAll(labId: string) {
        return this.prisma.user.findMany({
            where: { labId },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                qualification: true,
                registrationNo: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(labId: string, adminId: string, dto: CreateUserDto) {
        // Check max users limit
        const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
        if (!lab) throw new NotFoundException('Lab not found');

        const currentUserCount = await this.prisma.user.count({ where: { labId, isActive: true } });
        if (currentUserCount >= lab.maxUsers) {
            throw new BadRequestException(`Maximum users limit (${lab.maxUsers}) for your subscription plan reached.`);
        }

        // Check uniqueness
        const existing = await this.prisma.user.findUnique({
            where: { labId_mobile: { labId, mobile: dto.mobile } },
        });
        if (existing) {
            throw new BadRequestException('A user with this mobile number already exists in this lab.');
        }

        const plainPassword = dto.password || crypto.randomBytes(4).toString('hex');
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                labId,
                name: dto.name,
                email: dto.email,
                mobile: dto.mobile,
                role: dto.role,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                isActive: true,
            },
        });

        await this.audit.log(labId, adminId, 'user_create', 'user', user.id, undefined, user);

        return { user, tempPassword: dto.password ? undefined : plainPassword };
    }

    async update(labId: string, id: string, adminId: string, dto: UpdateUserDto) {
        const existing = await this.prisma.user.findFirst({ where: { id, labId } });
        if (!existing) throw new NotFoundException('User not found');

        if (dto.mobile && dto.mobile !== existing.mobile) {
            const collision = await this.prisma.user.findUnique({
                where: { labId_mobile: { labId, mobile: dto.mobile } },
            });
            if (collision) {
                throw new BadRequestException('Mobile number is already in use.');
            }
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.mobile && { mobile: dto.mobile }),
                ...(dto.role && { role: dto.role }),
                ...(dto.qualification !== undefined && { qualification: dto.qualification }),
                ...(dto.registrationNo !== undefined && { registrationNo: dto.registrationNo }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                qualification: true,
                registrationNo: true,
                isActive: true,
            },
        });

        await this.audit.log(labId, adminId, 'user_update', 'user', updated.id, {
            name: existing.name,
            email: existing.email,
            mobile: existing.mobile,
            role: existing.role,
        }, {
            name: updated.name,
            email: updated.email,
            mobile: updated.mobile,
            role: updated.role,
        });

        return updated;
    }

    async resetPassword(labId: string, id: string, adminId: string, newPassword?: string) {
        const existing = await this.prisma.user.findFirst({ where: { id, labId } });
        if (!existing) throw new NotFoundException('User not found');

        const plainPassword = newPassword || crypto.randomBytes(4).toString('hex');
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });

        await this.audit.log(labId, adminId, 'user_reset_password', 'user', id);

        return { tempPassword: plainPassword };
    }

    async deactivate(labId: string, id: string, adminId: string) {
        const existing = await this.prisma.user.findFirst({ where: { id, labId } });
        if (!existing) throw new NotFoundException('User not found');

        if (existing.id === adminId) {
            throw new BadRequestException('You cannot deactivate your own account.');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        await this.audit.log(labId, adminId, 'user_deactivate', 'user', id);

        return { id: updated.id, isActive: updated.isActive };
    }
}
