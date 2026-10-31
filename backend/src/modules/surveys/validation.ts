import { z } from 'zod';
import { GridConnection, RoofAccessibility, RoofCondition, RoofType, ShadingLevel, SiteSuitability, SupplyPhase, SurveyAttachmentCategory, SurveyReviewDecision, SurveyStatus, SystemType } from '@prisma/client';
import { pageQuery, uuid } from '../crm/validation.js';

const text = (max = 5000) => z.string().trim().min(1).max(max);
const nullableText = (max = 5000) => text(max).nullable();
export const version = z.number().int().min(1).max(2147483646);
export const reason = text(2000);
export const idParams = z.strictObject({ id: uuid });
export const fileParams = z.strictObject({ id: uuid, attachmentId: uuid });
export const page = pageQuery.strict();
const instant = z.iso.datetime({ offset: true }).transform(value => new Date(value));
// Decimal strings are bounded before conversion; Number is used only for range comparisons.
const decimal = (max: number, positive = false) => z.string().max(16).regex(/^(0|[1-9]\d{0,8})(\.\d{1,3})?$/)
  .refine(value => Number(value) <= max && (!positive || Number(value) > 0), `Must be ${positive ? 'positive and ' : ''}at most ${max}, with up to 3 decimal places`);
const capacity = decimal(9999999.999, true);
export const create = z.strictObject({ leadId: uuid, siteId: uuid, requestNotes: reason, previousSurveyId: uuid.optional() });
const feasibilityFields = z.strictObject({
  recommendedCapacityKw: capacity.nullable(), recommendedSystemType: z.enum(SystemType), suitability: z.enum(SiteSuitability),
  infeasibilityReason: nullableText(2000), additionalWorkRequired: nullableText(), technicalAssumptions: nullableText(), feasibilityNotes: nullableText(),
});
export const update = feasibilityFields.partial().extend({ version }).refine(value => Object.keys(value).length > 1, 'Supply at least one feasibility field');
export const assign = z.strictObject({ version, assignedToId: uuid, assignmentNotes: nullableText(2000).optional(), reason });
export const schedule = z.strictObject({ version, scheduledAt: instant, expectedDurationMinutes: z.number().int().min(15).max(480), reason });
export const command = z.strictObject({ version, reason });
export const checklist = z.strictObject({ roofReviewed: z.boolean(), electricalReviewed: z.boolean(), evidenceReviewed: z.boolean(), assumptionsReviewed: z.boolean(), limitationsAcknowledged: z.boolean(), conditionalWorkAcknowledged: z.boolean() });
export const review = z.strictObject({ version, decision: z.enum(SurveyReviewDecision), notes: text(), checklist: checklist.optional() });
export const roof = z.strictObject({
  version, roofType: z.enum(RoofType), roofTypeDetails: nullableText(2000),
  usableAreaSqm: decimal(1000000), azimuthDegrees: decimal(359.999), tiltDegrees: decimal(90),
  shadingLevel: z.enum(ShadingLevel), shadingObservations: text(), nearbyObstructions: text(), mountingSpaceSqm: decimal(1000000),
  accessibility: z.enum(RoofAccessibility), accessibilityNotes: text(2000), visibleCondition: z.enum(RoofCondition), conditionNotes: text(),
  mountingConcerns: text(), structuralNotes: text(), specialistVerificationRequired: z.boolean(), recommendations: text(),
}).superRefine((value, ctx) => {
  if (Number(value.mountingSpaceSqm) > Number(value.usableAreaSqm)) ctx.addIssue({ code: 'custom', path: ['mountingSpaceSqm'], message: 'Cannot exceed usable roof area' });
  if (value.roofType === 'OTHER' && !value.roofTypeDetails) ctx.addIssue({ code: 'custom', path: ['roofTypeDetails'], message: 'Describe OTHER roof construction' });
});
export const electrical = z.strictObject({
  version, gridConnection: z.enum(GridConnection), supplyPhase: z.enum(SupplyPhase), meterDetails: nullableText(2000), panelPresent: z.boolean(),
  panelObservations: text(), approximateCableRunMeters: decimal(100000).nullable(), earthingObservations: text(), inverterPlacementOptions: text(),
  batteryPlacementConsiderations: nullableText(), safetyConcerns: text(), safetyVerificationRequired: z.boolean(), gridSuitabilityObservations: text(), additionalNotes: text(),
}).refine(value => value.gridConnection !== 'CONNECTED' || value.meterDetails !== null, 'Meter details required for a connected grid supply');
export const list = pageQuery.extend({ status: z.enum(SurveyStatus).optional(), leadId: uuid.optional(), siteId: uuid.optional(), customerId: uuid.optional(), assignedToId: uuid.optional(), q: text(160).optional() }).strict();
export const availability = pageQuery.extend({ from: instant, to: instant, surveyorId: uuid }).strict().refine(value => value.to > value.from && value.to.getTime() - value.from.getTime() <= 31 * 86400_000, 'Window must be positive and at most 31 days');
export const upload = z.strictObject({
  version: z.coerce.number().int().min(1).max(2147483646), category: z.enum(SurveyAttachmentCategory),
  fileName: z.string().min(5).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9 _.-]*\.(jpg|jpeg|png|pdf)$/i).refine(value => !value.includes('..'), 'Invalid filename'),
});
