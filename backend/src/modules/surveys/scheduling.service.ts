import { z } from 'zod';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { requireAdmin, requireSurvey } from './access.js';
import { surveyAtomic } from './policy.js';
import { saveSurvey } from './survey.service.js';
import * as v from './validation.js';

async function activeSurveyor(tx: Transaction, id: string) {
  if (!await tx.user.findFirst({ where: { id, role: 'TECHNICIAN', isActive: true }, select: { id: true } })) throw new ApiError(422, 'INVALID_SURVEYOR', 'Choose an active TECHNICIAN user');
}
export async function checkAppointment(tx: Transaction, surveyorId: string, start: Date, end: Date, excludingId: string) {
  const conflict = await tx.siteSurvey.findFirst({ where: {
    id: { not: excludingId }, assignedToId: surveyorId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    scheduledAt: { lt: end }, scheduledEndAt: { gt: start },
  }, select: { id: true } });
  if (conflict) throw new ApiError(409, 'SURVEYOR_BUSY', 'Confirmed survey appointments cannot overlap');
}

export function assignSurveyor(user: Principal, id: string, input: z.infer<typeof v.assign>) {
  return surveyAtomic(async tx => {
    requireAdmin(user);
    const current = await requireSurvey(tx, user, id, input.version);
    if (!['REQUESTED', 'SCHEDULED', 'REVISION_REQUIRED'].includes(current.status)) throw new ApiError(409, 'ASSIGNMENT_LOCKED', 'Reassignment is allowed before the visit or during revisions');
    await activeSurveyor(tx, input.assignedToId);
    if (current.status === 'SCHEDULED' && current.scheduledAt && current.scheduledEndAt) await checkAppointment(tx, input.assignedToId, current.scheduledAt, current.scheduledEndAt, id);
    return saveSurvey(tx, user, current, {
      assignedToId: input.assignedToId, assignmentNotes: input.assignmentNotes,
      ...(current.status === 'REVISION_REQUIRED' ? { scheduledAt: null, scheduledEndAt: null, expectedDurationMinutes: null, visitStatus: 'NOT_SCHEDULED' } : {}),
    }, 'ASSIGNED', input.reason, { previousAssignedToId: current.assignedToId, assignedToId: input.assignedToId, assignmentNotes: input.assignmentNotes === undefined ? current.assignmentNotes : input.assignmentNotes, previousScheduledAt: current.scheduledAt });
  });
}

export function scheduleSurvey(user: Principal, id: string, input: z.infer<typeof v.schedule>) {
  return surveyAtomic(async tx => {
    requireAdmin(user);
    const current = await requireSurvey(tx, user, id, input.version);
    if (!['REQUESTED', 'SCHEDULED', 'REVISION_REQUIRED'].includes(current.status)) throw new ApiError(409, 'SCHEDULING_LOCKED', 'Schedule only requested surveys, confirmed appointments or revision visits');
    if (!current.assignedToId) throw new ApiError(422, 'SURVEYOR_REQUIRED', 'Assign a surveyor before scheduling');
    await activeSurveyor(tx, current.assignedToId);
    if (input.scheduledAt <= new Date()) throw new ApiError(422, 'SCHEDULE_IN_PAST', 'Schedule a future appointment');
    const scheduledEndAt = new Date(input.scheduledAt.getTime() + input.expectedDurationMinutes * 60000);
    await checkAppointment(tx, current.assignedToId, input.scheduledAt, scheduledEndAt, id);
    return saveSurvey(tx, user, current, {
      status: 'SCHEDULED', scheduledAt: input.scheduledAt, scheduledEndAt, expectedDurationMinutes: input.expectedDurationMinutes,
      visitStatus: 'CONFIRMED', startedAt: null, submittedAt: null,
    }, current.scheduledAt ? 'RESCHEDULED' : 'SCHEDULED', input.reason,
    { previousScheduledAt: current.scheduledAt, previousScheduledEndAt: current.scheduledEndAt, scheduledAt: input.scheduledAt, scheduledEndAt, expectedDurationMinutes: input.expectedDurationMinutes });
  });
}

export function startSurvey(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return surveyAtomic(async tx => {
    const current = await requireSurvey(tx, user, id, input.version);
    if (user.role !== 'TECHNICIAN' || current.assignedToId !== user.id) throw new ApiError(403, 'SURVEYOR_REQUIRED', 'Only the assigned TECHNICIAN may start the visit');
    const now = new Date();
    if (current.status !== 'SCHEDULED' || !current.scheduledAt || !current.scheduledEndAt || now < current.scheduledAt || now >= current.scheduledEndAt) throw new ApiError(409, 'OUTSIDE_VISIT_WINDOW', 'Start within the confirmed appointment window; reschedule missed visits');
    if (await tx.siteSurvey.count({ where: { id: { not: id }, assignedToId: user.id, status: 'IN_PROGRESS' } })) throw new ApiError(409, 'SURVEYOR_BUSY', 'Complete or cancel the ongoing visit before starting another');
    return saveSurvey(tx, user, current, { status: 'IN_PROGRESS', visitStatus: 'IN_PROGRESS', startedAt: now }, 'STARTED', input.reason);
  });
}
