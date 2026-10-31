import type { WarrantyRegistrationStatus, WarrantyClaimStatus } from '@prisma/client';
import { civil, addDays } from '../warranties/dates.js';
import { warrantyWhere, requireDepartment } from './access.service.js';
import { type Context, range, bounded, metric, page, paging, averageDuration, LIMIT } from './common.js';
export async function warranties(c: Context, mode: 'summary' | 'expiring' | 'claims') {
    requireDepartment(c, 'warranties');
    const base = warrantyWhere(c), today = civil(c.asOf), where = { AND: [base, { createdAt: range(c), status: c.q.status as WarrantyRegistrationStatus | undefined }] };
    if (mode === 'expiring') {
        const w = { AND: [base, { status: 'ACTIVE' as const, verifiedStartDate: { lte: today }, expiresAt: { gt: today, lte: addDays(today, c.q.days) } }] };
        return { ...page(await c.tx.warrantyRegistration.findMany({ where: w, ...paging(c.q), select: { id: true, reference: true, installationId: true, coverageType: true, verifiedStartDate: true, expiresAt: true }, orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }] }), await c.tx.warrantyRegistration.count({ where: w }), c.q), source: 'WarrantyRegistration', definition: 'Real ACTIVE coverage with verified start <= UTC civil today and exclusive expiry >today within next days; not an advisory claim decision' };
    }
    if (mode === 'claims') {
        const w = { registration: base, createdAt: range(c), status: c.q.status as WarrantyClaimStatus | undefined };
        const rows = bounded(await c.tx.warrantyClaim.findMany({ where: w, select: { createdAt: true, decisionDate: true, finalDecision: true, status: true }, take: LIMIT + 1, orderBy: { id: 'asc' } }));
        return { byStatus: await c.tx.warrantyClaim.groupBy({ by: ['status'], where: w, _count: { _all: true }, orderBy: { status: 'asc' } }), providerResponsesPending: metric(rows.filter(r => ['SUBMITTED_TO_PROVIDER', 'PROVIDER_RESPONSE_PENDING'].includes(r.status)).length, 'WarrantyClaim.status', 'Claims awaiting an observed provider response'), approvedClaims: metric(rows.filter(r => r.finalDecision === 'APPROVED').length, 'WarrantyClaim.finalDecision', 'Actual recorded final APPROVED, not advisory eligibility'), deniedClaims: metric(rows.filter(r => r.finalDecision === 'DENIED').length, 'WarrantyClaim.finalDecision', 'Actual recorded final DENIED'), decisionTurnaround: averageDuration(rows.map(r => ({ start: r.createdAt, end: r.decisionDate }))), definition: 'Claim creation cohort; actual final decision timestamp only, not provider SLA' };
    }
    const [total, active, expired, pending, byStatus, byCoverageType] = await Promise.all([
        c.tx.warrantyRegistration.count({ where }), c.tx.warrantyRegistration.count({ where: { AND: [where, { status: 'ACTIVE', verifiedStartDate: { lte: today }, expiresAt: { gt: today } }] } }), c.tx.warrantyRegistration.count({ where: { AND: [where, { status: 'ACTIVE', expiresAt: { lte: today } }] } }), c.tx.warrantyRegistration.count({ where: { AND: [where, { status: { in: ['DRAFT', 'PENDING_EVIDENCE', 'PENDING_REVIEW'] } }] } }), c.tx.warrantyRegistration.groupBy({ by: ['status'], where, _count: { _all: true }, orderBy: { status: 'asc' } }), c.tx.warrantyRegistration.groupBy({ by: ['coverageType'], where, _count: { _all: true }, orderBy: { coverageType: 'asc' } })
    ]);
    return { registrations: metric(total, 'WarrantyRegistration', 'Records created in interval, including pending; not all activated'), activeCoverage: metric(active, 'WarrantyRegistration', 'ACTIVE status with verifiedStartDate<=UTC today<expiresAt in creation cohort'), expiredCoverage: metric(expired, 'WarrantyRegistration', 'ACTIVE stored registrations whose exclusive expiry<=UTC today'), pendingRegistrations: metric(pending, 'WarrantyRegistration', 'DRAFT/PENDING_EVIDENCE/PENDING_REVIEW creation cohort'), byStatus, byCoverageType, source: 'M07 WarrantyRegistration', calendarSemantics: 'UTC_CIVIL_DATE_EXCLUSIVE_EXPIRY' };
}
