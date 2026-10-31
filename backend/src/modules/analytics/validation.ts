import { z } from 'zod';
import { pageQuery, uuid } from '../crm/validation.js';
import { FinanceCurrency, LeadStatus, LeadPriority, SurveyStatus, SolarConfigurationStatus, InstallationStatus, ServiceTicketStatus, ServicePriority, WarrantyRegistrationStatus, WarrantyClaimStatus, StockMovementType } from '@prisma/client';
const stamp = z.iso.datetime({ offset: true }).refine(s => s.slice(0, 4) >= '1900', 'Use dates from1900 onward');
export const fields = { from: stamp.optional(), to: stamp.optional(), groupBy: z.enum(['day', 'week', 'month']).default('month'), customerId: uuid.optional(), siteId: uuid.optional(), installationId: uuid.optional(), warehouseId: uuid.optional(), technicianId: uuid.optional(), currency: z.enum(FinanceCurrency).optional(), status: z.string().min(1).max(60).optional(), priority: z.string().min(1).max(20).optional(), days: z.coerce.number().int().min(1).max(90).default(30), ...pageQuery.shape };
export const all = z.strictObject(fields);
export type Query = z.infer<typeof all>;
type Key = keyof typeof fields;
export function query(keys: Key[], status?: z.ZodType, priority?: z.ZodType) {
    const shape: Record<string, z.ZodType> = {};
    for (const key of keys)
        shape[key] = fields[key];
    if (status)
        shape.status = status.optional();
    if (priority)
        shape.priority = priority.optional();
    return z.strictObject(shape).transform(v => v as Partial<Query>);
}
export const projectKeys: Key[] = ['from', 'to', 'customerId', 'siteId', 'installationId', 'technicianId'];
export const pages: Key[] = ['page', 'pageSize'];
export const statuses = { sales: z.enum(LeadStatus), surveys: z.enum(SurveyStatus), solar: z.enum(SolarConfigurationStatus), installations: z.enum(InstallationStatus), service: z.enum(ServiceTicketStatus), warranties: z.enum(WarrantyRegistrationStatus), claims: z.enum(WarrantyClaimStatus), movements: z.enum(StockMovementType) };
export const priorities = { sales: z.enum(LeadPriority), service: z.enum(ServicePriority) };
export const path = z.strictObject({ id: uuid });
