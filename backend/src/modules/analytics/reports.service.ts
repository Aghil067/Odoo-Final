import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/http.js';
import { leadScope, customerScope } from '../crm/access.js';
import { scope as installationScope } from '../installations/common.js';
import { customerScope as financeScope } from '../finance/common.js';
import { type Context, page, paging } from './common.js';
import { allowed, leadWhere, surveyWhere, solarWhere, installationWhere, financeOrderWhere } from './access.service.js';
import { overview } from './overview.service.js';
import { salesSummary } from './sales.service.js';
import { surveys } from './surveys.service.js';
import { solar } from './solar.service.js';
import { installations } from './installations.service.js';
import { warranties } from './warranties.service.js';
import { service } from './service.service.js';
import { financeSummary } from './finance.service.js';
function projectScope(c: Context): Prisma.InstallationJobWhereInput {
    if (c.user.role === 'ADMIN' || c.user.role === 'WAREHOUSE')
        return {};
    if (c.user.role === 'SALES')
        return { lead: leadScope(c.user) };
    if (c.user.role === 'TECHNICIAN')
        return { OR: [installationScope(c.user), { serviceTickets: { some: { assignments: { some: { userId: c.user.id, endedAt: null } } } } }] };
    if (c.user.role === 'FINANCE')
        return { customer: financeScope(c.user) };
    return { OR: [{ warrantyAccessGrants: { some: { userId: c.user.id, isActive: true } } }, { serviceAccess: { some: { userId: c.user.id, role: 'SUPPORT', isActive: true } } }] };
}
async function sections(c: Context) {
    const sections: Record<string, unknown> = {};
    sections.crm = allowed(c, 'sales') ? await salesSummary(c) : null;
    sections.surveys = allowed(c, 'surveys') ? await surveys(c) : null;
    sections.design = allowed(c, 'solar') ? await solar(c, 'summary') : null;
    sections.installations = allowed(c, 'installations') ? await installations(c, 'summary') : null;
    sections.warranty = allowed(c, 'warranties') ? await warranties(c, 'summary') : null;
    sections.service = allowed(c, 'service') ? await service(c, 'summary') : null;
    sections.finance = allowed(c, 'finance') ? await financeSummary(c) : null;
    return sections;
}
export async function projectReport(c: Context, id: string) {
    const job = await c.tx.installationJob.findFirst({ where: { AND: [{ id }, projectScope(c)] }, select: { id: true, reference: true, customerId: true, siteId: true, leadId: true, configurationId: true, reservationId: true, dispatchId: true, configuration: { select: { approvedSurveyId: true } } } });
    if (!job)
        throw new ApiError(404, 'NOT_FOUND', 'Authorized installation project not found');
    const scoped = { ...c, q: { ...c.q, installationId: job.id, customerId: job.customerId, siteId: job.siteId } }, data = await sections(scoped);
    if (['ADMIN', 'WAREHOUSE', 'FINANCE'].includes(c.user.role))
        data.inventory = { reservation: await c.tx.stockReservation.findFirst({ where: { id: job.reservationId, configurationId: job.configurationId }, select: { id: true, reference: true, status: true, warehouseId: true, bomId: true, bomVersion: true } }), dispatch: await c.tx.stockDispatch.findFirst({ where: { id: job.dispatchId, reservationId: job.reservationId }, select: { id: true, reference: true, status: true, warehouseId: true, dispatchedAt: true } }), definition: 'Exact M05 linked M04 warehouse release; not proof of site delivery or installation completion' };
    else
        data.inventory = null;
    const references: Record<string, unknown> = {};
    references.lead = allowed(c, 'sales') ? await c.tx.lead.findFirst({ where: { AND: [leadWhere(scoped), { id: job.leadId }] }, select: { id: true, reference: true, status: true, source: true, priority: true } }) : null;
    references.survey = allowed(c, 'surveys') ? await c.tx.siteSurvey.findFirst({ where: { AND: [surveyWhere(scoped), { id: job.configuration.approvedSurveyId }] }, select: { id: true, reference: true, status: true, approvedVersion: true } }) : null;
    references.configuration = allowed(c, 'solar') ? await c.tx.solarConfiguration.findFirst({ where: { AND: [solarWhere(scoped), { id: job.configurationId }] }, select: { id: true, reference: true, status: true, approvedVersion: true, systemType: true, targetCapacityKw: true } }) : null;
    references.installation = allowed(c, 'installations') ? await c.tx.installationJob.findFirst({ where: installationWhere(scoped), select: { id: true, status: true, configurationApprovedVersion: true, configurationReviewId: true, bomId: true, bomVersion: true, plannedStartAt: true, plannedEndAt: true, actualStartAt: true, actualEndAt: true, deliveryConfirmedAt: true, commissionedAt: true } }) : null;
    if (allowed(c, 'finance')) {
        const where = financeOrderWhere(scoped);
        references.orders = page(await c.tx.financeSalesOrder.findMany({ where, ...paging(c.q), select: { id: true, reference: true, quotationId: true, acceptedAt: true, currency: true, totalAmount: true }, orderBy: { id: 'asc' } }), await c.tx.financeSalesOrder.count({ where }), c.q);
    }
    else
        references.orders = null;
    return { project: { id: job.id, reference: job.reference, ...(c.user.role === 'WAREHOUSE' ? {} : { customerId: job.customerId, siteId: job.siteId, leadId: job.leadId }) }, sections: data, references, definition: 'Project ID is InstallationJob UUID. Sections retain original role/grant scope and event/cohort semantics; null means forbidden. References are exact project identity/current stored state independent of metric date cohort; financial references are paginated. No private evidence or notes returned.' };
}
export async function customerReport(c: Context, id: string) {
    if (!['ADMIN', 'SALES', 'FINANCE'].includes(c.user.role))
        throw new ApiError(403, 'ANALYTICS_CUSTOMER_SCOPE', 'Customer reports require CRM or explicit financial customer authority');
    const customer = await c.tx.customer.findFirst({ where: { AND: [{ id }, c.user.role === 'FINANCE' ? financeScope(c.user) : customerScope(c.user)] }, select: { id: true, reference: true } });
    if (!customer)
        throw new ApiError(404, 'NOT_FOUND', 'Authorized customer not found');
    const scoped = { ...c, q: { ...c.q, customerId: id } }, where = { AND: [projectScope(c), { customerId: id }] };
    return { customer, sections: await sections(scoped), projects: page(await c.tx.installationJob.findMany({ where, ...paging(c.q), select: { id: true, reference: true }, orderBy: { id: 'asc' } }), await c.tx.installationJob.count({ where }), c.q), definition: 'Customer-owned sections under each original authority; no contacts, private financial/warranty evidence, or unrelated projects' };
}
export async function operations(c: Context) { return { overview: await overview(c), definition: 'Read-only role-scoped consolidated operations; forbidden/unreliable metrics null', migration: 'M10 introduces no Prisma migration.' }; }
