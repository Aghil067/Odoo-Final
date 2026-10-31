import { z } from 'zod';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { attachmentPublic, customerForVisit, requireAdmin, requireFieldEditor, requireSurvey, siteForVisit } from './access.js';
import { surveyAtomic } from './policy.js';
import { json, saveSurvey } from './survey.service.js';
import * as v from './validation.js';

async function submissionData(tx: Transaction, id: string) {
  return tx.siteSurvey.findUniqueOrThrow({ where: { id }, include: {
    customer: { select: customerForVisit }, site: { select: siteForVisit }, roofAssessment: true, electricalAssessment: true,
    attachments: { select: attachmentPublic, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  } });
}
type Submission = Awaited<ReturnType<typeof submissionData>>;
function checkComplete(survey: Submission) {
  const roof = survey.roofAssessment;
  const electrical = survey.electricalAssessment;
  if (!roof || !electrical) throw new ApiError(422, 'ASSESSMENTS_REQUIRED', 'Save both roof and electrical assessments');
  if (survey.suitability === 'UNASSESSED' || survey.recommendedSystemType === 'UNDECIDED' || !survey.technicalAssumptions || !survey.feasibilityNotes) throw new ApiError(422, 'FEASIBILITY_INCOMPLETE', 'Record suitability, system recommendation, assumptions and feasibility notes');
  if (survey.suitability === 'NOT_SUITABLE' && !survey.infeasibilityReason) throw new ApiError(422, 'INFEASIBILITY_REASON_REQUIRED', 'Explain why the site is not suitable');
  if (survey.suitability !== 'NOT_SUITABLE' && (!survey.recommendedCapacityKw || survey.recommendedCapacityKw.lte(0) || roof.usableAreaSqm.lte(0) || roof.mountingSpaceSqm.lte(0))) throw new ApiError(422, 'CAPACITY_REQUIRED', 'Suitable sites need positive recommended capacity and roof/mounting area');
  if (survey.recommendedSystemType === 'OFF_GRID' && !electrical.batteryPlacementConsiderations) throw new ApiError(422, 'BATTERY_PLACEMENT_REQUIRED', 'Record battery placement considerations for off-grid recommendations');
  const categories = new Set(survey.attachments.map(file => file.category));
  if (!categories.has('ROOF_PHOTO') || (electrical.gridConnection === 'CONNECTED' && !categories.has('METER_PHOTO')) || (electrical.panelPresent && !categories.has('PANEL_PHOTO'))) throw new ApiError(422, 'EVIDENCE_REQUIRED', 'Attach roof evidence, plus meter/panel photographs where applicable');
  if (survey.suitability === 'CONDITIONALLY_SUITABLE' && !survey.additionalWorkRequired) throw new ApiError(422, 'CONDITIONS_REQUIRED', 'Describe additional work for conditional feasibility');
}
function checkApprovable(survey: Submission, checklist: z.infer<typeof v.checklist> | undefined) {
  checkComplete(survey);
  if (survey.suitability === 'NOT_SUITABLE') throw new ApiError(422, 'SITE_NOT_SUITABLE', 'An infeasible survey cannot be approved');
  if (!checklist || !checklist.roofReviewed || !checklist.electricalReviewed || !checklist.evidenceReviewed || !checklist.assumptionsReviewed || !checklist.limitationsAcknowledged) throw new ApiError(422, 'CHECKLIST_REQUIRED', 'Complete the internal review checklist');
  const roof = survey.roofAssessment!;
  const electrical = survey.electricalAssessment!;
  const unresolved = roof.specialistVerificationRequired || electrical.safetyVerificationRequired || roof.shadingLevel === 'HIGH' || roof.accessibility !== 'ACCESSIBLE' || ['POOR', 'UNKNOWN'].includes(roof.visibleCondition) || (survey.recommendedSystemType === 'ON_GRID' && electrical.gridConnection !== 'CONNECTED');
  if ((unresolved || survey.suitability === 'CONDITIONALLY_SUITABLE') && (survey.suitability !== 'CONDITIONALLY_SUITABLE' || !survey.additionalWorkRequired || !checklist.conditionalWorkAcknowledged)) throw new ApiError(422, 'CONDITIONAL_REVIEW_REQUIRED', 'Unresolved concerns require conditional suitability, explicit additional work and reviewer acknowledgement');
}

export function submitSurvey(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return surveyAtomic(async tx => {
    const current = await requireSurvey(tx, user, id, input.version);
    requireFieldEditor(user, current);
    checkComplete(await submissionData(tx, id));
    return saveSurvey(tx, user, current, { status: 'SUBMITTED', visitStatus: 'COMPLETED', submittedAt: new Date() }, 'SUBMITTED', input.reason);
  });
}
export function reviewSurvey(user: Principal, id: string, input: z.infer<typeof v.review>) {
  return surveyAtomic(async tx => {
    requireAdmin(user);
    const current = await requireSurvey(tx, user, id, input.version);
    if (current.status !== 'SUBMITTED') throw new ApiError(409, 'NOT_SUBMITTED', 'Review only a submitted assessment');
    if (current.assignedToId === user.id) throw new ApiError(403, 'SELF_REVIEW_FORBIDDEN', 'An independent administrator must review field findings');
    const snapshot = await submissionData(tx, id);
    if (input.decision === 'APPROVED') checkApprovable(snapshot, input.checklist);
    const review = await tx.surveyReview.create({ data: { surveyId: id, reviewerId: user.id, decision: input.decision, surveyVersion: current.version, notes: input.notes, checklist: json(input.checklist ?? {}), snapshot: json(snapshot) } });
    const survey = await saveSurvey(tx, user, current, { status: input.decision, approvedVersion: input.decision === 'APPROVED' ? current.version : null }, 'REVIEWED', input.notes.slice(0, 2000), { reviewId: review.id, decision: review.decision, reviewedVersion: current.version });
    return { survey, review };
  });
}
export function approvedSurvey(user: Principal, id: string) {
  return surveyAtomic(async tx => {
    const survey = await requireSurvey(tx, user, id);
    if (survey.status !== 'APPROVED' || survey.approvedVersion === null) throw new ApiError(409, 'SURVEY_NOT_APPROVED', 'This assessment has no approved M03 handoff');
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: survey.customerId }, select: { isArchived: true } });
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: survey.leadId }, select: { status: true } });
    if (customer.isArchived || lead.status !== 'SURVEY_REQUESTED') throw new ApiError(409, 'HANDOFF_NOT_ELIGIBLE', 'Customer and lead must still be active and eligible for the next module');
    if (await tx.siteSurvey.count({ where: { previousSurveyId: id } })) throw new ApiError(409, 'SURVEY_SUPERSEDED', 'A newer assessment exists; use its approved handoff after review');
    const review = await tx.surveyReview.findUniqueOrThrow({ where: { surveyId_surveyVersion: { surveyId: id, surveyVersion: survey.approvedVersion } } });
    if (review.decision !== 'APPROVED') throw new ApiError(409, 'SURVEY_NOT_APPROVED', 'Review is not an approval');
    return { surveyId: id, reference: survey.reference, leadId: survey.leadId, siteId: survey.siteId, customerId: survey.customerId, assessmentNumber: survey.assessmentNumber,
      approvedVersion: survey.approvedVersion, reviewId: review.id, reviewerId: review.reviewerId, approvedAt: review.createdAt,
      recommendedCapacityKw: survey.recommendedCapacityKw, recommendedSystemType: survey.recommendedSystemType, suitability: survey.suitability,
      additionalWorkRequired: survey.additionalWorkRequired, technicalAssumptions: survey.technicalAssumptions, approvalChecklist: review.checklist,
      snapshot: review.snapshot, approvalScope: 'INTERNAL_PRELIMINARY_FEASIBILITY',
    };
  });
}
