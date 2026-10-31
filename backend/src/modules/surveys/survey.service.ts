import { randomUUID } from 'node:crypto';
import { Prisma, type SiteSurvey, type SurveyEvent } from '@prisma/client';
import { z } from 'zod';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { requireLead } from '../crm/access.js';
import { requireAdmin, requireFieldEditor, requireSurvey } from './access.js';
import { activeSurveyStatuses, requireTransition, surveyAtomic } from './policy.js';
import * as v from './validation.js';

export function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }

export async function saveSurvey(tx: Transaction, user: Principal, current: SiteSurvey, data: Prisma.SiteSurveyUncheckedUpdateInput, event: SurveyEvent, reason: string, details: object = {}) {
  if (typeof data.status === 'string' && data.status !== current.status) requireTransition(current.status, data.status);
  const result = await tx.siteSurvey.updateMany({ where: { id: current.id, version: current.version }, data: { ...data, version: { increment: 1 } } });
  if (result.count !== 1) throw new ApiError(409, 'VERSION_CONFLICT', 'Survey changed; refresh before editing');
  const updated = await tx.siteSurvey.findUniqueOrThrow({ where: { id: current.id } });
  await tx.surveyStatusHistory.create({ data: { surveyId: current.id, actorId: user.id, event, fromStatus: current.status, toStatus: updated.status, surveyVersion: updated.version, reason, details: json(details) } });
  return updated;
}

export function createSurvey(user: Principal, input: z.infer<typeof v.create>) {
  return surveyAtomic(async tx => {
    if (!['ADMIN', 'SALES'].includes(user.role)) throw new ApiError(403, 'FORBIDDEN', 'ADMIN or permitted SALES must request a survey');
    const lead = await requireLead(tx, user, input.leadId, true);
    if (lead.status !== 'SURVEY_REQUESTED') throw new ApiError(409, 'LEAD_NOT_ELIGIBLE', 'Move the qualified M01 lead to SURVEY_REQUESTED first');
    if (lead.siteId !== input.siteId) throw new ApiError(422, 'SITE_LEAD_MISMATCH', 'Use the existing lead installation site');
    const previous = await tx.siteSurvey.findFirst({ where: { leadId: lead.id }, orderBy: { assessmentNumber: 'desc' } });
    if (previous) {
      requireAdmin(user);
      if (activeSurveyStatuses.includes(previous.status)) throw new ApiError(409, 'ACTIVE_SURVEY_EXISTS', 'Finish or cancel the current survey before requesting reassessment');
      if (input.previousSurveyId !== previous.id) throw new ApiError(409, 'REASSESSMENT_REFERENCE_REQUIRED', 'Reference the latest terminal survey and explain the new assessment');
    } else if (input.previousSurveyId) throw new ApiError(422, 'INVALID_PREVIOUS_SURVEY', 'No prior assessment exists for this lead');
    const survey = await tx.siteSurvey.create({ data: {
      reference: `SUR-${randomUUID()}`, leadId: lead.id, siteId: lead.siteId, customerId: lead.customerId,
      requestedById: user.id, requestNotes: input.requestNotes, requestedCapacityKw: lead.requestedCapacityKw,
      assessmentNumber: previous ? previous.assessmentNumber + 1 : 1, previousSurveyId: previous?.id,
    } });
    await tx.surveyStatusHistory.create({ data: { surveyId: survey.id, actorId: user.id, event: 'REQUESTED', fromStatus: null, toStatus: 'REQUESTED', surveyVersion: 1, reason: input.requestNotes, details: json({ previousSurveyId: previous?.id ?? null, leadId: lead.id, siteId: lead.siteId, requestedCapacityKw: lead.requestedCapacityKw }) } });
    return survey;
  });
}

export function updateFeasibility(user: Principal, id: string, input: z.infer<typeof v.update>) {
  return surveyAtomic(async tx => {
    const current = await requireSurvey(tx, user, id, input.version);
    requireFieldEditor(user, current);
    const { version: _version, ...fields } = input;
    return saveSurvey(tx, user, current, fields, 'UPDATED', 'Preliminary feasibility findings updated', { fields: Object.keys(fields).sort() });
  });
}

export function putRoof(user: Principal, id: string, input: z.infer<typeof v.roof>) {
  return surveyAtomic(async tx => {
    const current = await requireSurvey(tx, user, id, input.version);
    requireFieldEditor(user, current);
    const { version: _version, ...fields } = input;
    const assessment = await tx.roofAssessment.upsert({ where: { surveyId: id }, create: { ...fields, surveyId: id }, update: fields });
    const survey = await saveSurvey(tx, user, current, {}, 'ROOF_UPDATED', 'Roof field observations saved', { assessmentId: assessment.id });
    return { assessment, surveyVersion: survey.version };
  });
}

export function putElectrical(user: Principal, id: string, input: z.infer<typeof v.electrical>) {
  return surveyAtomic(async tx => {
    const current = await requireSurvey(tx, user, id, input.version);
    requireFieldEditor(user, current);
    const { version: _version, ...fields } = input;
    const assessment = await tx.electricalAssessment.upsert({ where: { surveyId: id }, create: { ...fields, surveyId: id }, update: fields });
    const survey = await saveSurvey(tx, user, current, {}, 'ELECTRICAL_UPDATED', 'Electrical field observations saved', { assessmentId: assessment.id });
    return { assessment, surveyVersion: survey.version };
  });
}

export function cancelSurvey(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return surveyAtomic(async tx => {
    requireAdmin(user);
    const current = await requireSurvey(tx, user, id, input.version);
    return saveSurvey(tx, user, current, { status: 'CANCELED', visitStatus: 'CANCELED' }, 'CANCELED', input.reason);
  });
}
