import { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/http.js';
import type { Transaction } from '../../lib/db.js';
import type { Principal } from '../auth/auth.js';

export function leadScope(user: Principal): Prisma.LeadWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role !== 'SALES') throw new ApiError(403, 'FORBIDDEN', 'Your role cannot access CRM');
  return { OR: [{ assignedToId: user.id }, { assignedToId: null, createdById: user.id }] };
}

export function customerScope(user: Principal): Prisma.CustomerWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role !== 'SALES') throw new ApiError(403, 'FORBIDDEN', 'Your role cannot access CRM');
  return { OR: [{ createdById: user.id }, { leads: { some: leadScope(user) } }] };
}

export async function requireCustomer(tx: Transaction, user: Principal, id: string, writable = false) {
  const customer = await tx.customer.findFirst({ where: { AND: [{ id }, customerScope(user)] } });
  if (!customer) throw new ApiError(404, 'NOT_FOUND', 'Customer not found');
  if (writable && customer.isArchived) throw new ApiError(409, 'CUSTOMER_ARCHIVED', 'Archived customers are read-only');
  return customer;
}

export async function requireLead(tx: Transaction, user: Principal, id: string, writable = false) {
  const lead = await tx.lead.findFirst({ where: { AND: [{ id }, leadScope(user)] } });
  if (!lead) throw new ApiError(404, 'NOT_FOUND', 'Lead not found');
  if (writable) await requireCustomer(tx, user, lead.customerId, true);
  return lead;
}

export async function requireSite(tx: Transaction, customerId: string, siteId: string) {
  const site = await tx.site.findUnique({ where: { id_customerId: { id: siteId, customerId } } });
  if (!site) throw new ApiError(422, 'SITE_CUSTOMER_MISMATCH', 'Site must belong to the selected customer');
  return site;
}

export function checkVersion(current: number, expected: number) {
  if (current !== expected) throw new ApiError(409, 'VERSION_CONFLICT', 'Record changed; refresh and use its current version');
}
