import type { LeadStatus, LeadPriority, Prisma } from '@prisma/client';
import { leadWhere, customerWhere, requireDepartment } from './access.service.js';
import { type Context, range, bounded, metric, series, ratio, LIMIT } from './common.js';
function where(c: Context): Prisma.LeadWhereInput { return { AND: [leadWhere(c), { createdAt: range(c), status: c.q.status as LeadStatus | undefined, priority: c.q.priority as LeadPriority | undefined }] }; }
export async function salesSummary(c: Context) {
    requireDepartment(c, 'sales');
    const w = where(c), tx = c.tx;
    const [total, customers, byStatus, bySource, byPriority, orders] = await Promise.all([tx.lead.count({ where: w }), tx.customer.count({ where: { AND: [customerWhere(c), { createdAt: range(c) }] } }), tx.lead.groupBy({ by: ['status'], where: w, _count: { _all: true }, orderBy: { status: 'asc' } }), tx.lead.groupBy({ by: ['source'], where: w, _count: { _all: true }, orderBy: { source: 'asc' } }), tx.lead.groupBy({ by: ['priority'], where: w, _count: { _all: true }, orderBy: { priority: 'asc' } }), tx.financeSalesOrder.count({ where: { quotation: { lead: w }, createdAt: range(c) } })]);
    return { totalLeads: metric(total, 'Lead', 'Created in interval; current status and priority filters apply'), totalCustomers: metric(customers, 'Customer', 'Scoped customers created in interval; lead status/priority do not alter customer count'), qualifiedLeads: metric(byStatus.filter(r => r.status === 'QUALIFIED').reduce((n, r) => n + r._count._all, 0), 'Lead', 'Current QUALIFIED in creation cohort'), lostOrDisqualified: metric(byStatus.filter(r => ['LOST', 'DISQUALIFIED'].includes(r.status)).reduce((n, r) => n + r._count._all, 0), 'Lead', 'Current LOST or DISQUALIFIED in creation cohort'), acceptedSalesOrders: metric(orders, 'FinanceSalesOrder', 'Accepted commercial orders created in interval for this lead creation cohort; each order counted once'), byStatus, bySource, byPriority, distributionBasis: 'CURRENT_STATE_OF_LEAD_CREATION_COHORT' };
}
export async function conversions(c: Context) {
    requireDepartment(c, 'sales');
    const base = where(c), tx = c.tx, until = { lt: c.to };
    const count = (extra: Prisma.LeadWhereInput) => tx.lead.count({ where: { AND: [base, extra] } });
    const [leads, qualified, survey, design, accepted, ordered] = await Promise.all([
        count({}), count({ statusHistory: { some: { toStatus: { in: ['QUALIFIED', 'SURVEY_REQUESTED'] }, createdAt: until } } }), count({ surveys: { some: { createdAt: until } } }), count({ configurations: { some: { reviews: { some: { decision: 'APPROVED', createdAt: until } } } } }), count({ financeQuotes: { some: { status: 'ACCEPTED', acceptedAt: until } } }), count({ financeQuotes: { some: { order: { createdAt: until } } } })
    ]);
    return { cohort: 'DISTINCT_LEADS_CREATED_IN_INTERVAL_CURRENT_STATUS_FILTER_OPTIONAL', progression: 'EACH_MILESTONE_EVER_REACHED_BEFORE_TO_NOT_ADJACENT_STAGE_ATTRITION', source: 'Lead,LeadStatusHistory,SiteSurvey,SolarConfigurationReview,FinanceQuotation,FinanceSalesOrder', stages: [{ stage: 'LEAD', ...ratio(leads, leads) }, { stage: 'EVER_QUALIFIED', ...ratio(qualified, leads) }, { stage: 'SURVEY_REQUESTED', ...ratio(survey, leads) }, { stage: 'CONFIGURATION_APPROVED', ...ratio(design, leads) }, { stage: 'CUSTOMER_QUOTATION_ACCEPTED', ...ratio(accepted, leads) }, { stage: 'ACCEPTED_ORDER', ...ratio(ordered, leads) }], dropOffRate: null, reason: 'Milestones may be revised/reopened and are not a strictly nested current-stage funnel' };
}
export async function salesTrends(c: Context) { requireDepartment(c, 'sales'); const rows = bounded(await c.tx.lead.findMany({ where: where(c), select: { createdAt: true }, take: LIMIT + 1, orderBy: { id: 'asc' } })); return { source: 'Lead.createdAt', definition: 'Lead creation events in authorized cohort', data: series(c, rows.map(r => r.createdAt)) }; }
