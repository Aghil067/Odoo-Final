import { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/http.js';
import { civil, addDays } from '../warranties/dates.js';
import { type Context, range, bounded, page, LIMIT } from './common.js';
import { allowed, surveyWhere, installationWhere, technicianWhere, warrantyWhere, serviceWhere, financeCustomerWhere, financeOrderWhere } from './access.service.js';
import { invoiceBalances } from '../finance/balances.js';
import { technicians } from './technicians.service.js';
type Alert = {
    id: string;
    type: string;
    severity: 'WARNING' | 'CRITICAL' | 'INFO';
    sourceModule: string;
    relatedRecordId: string;
    timestamp: Date;
    timestampBasis: string;
    explanation: string;
    navigation: {
        path: string;
        recordId: string;
    };
};
export async function alerts(c: Context) {
    const out: Alert[] = [], excludedSources: string[] = [];
    const add = (type: string, severity: Alert['severity'], sourceModule: string, id: string, at: Date, explanation: string, path: string, timestampBasis = 'SOURCE_RECORDED_TIME') => out.push({ id: `${type}:${id}`, type, severity, sourceModule, relatedRecordId: id, timestamp: at, timestampBasis, explanation, navigation: { path, recordId: id } });
    if (allowed(c, 'surveys'))
        for (const r of bounded(await c.tx.siteSurvey.findMany({ where: { AND: [surveyWhere(c), { status: 'SUBMITTED', submittedAt: range(c) }] }, select: { id: true, submittedAt: true }, take: LIMIT + 1 })))
            add('SURVEY_REVIEW', 'WARNING', 'M02', r.id, r.submittedAt!, 'Submitted field assessment requires internal review', '/surveys/approvals');
    if (allowed(c, 'installations')) {
        const jobs = installationWhere(c);
        for (const r of bounded(await c.tx.installationIssue.findMany({ where: { job: jobs, status: 'OPEN', reportedAt: range(c), OR: [{ blocking: true }, { severity: { in: ['HIGH', 'CRITICAL'] } }] }, select: { id: true, jobId: true, severity: true, reportedAt: true }, take: LIMIT + 1 })))
            add('INSTALLATION_BLOCKER', r.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', 'M05', r.id, r.reportedAt, 'Open M05 blocker prevents safe progression', `/installations/${r.jobId}`);
        for (const r of bounded(await c.tx.installationJob.findMany({ where: { AND: [jobs, { status: 'COMMISSIONING_REVIEW', updatedAt: range(c) }] }, select: { id: true, updatedAt: true }, take: LIMIT + 1 })))
            add('COMMISSIONING_REVIEW', 'WARNING', 'M05', r.id, r.updatedAt, 'Installation awaits independent internal commissioning review', `/installations/${r.id}`);
    }
    if (allowed(c, 'inventory') && !c.q.customerId && !c.q.siteId && !c.q.installationId && !c.q.technicianId) {
        const wh = c.q.warehouseId ? Prisma.sql `AND b."warehouseId"=${c.q.warehouseId}::uuid` : Prisma.empty;
        const rows = bounded(await c.tx.$queryRaw<{
            id: string;
            updatedAt: Date;
        }[]> `SELECT b."id",b."updatedAt" FROM "InventoryBalance" b WHERE b."onHandQuantity"-b."reservedQuantity"<=b."reorderLevel" AND b."updatedAt">=${c.from} AND b."updatedAt"<${c.to} ${wh} ORDER BY b."id" LIMIT ${LIMIT + 1}`);
        for (const r of rows)
            add('LOW_STOCK', 'WARNING', 'M04', r.id, r.updatedAt, 'Current usable available balance is at or below configured reorder level', '/inventory/products');
    }
    else
        excludedSources.push('INVENTORY: unauthorized or customer/site/installation/technician filter cannot map to stock');
    if (allowed(c, 'technicians') && !c.q.customerId && !c.q.siteId && !c.q.installationId && !c.q.warehouseId) {
        const users = technicianWhere(c);
        for (const r of bounded(await c.tx.technicianCertification.findMany({ where: { user: users, verification: 'VERIFIED', expiresAt: { gte: c.asOf, lte: new Date(c.asOf.getTime() + c.q.days * 86400000) } }, select: { id: true, expiresAt: true }, take: LIMIT + 1 })))
            add('CERTIFICATION_EXPIRING', 'WARNING', 'M06', r.id, r.expiresAt, 'Verified certification expires within selected days', '/technicians');
        const workload = await technicians({ ...c, q: { ...c.q, page: 1, pageSize: 100 } }, 'workload');
        if ('data' in workload) {
            if (workload.pagination.totalItems > 100)
                throw new ApiError(422, 'ANALYTICS_SCOPE_LIMIT', 'Filter technicianId for complete scheduling conflict alerts');
            for (const raw of workload.data) {
                if ('schedulingConflictPairs' in raw && (raw.schedulingConflictPairs > 0 || raw.approvedLeaveOrCalendarConflictPairs > 0))
                    add('SCHEDULING_CONFLICT', 'WARNING', 'M06', raw.technicianId, c.asOf, 'Planning spans overlap/rest conflict or approved leave/calendar block; not observed attendance', '/technicians', 'ANALYTICS_DETECTED_AT');
            }
        }
    }
    else
        excludedSources.push('WORKFORCE: unauthorized or incompatible project/warehouse filter');
    if (allowed(c, 'warranties') && !c.q.technicianId && !c.q.warehouseId) {
        const today = civil(c.asOf);
        for (const r of bounded(await c.tx.warrantyRegistration.findMany({ where: { AND: [warrantyWhere(c), { status: 'ACTIVE', verifiedStartDate: { lte: today }, expiresAt: { gt: today, lte: addDays(today, c.q.days) } }] }, select: { id: true, expiresAt: true }, take: LIMIT + 1 })))
            add('WARRANTY_EXPIRING', 'WARNING', 'M07', r.id, r.expiresAt!, 'Verified activated coverage reaches exclusive expiry within selected days', `/warranty/records/${r.id}`);
    }
    if (allowed(c, 'service')) {
        const where = { AND: [serviceWhere(c), { openedAt: range(c), status: { notIn: ['RESOLVED' as const, 'CLOSED' as const, 'CANCELLED' as const] } }] };
        for (const r of bounded(await c.tx.serviceTicket.findMany({ where, select: { id: true, priority: true, openedAt: true, firstResponseAt: true, firstResponseDueAt: true, resolutionDueAt: true, slaPolicyId: true }, take: LIMIT + 1 }))) {
            if (r.priority === 'CRITICAL')
                add('CRITICAL_SERVICE', 'CRITICAL', 'M08', r.id, r.openedAt, 'Critical unresolved service ticket', `/service/tickets/${r.id}`);
            const breachedDeadlines = [...(r.firstResponseDueAt && (r.firstResponseAt ?? c.asOf) > r.firstResponseDueAt ? [r.firstResponseDueAt] : []), ...(r.resolutionDueAt && c.asOf > r.resolutionDueAt ? [r.resolutionDueAt] : [])].sort((a, b) => a.getTime() - b.getTime());
            if (r.slaPolicyId && breachedDeadlines.length)
                add('SLA_BREACH', 'CRITICAL', 'M08', r.id, breachedDeadlines[0]!, 'Elapsed-UTC SLA deadline breached; holds do not pause clock', `/service/tickets/${r.id}`, 'SOURCE_BREACHED_DEADLINE');
        }
        if (c.user.role === 'ADMIN' && !c.q.technicianId)
            for (const r of bounded(await c.tx.serviceMaintenancePlan.findMany({ where: { status: 'ACTIVE', installation: { id: c.q.installationId, customerId: c.q.customerId, siteId: c.q.siteId }, nextDueAt: { lt: c.to < c.asOf ? c.to : c.asOf, gte: c.from } }, select: { id: true, nextDueAt: true }, take: LIMIT + 1 })))
                add('MAINTENANCE_OVERDUE', 'WARNING', 'M08', r.id, r.nextDueAt, 'Active maintenance plan is past nextDueAt', '/service/maintenance', 'SOURCE_DEADLINE');
    }
    if (allowed(c, 'finance') && !c.q.technicianId) {
        const invoices = bounded(await c.tx.financeInvoice.findMany({ where: { order: financeOrderWhere(c), status: 'ISSUED', issuedAt: range(c), dueAt: { lt: c.asOf } }, take: 5001 }), 5000);
        for (const b of await invoiceBalances(c.tx, invoices))
            if (b.outstanding.gt('0'))
                add('INVOICE_OVERDUE', 'WARNING', 'M09', b.invoice.id, b.invoice.dueAt, 'Issued invoice has positive current M09 outstanding after credits and verified allocations', `/finance/invoices/${b.invoice.id}`, 'SOURCE_DEADLINE');
        if (!c.q.siteId && !c.q.installationId && !c.q.technicianId && !c.q.warehouseId)
            for (const r of bounded(await c.tx.financePayment.findMany({ where: { customer: financeCustomerWhere(c), currency: c.q.currency, status: { in: ['RECORDED', 'PENDING_VERIFICATION'] }, paidAt: range(c) }, select: { id: true, paidAt: true }, take: LIMIT + 1 })))
                add('UNVERIFIED_PAYMENT', 'WARNING', 'M09', r.id, r.paidAt, 'Manual receipt has not passed independent verification', '/finance/payments');
        else
            excludedSources.push('PAYMENTS: site/installation cannot attribute whole customer receipt');
    }
    bounded(out);
    out.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime() || a.id.localeCompare(b.id));
    return { ...page(out.slice((c.q.page - 1) * c.q.pageSize, c.q.page * c.q.pageSize), out.length, c.q), excludedSources, definition: 'Current database conditions with source-specific event timestamps in interval; expiry alerts use next days and conflict alerts use planning window. No notifications sent.', notificationDelivery: 'NOT_IMPLEMENTED' };
}
