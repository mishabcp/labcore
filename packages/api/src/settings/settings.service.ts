import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateLabSettingsDto } from './dto/update-lab-settings.dto';

const LABS_BUCKET = 'labs';

@Injectable()
export class SettingsService {
    private supabase: SupabaseClient | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (url && key && !url.includes('[')) {
            this.supabase = createClient(url, key);
        }
    }

    async getLabSettings(labId: string) {
        const lab = await this.prisma.lab.findUnique({
            where: { id: labId },
        });
        if (!lab) throw new NotFoundException('Lab not found');

        // Convert storage paths to public URLs if Supabase is configured
        let logoUrl = lab.logoUrl;

        // signatureUrl might be in the settings JSON or directly on the model (for older migrations)
        const settings = lab.settings as any;
        let signatureUrl = settings?.signatureUrl || (lab as any).signatureUrl || null;

        if (this.supabase) {
            if (logoUrl && !logoUrl.startsWith('http')) {
                const { data } = this.supabase.storage.from(LABS_BUCKET).getPublicUrl(logoUrl);
                logoUrl = data.publicUrl;
            }
            if (signatureUrl && !signatureUrl.startsWith('http')) {
                const { data } = this.supabase.storage.from(LABS_BUCKET).getPublicUrl(signatureUrl);
                signatureUrl = data.publicUrl;
            }
        }

        return { ...lab, logoUrl, signatureUrl };
    }

    async updateLabSettings(labId: string, adminId: string, dto: UpdateLabSettingsDto) {
        const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
        if (!lab) throw new NotFoundException('Lab not found');

        const existingSettings = (lab.settings as any) ?? {};

        // Separate top-level fields from JSON settings
        const {
            name, address, phone, email, website, gstin, nablCertNo,
            ...otherSettings
        } = dto as any;

        const newSettings = { ...existingSettings, ...otherSettings };

        const updated = await this.prisma.lab.update({
            where: { id: labId },
            data: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(website !== undefined && { website }),
                ...(gstin !== undefined && { gstin }),
                ...(nablCertNo !== undefined && { nablCertNo }),
                settings: newSettings,
            },
        });

        await this.audit.log(labId, adminId, 'lab_update', 'lab', labId, lab, updated);

        return updated;
    }

    async uploadLogo(labId: string, adminId: string, file: Express.Multer.File) {
        return this.uploadAsset(labId, adminId, file, 'logo');
    }

    async uploadSignature(labId: string, adminId: string, file: Express.Multer.File) {
        return this.uploadAsset(labId, adminId, file, 'signature');
    }

    private async uploadAsset(labId: string, adminId: string, file: Express.Multer.File, type: 'logo' | 'signature') {
        if (!this.supabase) {
            throw new BadRequestException('Storage is not configured');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        // Limit to 2MB
        if (file.size > 2 * 1024 * 1024) {
            throw new BadRequestException('Image size must be less than 2MB');
        }

        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'png';
        const filename = `${labId}/${type}-${Date.now()}.${ext}`;

        const { error } = await this.supabase.storage
            .from(LABS_BUCKET)
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw new BadRequestException(`Failed to upload ${type}: ${error.message}`);
        }

        const targetField = type === 'logo' ? 'logoUrl' : 'settings';

        // Get old lab data for audit
        const oldLab = await this.prisma.lab.findUnique({ where: { id: labId } });

        let updateData: any = {};
        if (type === 'logo') {
            updateData.logoUrl = filename;
        } else {
            const currentSettings = (oldLab?.settings as any) || {};
            updateData.settings = { ...currentSettings, signatureUrl: filename };
        }

        const updated = await this.prisma.lab.update({
            where: { id: labId },
            data: updateData,
        });

        await this.audit.log(labId, adminId, `lab_upload_${type}`, 'lab', labId, { [targetField]: (oldLab as any)?.[targetField] }, { [targetField]: filename });

        const { data: publicUrlData } = this.supabase.storage.from(LABS_BUCKET).getPublicUrl(filename);

        return { url: publicUrlData.publicUrl, path: filename };
    }
}
