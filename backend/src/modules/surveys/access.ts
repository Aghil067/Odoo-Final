import type { Prisma, SiteSurvey } from '@prisma/client';
import type { Principal } from '../auth/auth.js';
import { leadScope } from '../crm/access.js';
import { ApiError } from '../../lib/http.js';
import type { Transaction } from '../../lib/db.js';
import { editableSurveyStatuses, terminalSurveyStatuses } from './policy.js';

export function surveyScope(user: Principal): Prisma.SiteSurveyWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'TECHNICIAN') return { assignedToId: user.id };
  if (user.role === 'SALES') return { lead: leadScope(user) };
  throw new ApiError(403, 'FORBIDDEN', 'Your role cannot access surveys');
}
export async function requireSurvey(tx: Transaction, user: Principal, id: string, expectedVersion?: number) {
  const survey = await tx.siteSurvey.findFirst({ where: { AND: [{ id }, surveyScope(user)] } });
  if (!survey) throw new ApiError(404, 'NOT_FOUND', 'Survey not found');
  if (expectedVersion !== undefined) {
    if (survey.version !== expectedVersion) throw new ApiError(409, 'VERSION_CONFLICT', 'Survey changed; refresh before editing');
    if (terminalSurveyStatuses.includes(survey.status)) throw new ApiError(409, 'SURVEY_IMMUTABLE', 'Terminal surveys are immutable; request a linked reassessment');
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: survey.customerId }, select: { isArchived: true } });
    if (customer.isArchived) throw new ApiError(409, 'CUSTOMER_ARCHIVED', 'Archived customers are read-only');
  }
  return survey;
}
export function requireFieldEditor(user: Principal, survey: SiteSurvey) {
  if (user.role !== 'TECHNICIAN' || survey.assignedToId !== user.id) throw new ApiError(403, 'SURVEYOR_REQUIRED', 'Only the assigned TECHNICIAN may record or submit field findings');
  if (!editableSurveyStatuses.includes(survey.status)) throw new ApiError(409, 'SURVEY_NOT_EDITABLE', 'Field findings may be edited only IN_PROGRESS or REVISION_REQUIRED');
}
export function requireAdmin(user: Principal) {
  if (user.role !== 'ADMIN') throw new ApiError(403, 'REVIEWER_REQUIRED', 'ADMIN coordination or review permission required');
}
// Technicians receive only the contact/address data needed for their assigned visit.
export const customerForVisit = { id: true, reference: true, name: true, phone: true } as const;
export const siteForVisit = { id: true, customerId: true, name: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true, country: true, landmark: true, latitude: true, longitude: true, propertyNotes: true, version: true } as const;
export const attachmentPublic = { id: true, surveyId: true, uploaderId: true, category: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true, createdAt: true } as const;
