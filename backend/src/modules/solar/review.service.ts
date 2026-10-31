import type { SolarConfiguration } from '@prisma/client';
import type { Transaction } from '../../lib/db.js';
import { eligibleApprovedSurvey } from '../surveys/review.service.js';
import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { admin, handoff, json, requireConfiguration, saveConfiguration, solarAtomic } from './common.js';
import { calculationData } from './bom.service.js';
import * as v from './validation.js';

export const designEvents = ['CREATED', 'DRAFT_UPDATED', 'BOM_UPDATED', 'BOM_REFRESHED'];
export function submitConfiguration(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return solarAtomic(async tx => {
    const current = await requireConfiguration(tx, user, id, input.version, true);
    const result = await calculationData(tx, current);
    if (result.report.blockingErrors) throw new ApiError(422, 'CONFIGURATION_BLOCKED', 'Resolve blocking/unverified compatibility findings before submission; fetch calculations for details');
    return saveConfiguration(tx, user, current, { ...result.derived, status: 'READY_FOR_REVIEW' }, 'SUBMITTED', input.reason);
  });
}
export function reviewConfiguration(user: Principal, id: string, input: z.infer<typeof v.review>) {
  return solarAtomic(async tx => {
    admin(user);
    const current = await requireConfiguration(tx, user, id, input.version);
    if (current.status !== 'READY_FOR_REVIEW') throw new ApiError(409, 'CONFIGURATION_NOT_SUBMITTED', 'Review only READY_FOR_REVIEW configurations');
    if (current.createdById === user.id || await tx.solarConfigurationHistory.count({ where: { configurationId: id, actorId: user.id, event: { in: designEvents } } })) throw new ApiError(403, 'SELF_APPROVAL_FORBIDDEN', 'An independent administrator who did not design/edit this revision must review it');
    await handoff(tx, user, current);
    const result = await calculationData(tx, current);
    if (input.decision === 'APPROVED') {
      if (result.report.blockingErrors) throw new ApiError(422, 'CONFIGURATION_BLOCKED', 'Current compatibility/catalog findings block approval; return for revision');
      if (!input.checklist || Object.values(input.checklist).some(value => value !== true)) throw new ApiError(422, 'REVIEW_CHECKLIST_REQUIRED', 'Acknowledge compatibility, costing, assumptions, survey conditions and design limitations');
    }
    const snapshot = await tx.solarConfiguration.findUniqueOrThrow({ where: { id }, include: { bom: { include: { lines: { orderBy: { position: 'asc' } } } } } });
    const review = await tx.solarConfigurationReview.create({ data: { configurationId: id, reviewerId: user.id, decision: input.decision, configurationVersion: current.version, notes: input.notes, checklist: json(input.checklist ?? {}), snapshot: json({ ...snapshot, ...result.derived, validationReport: result.report }) } });
    const configuration = await saveConfiguration(tx, user, current, { ...result.derived, status: input.decision, reviewerId: user.id, approvedVersion: input.decision === 'APPROVED' ? current.version : null }, 'REVIEWED', input.notes.slice(0, 2000), { reviewId: review.id, reviewedVersion: current.version, decision: input.decision });
    return { configuration, review };
  });
}
export function approvedConfiguration(user: Principal, id: string) {
  return solarAtomic(async tx => approvedConfigurationRecord(tx, await requireConfiguration(tx, user, id)));
}

// Internal eligibility guard; inventory establishes RBAC/project scope before calling.
export async function approvedConfigurationRecord(tx: Transaction, configuration: SolarConfiguration) {
    const id = configuration.id;
    if (configuration.status !== 'APPROVED' || configuration.approvedVersion === null) throw new ApiError(409, 'CONFIGURATION_NOT_APPROVED', 'This configuration has no approved handoff');
    const survey = await eligibleApprovedSurvey(tx, await tx.siteSurvey.findUniqueOrThrow({ where: { id: configuration.approvedSurveyId } }));
    if (survey.approvedVersion !== configuration.approvedSurveyVersion || survey.reviewId !== configuration.surveyReviewId) throw new ApiError(409, 'SURVEY_APPROVAL_MISMATCH', 'Use the exact survey approval');
    if (await tx.solarConfiguration.count({ where: { previousConfigurationId: id } })) throw new ApiError(409, 'CONFIGURATION_SUPERSEDED', 'A later revision exists; use its approval');
    const review = await tx.solarConfigurationReview.findUniqueOrThrow({ where: { configurationId_configurationVersion: { configurationId: id, configurationVersion: configuration.approvedVersion } } });
    if (review.decision !== 'APPROVED') throw new ApiError(409, 'CONFIGURATION_NOT_APPROVED', 'The persisted decision is not an approval');
    const bom = await tx.billOfMaterials.findUniqueOrThrow({ where: { configurationId: id }, include: { lines: { orderBy: { position: 'asc' } } } });
    return { configurationId: id, reference: configuration.reference, revisionNumber: configuration.revisionNumber, approvedVersion: configuration.approvedVersion, reviewId: review.id, approvedSurveyId: configuration.approvedSurveyId, approvedSurveyVersion: configuration.approvedSurveyVersion, surveyReviewId: configuration.surveyReviewId, surveyConditions: configuration.surveySnapshot, conditionalWorkRequirements: configuration.conditionalWorkRequirements, configuration, bom, approvalSnapshot: review.snapshot, scope: 'INTERNAL_PRELIMINARY_CONFIGURATION_NOT_REGULATORY_CERTIFICATION' };
}
