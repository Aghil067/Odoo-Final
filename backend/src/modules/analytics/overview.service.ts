import { allowed, customerWhere, leadWhere, surveyWhere, solarWhere, installationWhere, technicianWhere, warrantyWhere, serviceWhere } from './access.service.js';
import { type Context, range, metric, unavailable } from './common.js';
import { inventory } from './inventory.service.js';
import { financeSummary } from './finance.service.js';
import { civil } from '../warranties/dates.js';
export async function overview(c: Context) {
    const tx = c.tx, cohort = { createdAt: range(c) }, m: Record<string, unknown> = {};
    const denied = (keys: string[], reason = 'Role does not authorize this department') => {
        for (const key of keys)
            m[key] = unavailable(reason);
    };
    if (allowed(c, 'sales')) {
        const [customers, leads, qualified] = await Promise.all([tx.customer.count({ where: { AND: [customerWhere(c), cohort] } }), tx.lead.count({ where: { AND: [leadWhere(c), cohort] } }), tx.lead.count({ where: { AND: [leadWhere(c), cohort, { status: 'QUALIFIED' }] } })]);
        m.totalCustomers = metric(customers, 'Customer', 'Scoped customers created in interval');
        m.totalLeads = metric(leads, 'Lead', 'Scoped leads created in interval');
        m.qualifiedLeads = metric(qualified, 'Lead.status', 'Current QUALIFIED in lead creation cohort');
    }
    else
        denied(['totalCustomers', 'totalLeads', 'qualifiedLeads']);
    if (allowed(c, 'surveys')) {
        m.pendingSurveys = metric(await tx.siteSurvey.count({ where: { AND: [surveyWhere(c), cohort, { status: { in: ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED'] } }] } }), 'SiteSurvey.status', 'Nonterminal survey assessments in creation cohort');
        m.approvedSurveys = metric(await tx.siteSurvey.count({ where: { AND: [surveyWhere(c), cohort, { status: 'APPROVED' }] } }), 'SiteSurvey.status', 'Current APPROVED assessments in creation cohort');
    }
    else
        denied(['pendingSurveys', 'approvedSurveys']);
    if (allowed(c, 'solar'))
        m.approvedSolarConfigurations = metric(await tx.solarConfiguration.count({ where: { AND: [solarWhere(c), cohort, { status: 'APPROVED', nextRevision: null }] } }), 'SolarConfiguration', 'Latest current APPROVED configuration revisions created in interval');
    else
        denied(['approvedSolarConfigurations']);
    if (allowed(c, 'installations')) {
        m.activeInstallationJobs = metric(await tx.installationJob.count({ where: { AND: [installationWhere(c), cohort, { status: { notIn: ['COMMISSIONED', 'CANCELED'] } }] } }), 'InstallationJob.status', 'Nonterminal jobs created in interval');
        m.commissionedInstallations = metric(await tx.installationJob.count({ where: { AND: [installationWhere(c), { status: 'COMMISSIONED', commissionedAt: range(c) }] } }), 'InstallationJob.commissionedAt', 'Internal commissioning events in interval, not dispatch or external certification');
    }
    else
        denied(['activeInstallationJobs', 'commissionedInstallations']);
    if (allowed(c, 'technicians') && !c.q.customerId && !c.q.siteId && !c.q.installationId)
        m.activeTechnicians = metric(await tx.user.count({ where: { AND: [technicianWhere(c), { isActive: true, technicianProfile: { isActive: true, employmentStatus: 'ACTIVE' } }] } }), 'User,TechnicianProfile', 'Current active technician identity and ACTIVE profile; not attendance');
    else
        denied(['activeTechnicians'], 'Department unauthorized or project filter does not define workforce employment scope');
    if (allowed(c, 'inventory') && !c.q.customerId && !c.q.siteId && !c.q.installationId && !c.q.technicianId) {
        const data = await inventory(c, 'summary');
        m.inventoryShortages = 'inventoryShortages' in data ? data.inventoryShortages : null;
    }
    else
        denied(['inventoryShortages'], 'Department unauthorized or project filters cannot be applied to warehouse balances');
    if (allowed(c, 'service')) {
        const w = { AND: [serviceWhere(c), { openedAt: range(c), status: { notIn: ['RESOLVED' as const, 'CLOSED' as const, 'CANCELLED' as const] } }] };
        m.openServiceTickets = metric(await tx.serviceTicket.count({ where: w }), 'ServiceTicket.status', 'Current unresolved opened-in-interval tickets');
        m.criticalUnresolvedTickets = metric(await tx.serviceTicket.count({ where: { AND: [w, { priority: 'CRITICAL' }] } }), 'ServiceTicket.priority,status', 'CRITICAL unresolved within opened cohort');
    }
    else
        denied(['openServiceTickets', 'criticalUnresolvedTickets']);
    if (allowed(c, 'warranties') && !c.q.technicianId) {
        const w = { AND: [warrantyWhere(c), cohort] };
        m.activeWarrantyRegistrations = metric(await tx.warrantyRegistration.count({ where: { AND: [w, { status: 'ACTIVE', verifiedStartDate: { lte: civil(c.asOf) }, expiresAt: { gt: civil(c.asOf) } }] } }), 'WarrantyRegistration', 'Current activated coverage in registration creation cohort, verified UTC start<=today<exclusive expiry');
        m.warrantyClaimsPendingReview = metric(await tx.warrantyClaim.count({ where: { registration: warrantyWhere(c), createdAt: range(c), status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REQUIRED'] } } }), 'WarrantyClaim.status', 'SUBMITTED/UNDER_REVIEW/EVIDENCE_REQUIRED claims created in interval');
    }
    else
        denied(['activeWarrantyRegistrations', 'warrantyClaimsPendingReview']);
    if (allowed(c, 'finance') && !c.q.technicianId)
        m.finance = await financeSummary(c);
    else
        m.finance = unavailable('Finance grants and ADMIN/FINANCE role required; technician filter does not define financial ownership');
    return { metrics: m, definition: 'Every interval KPI declares its cohort/event source; current snapshots are labelled. Null is unavailable/unauthorized, never fabricated zero. Finance money is Decimal string by currency.', dataAsOf: c.asOf };
}
