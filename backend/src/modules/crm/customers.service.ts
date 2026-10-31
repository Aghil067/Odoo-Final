import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { atomic, type Transaction } from '../../lib/db.js';
import { ApiError, pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { checkVersion, customerScope, leadScope, requireCustomer } from './access.js';
import * as v from './validation.js';

export const openStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'SURVEY_REQUESTED'] as const;

async function duplicateWarnings(tx: Transaction, user: Principal, phone: string, email?: string | null, excludeId?: string) {
  const matches = await tx.customer.findMany({
    where: { AND: [customerScope(user), { ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ normalizedPhone: phone }, ...(email ? [{ email }] : [])] }] },
    select: { id: true, reference: true, name: true }, take: 10, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return matches.length ? [{ code: 'POSSIBLE_DUPLICATE', message: 'Visible customers share this phone or email; review before treating them as the same person', matches }] : [];
}

export function createCustomer(user: Principal, input: z.infer<typeof v.createCustomer>) {
  return atomic(async tx => {
    const normalizedPhone = v.normalizePhone(input.phone)!;
    const warnings = await duplicateWarnings(tx, user, normalizedPhone, input.email);
    const customer = await tx.customer.create({ data: { ...input, normalizedPhone, reference: `CUS-${randomUUID()}`, createdById: user.id } });
    return { customer, warnings };
  });
}

export function listCustomers(user: Principal, query: z.infer<typeof v.customerQuery>) {
  return atomic(async tx => {
    const { page, pageSize, q } = query;
    const normalized = q ? v.normalizePhone(q) : undefined;
    const where: Prisma.CustomerWhereInput = { AND: [customerScope(user), {
      isArchived: query.archived === 'true', type: query.type,
      ...(q ? { OR: [
        { name: { contains: q, mode: 'insensitive' } }, { reference: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } }, ...(normalized ? [{ normalizedPhone: normalized }] : []),
      ] } : {}),
    }] };
    const total = await tx.customer.count({ where });
    const data = await tx.customer.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}

export function customerDetail(user: Principal, id: string) {
  return atomic(async tx => {
    const customer = await requireCustomer(tx, user, id);
    const sitesWhere = { customerId: id };
    const leadsWhere = { AND: [{ customerId: id }, leadScope(user)] };
    const sites = await tx.site.findMany({ where: sitesWhere, take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    const leads = await tx.lead.findMany({ where: leadsWhere, take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    return { ...customer, sites, leads, sitesPagination: pagination(1, 20, await tx.site.count({ where: sitesWhere })), leadsPagination: pagination(1, 20, await tx.lead.count({ where: leadsWhere })) };
  });
}

export function updateCustomer(user: Principal, id: string, input: z.infer<typeof v.updateCustomer>) {
  return atomic(async tx => {
    const current = await requireCustomer(tx, user, id, true);
    checkVersion(current.version, input.version);
    const { version, ...fields } = input;
    const normalizedPhone = fields.phone ? v.normalizePhone(fields.phone)! : current.normalizedPhone;
    const warnings = await duplicateWarnings(tx, user, normalizedPhone, fields.email === undefined ? current.email : fields.email, id);
    const customer = await tx.customer.update({ where: { id, version }, data: { ...fields, normalizedPhone, version: { increment: 1 } } });
    return { customer, warnings };
  });
}

export function archiveCustomer(user: Principal, id: string, version: number) {
  return atomic(async tx => {
    const current = await requireCustomer(tx, user, id);
    checkVersion(current.version, version);
    if (current.isArchived) return current;
    // Includes all leads, even ones not visible to the salesperson.
    if (await tx.lead.count({ where: { customerId: id, status: { in: [...openStatuses] } } })) {
      throw new ApiError(409, 'ACTIVE_LEADS_EXIST', 'Close active leads before archiving this customer');
    }
    return tx.customer.update({ where: { id, version }, data: { isArchived: true, archivedAt: new Date(), version: { increment: 1 } } });
  });
}
