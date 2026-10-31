import type { SurveyStatus } from '@prisma/client';
import { surveyWhere, requireDepartment } from './access.service.js';
import { type Context, range, bounded, metric, series, averageDuration, LIMIT } from './common.js';
export async function surveys(c: Context, trends = false) {
    requireDepartment(c, 'surveys');
    const where = { AND: [surveyWhere(c), { createdAt: range(c), status: c.q.status as SurveyStatus | undefined }] };
    const rows = bounded(await c.tx.siteSurvey.findMany({ where, select: { id: true, status: true, visitStatus: true, createdAt: true, scheduledAt: true, startedAt: true, submittedAt: true, assignedToId: true }, take: LIMIT + 1, orderBy: { id: 'asc' } }));
    if (trends) {
        const events = bounded(await c.tx.siteSurvey.findMany({ where: { AND: [surveyWhere(c), { status: c.q.status as SurveyStatus | undefined, OR: [{ scheduledAt: range(c) }, { submittedAt: range(c) }] }] }, select: { scheduledAt: true, submittedAt: true }, take: LIMIT + 1, orderBy: { id: 'asc' } }));
        return { source: 'SiteSurvey', definition: 'Creation and current recorded schedule/submission timestamp events independently in interval; submittedAt is field submission, not commissioning', requested: series(c, rows.map(r => r.createdAt)), scheduled: series(c, events.flatMap(r => r.scheduledAt ? [r.scheduledAt] : [])), submitted: series(c, events.flatMap(r => r.submittedAt ? [r.submittedAt] : [])) };
    }
    const ids = rows.map(r => r.id), reviews = bounded(await c.tx.surveyReview.findMany({ where: { surveyId: { in: ids }, decision: 'APPROVED' }, select: { surveyId: true, createdAt: true, snapshot: true }, take: LIMIT + 1, orderBy: [{ surveyId: 'asc' }, { createdAt: 'desc' }] }));
    const latest = new Map<string, typeof reviews[number]>();
    for (const r of reviews)
        if (!latest.has(r.surveyId))
            latest.set(r.surveyId, r);
    // Immutable review snapshot carries submittedAt for the reviewed cycle; never subtract a later resubmission.
    const turnarounds = rows.flatMap(r => {
        const review = latest.get(r.id);
        if (!review)
            return [];
        const snap = review.snapshot as Record<string, unknown>;
        const submitted = typeof snap.submittedAt === 'string' ? new Date(snap.submittedAt) : null;
        return [{ start: submitted && Number.isFinite(submitted.getTime()) ? submitted : null, end: review.createdAt }];
    });
    const count = (status: SurveyStatus) => rows.filter(r => r.status === status).length;
    const workload = new Map<string, number>();
    for (const r of rows)
        if (r.assignedToId && !['APPROVED', 'REJECTED', 'CANCELED'].includes(r.status))
            workload.set(r.assignedToId, (workload.get(r.assignedToId) ?? 0) + 1);
    return { requested: metric(rows.length, 'SiteSurvey.createdAt', 'All requested assessments created in interval, including reassessments'), scheduled: metric(rows.filter(r => r.scheduledAt !== null).length, 'SiteSurvey.scheduledAt', 'Creation cohort with an explicitly recorded schedule'), completed: metric(rows.filter(r => r.visitStatus === 'COMPLETED').length, 'SiteSurvey.visitStatus', 'Field visits recorded COMPLETED, not internal approval'), pendingInternalReview: metric(count('SUBMITTED'), 'SiteSurvey.status', 'Current SUBMITTED in creation cohort'), approved: metric(count('APPROVED'), 'SiteSurvey.status', 'Current APPROVED in creation cohort'), rejected: metric(count('REJECTED'), 'SiteSurvey.status', 'Current REJECTED in creation cohort'), byStatus: Object.fromEntries([...new Set(rows.map(r => r.status))].sort().map(s => [s, count(s)])), completion: averageDuration(rows.map(r => ({ start: r.startedAt, end: r.submittedAt }))), completionDefinition: 'Latest field start to latest submission where both supported and nonnegative; not labor hours', approvalTurnaround: averageDuration(turnarounds), approvalTurnaroundDefinition: 'Latest review timestamp minus submittedAt captured in that immutable review snapshot, missing snapshot timestamps excluded', technicianWorkload: [...workload].sort(([a], [b]) => a.localeCompare(b)).map(([technicianId, activeSurveyCount]) => ({ technicianId, activeSurveyCount })) };
}
