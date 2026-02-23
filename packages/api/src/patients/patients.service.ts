import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient, Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(labId: string, dto: CreatePatientDto) {
    const patientCode = await this.generatePatientCode(labId);
    const data: Prisma.PatientUncheckedCreateInput = {
      labId,
      patientCode,
      name: dto.name,
      nameMl: dto.nameMl ?? null,
      ageYears: dto.ageYears ?? null,
      ageMonths: dto.ageMonths ?? null,
      ageDays: dto.ageDays ?? null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      gender: dto.gender,
      mobile: dto.mobile,
      email: dto.email ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      pincode: dto.pincode ?? null,
      abhaId: dto.abhaId ?? null,
      notes: dto.notes ?? null,
    };
    return this.prisma.patient.create({ data });
  }

  async findAll(labId: string, search?: string, limit = 50) {
    const where: Prisma.PatientWhereInput = { labId, deletedAt: null };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { patientCode: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.patient.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async findOne(labId: string, id: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({
      where: { id, labId, deletedAt: null },
    });
  }

  private async generatePatientCode(labId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LC-${today}-`;
    const last = await this.prisma.patient.findFirst({
      where: { labId, patientCode: { startsWith: prefix } },
      orderBy: { patientCode: 'desc' },
      select: { patientCode: true },
    });
    const nextNum = last
      ? parseInt(last.patientCode.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }
}
