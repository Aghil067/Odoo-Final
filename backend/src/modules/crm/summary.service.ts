import { atomic } from '../../lib/db.js';
import { pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { customerScope, leadScope } from './access.js';
import { openStatuses } from './customers.service.js';
import { z } from 'zod';
import { salespersonQuery } from './validation.js';

export function crmSummary(user: Principal) {
  return atomic(async tx => {
    const scope = leadScope(user);
    const now = new Date();
    const upcomingUntil = new Date(now.getTime() + 7 * 86400_000);
    const byStatus = await tx.lead.groupBy({ by: ['status'], where: scope, _count: { _all: true }, orderBy: { status: 'asc' } });
    const bySource = await tx.lead.groupBy({ by: ['source'], where: scope, _count: { _all: true }, orderBy: { source: 'asc' } });
    const totalLeads = byStatus.reduce((sum, group) => sum + group._count._all, 0);
    const count = (status: string) => byStatus.find(group => group.status === status)?._count._all ?? 0;
    const qualifiedEver = await tx.lead.count({ where: { AND: [scope, { statusHistory: { some: { toStatus: { in: ['QUALIFIED', 'SURVEY_REQUESTED'] } } } }] } });
    const upcomingWhere = { AND: [scope, { status: { in: [...openStatuses] }, nextFollowUpAt: { gte: now, lte: upcomingUntil } }] };
    const overdueWhere = { AND: [scope, { status: { in: [...openStatuses] }, nextFollowUpAt: { lt: now } }] };
    const select = { id: true, reference: true, customerId: true, nextFollowUpAt: true, assignedToId: true } as const;
    const orderBy = [{ nextFollowUpAt: 'asc' as const }, { id: 'asc' as const }];
    return {
      asOf: now, upcomingUntil,
      totalCustomers: await tx.customer.count({ where: { AND: [customerScope(user), { isArchived: false }] } }),
      totalLeads, newLeads: count('NEW'), qualifiedLeads: count('QUALIFIED'), surveyRequests: count('SURVEY_REQUESTED'), lostLeads: count('LOST'),
      leadsByStatus: byStatus.map(group => ({ status: group.status, count: group._count._all })),
      leadsBySource: bySource.map(group => ({ source: group.source, count: group._count._all })),
      upcomingFollowUps: { total: await tx.lead.count({ where: upcomingWhere }), items: await tx.lead.findMany({ where: upcomingWhere, select, orderBy, take: 10 }) },
      overdueFollowUps: { total: await tx.lead.count({ where: overdueWhere }), items: await tx.lead.findMany({ where: overdueWhere, select, orderBy, take: 10 }) },
      qualifiedEver,
      qualificationConversionRate: totalLeads ? Math.round(qualifiedEver / totalLeads * 10000) / 100 : 0,
    };
  });
}

export function salespeople(query: z.infer<typeof salespersonQuery>) {
  return atomic(async tx => {
    const { page, pageSize, q } = query;
    const where = { role: 'SALES' as const, isActive: true, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {}) };
    const total = await tx.user.count({ where });
    const data = await tx.user.findMany({ where, select: { id: true, name: true, email: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }], take: pageSize, skip: (page - 1) * pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
