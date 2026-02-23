/**
 * Re-export Prisma types and enums from the generated client so that TypeScript
 * resolves them even when @prisma/client path mapping is not applied (e.g. some IDEs).
 */
export type { Prisma } from '../../../../node_modules/.prisma/client';
export { PrismaClient, $Enums } from '../../../../node_modules/.prisma/client';
