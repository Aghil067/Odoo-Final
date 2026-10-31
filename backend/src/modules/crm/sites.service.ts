import { z } from 'zod';
import { atomic } from '../../lib/db.js';
import { ApiError, pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { checkVersion, requireCustomer } from './access.js';
import * as v from './validation.js';

export function createSite(user: Principal, customerId: string, input: z.infer<typeof v.createSite>) {
  return atomic(async tx => {
    await requireCustomer(tx, user, customerId, true);
    return tx.site.create({ data: { ...input, customerId } });
  });
}

export function listSites(user: Principal, customerId: string, query: z.infer<typeof v.timelineQuery>) {
  return atomic(async tx => {
    await requireCustomer(tx, user, customerId);
    const { page, pageSize } = query;
    const where = { customerId };
    const total = await tx.site.count({ where });
    const data = await tx.site.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}

export function siteDetail(user: Principal, id: string) {
  return atomic(async tx => {
    const site = await tx.site.findUnique({ where: { id } });
    if (!site) throw new ApiError(404, 'NOT_FOUND', 'Site not found');
    await requireCustomer(tx, user, site.customerId);
    return site;
  });
}

export function updateSite(user: Principal, id: string, input: z.infer<typeof v.updateSite>) {
  return atomic(async tx => {
    const site = await tx.site.findUnique({ where: { id } });
    if (!site) throw new ApiError(404, 'NOT_FOUND', 'Site not found');
    await requireCustomer(tx, user, site.customerId, true);
    checkVersion(site.version, input.version);
    const { version, ...fields } = input;
    return tx.site.update({ where: { id, version }, data: { ...fields, version: { increment: 1 } } });
  });
}
