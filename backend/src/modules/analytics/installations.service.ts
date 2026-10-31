import type { InstallationStatus } from '@prisma/client';
import { installationWhere, requireDepartment } from './access.service.js';
import { type Context, range, bounded, metric, series, averageDuration, page, paging, LIMIT } from './common.js';
export async function installations(c: Context, mode: 'summary' | 'trends' | 'milestones' | 'blockers') {
    requireDepartment(c, 'installations');
    const job = { AND: [installationWhere(c), { createdAt: range(c), status: c.q.status as InstallationStatus | undefined }] };
    if (mode === 'milestones') {
        const where = { job };
        const delayed = { job, status: { in: ['PENDING' as const, 'IN_PROGRESS' as const] }, plannedEndAt: { lt: c.asOf } };
        return { byTypeAndStatus: await c.tx.installationMilestone.groupBy({ by: ['type', 'status'], where, _count: { _all: true }, orderBy: [{ type: 'asc' }, { status: 'asc' }] }), delayedMilestones: metric(await c.tx.installationMilestone.count({ where: delayed }), 'InstallationMilestone', 'PENDING/IN_PROGRESS with explicit plannedEndAt before asOf, scoped job creation cohort'), ...page(await c.tx.installationMilestone.findMany({ where: delayed, ...paging(c.q), select: { id: true, jobId: true, type: true, status: true, plannedEndAt: true, responsibleUserId: true }, orderBy: [{ plannedEndAt: 'asc' }, { id: 'asc' }] }), await c.tx.installationMilestone.count({ where: delayed }), c.q) };
    }
    if (mode === 'blockers') {
        const where = { job, status: 'OPEN', OR: [{ blocking: true }, { severity: { in: ['HIGH' as const, 'CRITICAL' as const] } }] };
        return { ...page(await c.tx.installationIssue.findMany({ where, ...paging(c.q), select: { id: true, jobId: true, type: true, severity: true, blocking: true, reportedAt: true, milestoneId: true }, orderBy: [{ reportedAt: 'asc' }, { id: 'asc' }] }), await c.tx.installationIssue.count({ where }), c.q), source: 'InstallationIssue', definition: 'OPEN and explicitly blocking or HIGH/CRITICAL, matching M05 commissioning blocker rule; descriptions/evidence excluded' };
    }
    const rows = bounded(await c.tx.installationJob.findMany({ where: job, select: { status: true, createdAt: true, plannedStartAt: true, actualStartAt: true, actualEndAt: true, commissionedAt: true, plannedEndAt: true }, take: LIMIT + 1, orderBy: { id: 'asc' } }));
    if (mode === 'trends') {
        // Event trends use separate date predicates: jobs created before the interval can commission in it.
        const base = { AND: [installationWhere(c), { status: c.q.status as InstallationStatus | undefined }] };
        const events = bounded(await c.tx.installationJob.findMany({ where: { AND: [base, { OR: [{ plannedStartAt: range(c) }, { commissionedAt: range(c) }] }] }, select: { plannedStartAt: true, commissionedAt: true }, take: LIMIT + 1, orderBy: { id: 'asc' } }));
        return { source: 'InstallationJob', created: series(c, rows.map(r => r.createdAt)), plannedStarts: series(c, events.map(r => r.plannedStartAt)), commissioned: series(c, events.flatMap(r => r.commissionedAt ? [r.commissionedAt] : [])), definition: 'Actual creation/planned start/commissioning timestamp events, not stock dispatch' };
    }
    const counts = Object.fromEntries([...new Set(rows.map(r => r.status))].sort().map(s => [s, rows.filter(r => r.status === s).length]));
    return { total: metric(rows.length, 'InstallationJob', 'Jobs created in interval; current states'), byStatus: counts, active: metric(rows.filter(r => !['COMMISSIONED', 'CANCELED'].includes(r.status)).length, 'InstallationJob.status', 'Nonterminal in creation cohort'), commissioned: metric(rows.filter(r => r.status === 'COMMISSIONED').length, 'InstallationJob.status', 'Current COMMISSIONED in creation cohort'), delayed: metric(rows.filter(r => !['COMMISSIONED', 'CANCELED'].includes(r.status) && r.plannedEndAt < c.asOf).length, 'InstallationJob.plannedEndAt', 'Nonterminal jobs past explicit planned end'), completion: averageDuration(rows.filter(r => r.status === 'COMMISSIONED').map(r => ({ start: r.actualStartAt, end: r.commissionedAt }))), completionDefinition: 'Actual start to internal commissioning for commissioned creation-cohort jobs with supported timestamps; not delivery/regulatory certification' };
}
