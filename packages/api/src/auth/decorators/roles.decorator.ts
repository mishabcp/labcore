import { SetMetadata } from '@nestjs/common';
import type { $Enums } from '@prisma/client';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: $Enums.UserRole[]) => SetMetadata(ROLES_KEY, roles);
