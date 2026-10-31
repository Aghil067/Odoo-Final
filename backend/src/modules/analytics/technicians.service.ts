import { ApiError } from '../../lib/http.js';
import { availabilityIn } from '../technicians/availability.service.js';
import { committedJobs } from '../technicians/common.js';
import { technicianWhere, requireDepartment } from './access.service.js';
import { type Context, bounded, metric, unavailable, page, paging, LIMIT } from './common.js';
export async function technicians(c: Context, mode: 'summary' | 'workload' | 'availability' | 'certifications') {
    requireDepartment(c, 'technicians');
    const users = technicianWhere(c), tx = c.tx;
    if (mode === 'summary')
        return { activeTechnicians: metric(await tx.user.count({ where: { AND: [users, { isActive: true, technicianProfile: { isActive: true, employmentStatus: 'ACTIVE' } }] } }), 'User,TechnicianProfile', 'Active TECHNICIAN user and active ACTIVE employment profile'), activeTeams: metric(await tx.technicianTeam.count({ where: { isActive: true, ...(c.user.role === 'TECHNICIAN' || c.q.technicianId ? { memberships: { some: { user: users, endedAt: null } } } : {}) } }), 'TechnicianTeam', 'Active teams; technician sees only own current memberships'), verifiedSkills: metric(await tx.technicianSkill.count({ where: { user: users, verification: 'VERIFIED' } }), 'TechnicianSkill', 'Verified recorded skills for scoped technicians'), upcomingApprovedLeave: metric(await tx.technicianLeave.count({ where: { user: users, status: 'APPROVED', startsAt: { lt: c.to }, endsAt: { gt: c.from } } }), 'TechnicianLeave', 'Approved leave overlapping requested interval; no reason or private notes exposed'), unknownProfiles: metric(await tx.user.count({ where: { AND: [users, { technicianProfile: null }] } }), 'User,TechnicianProfile', 'Technicians without managed profile; availability cannot be inferred'), unknownAvailability: unavailable('Requires a bounded M06 purpose/calendar evaluation; missing profile count alone is not all unknown availability'), actualWorkedHours: unavailable('Planned source assignments are not attendance'), utilizationPercent: unavailable('Reliable observed worked-hours denominator absent'), basis: 'CURRENT_WORKFORCE_WITH_LEAVE_OVERLAP_WINDOW' };
    if (mode === 'certifications') {
        const until = new Date(c.asOf.getTime() + c.q.days * 86400000), where = { user: users, verification: 'VERIFIED' as const, expiresAt: { gte: c.asOf, lte: until } };
        return { ...page(await tx.technicianCertification.findMany({ where, ...paging(c.q), select: { id: true, userId: true, skillId: true, verification: true, issuedAt: true, expiresAt: true }, orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }] }), await tx.technicianCertification.count({ where }), c.q), expiredVerified: metric(await tx.technicianCertification.count({ where: { user: users, verification: 'VERIFIED', expiresAt: { lt: c.asOf } } }), 'TechnicianCertification', 'Verified certifications already expired at asOf'), definition: 'Expiring verified certifications in next days; certificate numbers/provider/evidence/private profile excluded' };
    }
    const rows = await tx.user.findMany({ where: users, ...paging(c.q), select: { id: true, name: true, technicianProfile: { select: { minimumRestMinutes: true } } }, orderBy: { id: 'asc' } }), total = await tx.user.count({ where: users });
    if (mode === 'availability') {
        if (c.to.getTime() - c.from.getTime() > 7 * 86400000 || c.q.pageSize > 5)
            throw new ApiError(422, 'ANALYTICS_AVAILABILITY_LIMIT', 'Authoritative M06 availability requires at most7days and pageSize<=5');
        const data = [];
        for (const u of rows) {
            const a = await availabilityIn(tx, u.id, c.from, c.to, ['SURVEY', 'PV_INSTALLATION', 'SERVICE']);
            data.push({ userId: u.id, name: u.name, status: a.status, reasons: a.reasons, managed: a.managed, committable: a.committable, plannedOccupiedShiftMinutes: a.plannedOccupiedShiftMinutes, availableShiftMinutes: a.availableShiftMinutes, utilizationPercent: null });
        }
        return { ...page(data, total, c.q), source: 'M06 availabilityIn', definition: 'Purpose eligibility for SURVEY/PV_INSTALLATION/SERVICE combined; unknown/unmanaged availability preserved, never attendance; bounded5-user authoritative evaluation' };
    }
    const ids = rows.map(r => r.id), maxRest = rows.reduce((n, u) => Math.max(n, u.technicianProfile?.minimumRestMinutes ?? 0), 0) * 60000;
    const expandedFrom = new Date(c.from.getTime() - maxRest), expandedTo = new Date(c.to.getTime() + maxRest);
    const [surveys, jobs, visits, assignments, leaves, blocks] = await Promise.all([
        tx.siteSurvey.findMany({ where: { assignedToId: { in: ids }, status: { in: ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED'] }, OR: [{ scheduledAt: null }, { scheduledEndAt: null }, { scheduledAt: { lt: expandedTo }, scheduledEndAt: { gt: expandedFrom } }] }, select: { id: true, assignedToId: true, status: true, scheduledAt: true, scheduledEndAt: true }, take: LIMIT + 1 }),
        tx.installationAssignment.findMany({ where: { userId: { in: ids }, job: { status: { in: [...committedJobs] }, plannedStartAt: { lt: expandedTo }, plannedEndAt: { gt: expandedFrom } } }, select: { userId: true, job: { select: { id: true, plannedStartAt: true, plannedEndAt: true } } }, take: LIMIT + 1 }),
        tx.serviceVisit.findMany({ where: { userId: { in: ids }, status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, scheduledStartAt: { lt: expandedTo }, scheduledEndAt: { gt: expandedFrom } }, select: { id: true, userId: true, scheduledStartAt: true, scheduledEndAt: true }, take: LIMIT + 1 }),
        tx.serviceAssignment.groupBy({ by: ['userId'], where: { userId: { in: ids }, endedAt: null, ticket: { status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] } } }, _count: { _all: true } }),
        tx.technicianLeave.findMany({ where: { userId: { in: ids }, status: 'APPROVED', startsAt: { lt: c.to }, endsAt: { gt: c.from } }, select: { id: true, userId: true, startsAt: true, endsAt: true }, take: LIMIT + 1 }),
        tx.technicianCalendarException.findMany({ where: { userId: { in: ids }, isActive: true, startsAt: { lt: c.to }, endsAt: { gt: c.from } }, select: { id: true, userId: true, startsAt: true, endsAt: true }, take: LIMIT + 1 })
    ]);
    [surveys, jobs, visits, leaves, blocks].forEach(x => bounded(x as unknown[]));
    type Span = {
        id: string;
        kind: string;
        start: number;
        end: number;
    };
    const work = new Map<string, Span[]>(), blocked = new Map<string, Span[]>();
    const add = (map: Map<string, Span[]>, id: string, s: Span) => { const existing = map.get(id); if (existing)
        existing.push(s);
    else
        map.set(id, [s]); };
    for (const s of surveys)
        if (s.assignedToId && s.scheduledAt && s.scheduledEndAt && ['SCHEDULED', 'IN_PROGRESS'].includes(s.status))
            add(work, s.assignedToId, { id: s.id, kind: 'SURVEY', start: s.scheduledAt.getTime(), end: s.scheduledEndAt.getTime() });
    for (const j of jobs)
        add(work, j.userId, { id: j.job.id, kind: 'INSTALLATION', start: j.job.plannedStartAt.getTime(), end: j.job.plannedEndAt.getTime() });
    for (const v of visits)
        add(work, v.userId, { id: v.id, kind: 'SERVICE', start: v.scheduledStartAt.getTime(), end: v.scheduledEndAt.getTime() });
    for (const l of leaves)
        add(blocked, l.userId, { id: l.id, kind: 'APPROVED_LEAVE', start: l.startsAt.getTime(), end: l.endsAt.getTime() });
    for (const b of blocks)
        add(blocked, b.userId, { id: b.id, kind: 'CALENDAR_BLOCK', start: b.startsAt.getTime(), end: b.endsAt.getTime() });
    const data = rows.map(u => {
        const spans = bounded((work.get(u.id) ?? []).sort((a, b) => a.start - b.start), 500), bs = bounded(blocked.get(u.id) ?? [], 500), rest = (u.technicianProfile?.minimumRestMinutes ?? 0) * 60000;
        let conflicts = 0, unavailabilityConflicts = 0;
        const inWindow = (s: Span) => s.start < c.to.getTime() && s.end > c.from.getTime();
        for (let i = 0; i < spans.length; i++) {
            const a = spans[i]!;
            for (let j = i + 1; j < spans.length; j++) {
                const b = spans[j]!;
                if (b.start >= a.end + rest)
                    break;
                if (a.start < b.end + rest && (inWindow(a) || inWindow(b)))
                    conflicts++;
            }
            for (const b of bs)
                if (inWindow(a) && a.start < b.end && b.start < a.end)
                    unavailabilityConflicts++;
        }
        return { technicianId: u.id, name: u.name, surveyAssignments: surveys.filter(s => s.assignedToId === u.id && (!s.scheduledAt || !s.scheduledEndAt || (s.scheduledAt < c.to && s.scheduledEndAt > c.from))).length, installationAssignments: jobs.filter(j => j.userId === u.id && j.job.plannedStartAt < c.to && j.job.plannedEndAt > c.from).length, serviceAssignments: assignments.find(a => a.userId === u.id)?._count._all ?? 0, scheduledServiceVisits: visits.filter(v => v.userId === u.id && v.scheduledStartAt < c.to && v.scheduledEndAt > c.from).length, plannedOccupiedMinutes: spans.reduce((n, s) => n + Math.max(0, Math.min(s.end, c.to.getTime()) - Math.max(s.start, c.from.getTime())) / 60000, 0), untimedSurveyAssignments: surveys.filter(s => s.assignedToId === u.id && s.status !== 'SUBMITTED' && (!s.scheduledAt || !s.scheduledEndAt)).length, schedulingConflictPairs: conflicts, approvedLeaveOrCalendarConflictPairs: unavailabilityConflicts, actualWorkedHours: null, utilizationPercent: null };
    });
    return { ...page(data, total, c.q), source: 'M02 survey schedules,M05 planning spans,M06 rest/leave/calendar,M08 assignments/visits', definition: 'M06 committed SCHEDULED/IN_PROGRESS survey spans, active installation planning spans and active service visits; surrounding rest windows included for conflicts where at least one work span intersects interval. Assignment counts are window-scoped plus untimed surveys; service assignment count is current all-window. Planned minutes clipped to interval, may overlap, never worked hours.', availabilityStatus: 'NOT_INFERRED_USE_AVAILABILITY_ENDPOINT' };
}
