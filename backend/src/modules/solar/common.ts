import { Prisma, type SolarConfiguration, type SolarConfigurationStatus } from '@prisma/client';
import type { Transaction } from '../../lib/db.js';
import { atomic } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { leadScope } from '../crm/access.js';
import { requireApprovedSurvey } from '../surveys/review.service.js';

export const Decimal = Prisma.Decimal.clone({ precision: 48, rounding: Prisma.Decimal.ROUND_HALF_UP });
export const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export const editable: SolarConfigurationStatus[] = ['DRAFT', 'REVISION_REQUIRED'];
export const transitions: Record<SolarConfigurationStatus, readonly SolarConfigurationStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'ARCHIVED'], READY_FOR_REVIEW: ['APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'ARCHIVED'],
  REVISION_REQUIRED: ['READY_FOR_REVIEW', 'ARCHIVED'], APPROVED: [], REJECTED: ['ARCHIVED'], ARCHIVED: [],
};
export async function solarAtomic<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  try { return await atomic(work); } catch (error) {
    if ((error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2004') || (error instanceof Prisma.PrismaClientUnknownRequestError && error.message.includes('23514'))) throw new ApiError(409, 'CONFIGURATION_CONSTRAINT', 'Configuration constraints rejected the change; refresh and check lifecycle and versions');
    throw error;
  }
}
export function designer(user: Principal) {
  if (!['ADMIN', 'TECHNICIAN'].includes(user.role)) throw new ApiError(403, 'DESIGNER_REQUIRED', 'ADMIN or survey-authorized TECHNICIAN design permission required');
}
export function admin(user: Principal) { if (user.role !== 'ADMIN') throw new ApiError(403, 'ADMIN_REQUIRED', 'ADMIN permission required'); }
export function scope(user: Principal): Prisma.SolarConfigurationWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'TECHNICIAN') return { survey: { assignedToId: user.id } };
  if (user.role === 'SALES') return { lead: leadScope(user) };
  throw new ApiError(403, 'FORBIDDEN', 'Your role cannot access solar configurations');
}
export async function handoff(tx: Transaction, user: Principal, input: { approvedSurveyId: string; approvedSurveyVersion: number; surveyReviewId: string }) {
  const approved = await requireApprovedSurvey(tx, user, input.approvedSurveyId);
  if (approved.approvedVersion !== input.approvedSurveyVersion || approved.reviewId !== input.surveyReviewId) throw new ApiError(409, 'SURVEY_APPROVAL_MISMATCH', 'Use the exact approved survey version and review ID');
  return approved;
}
export async function requireConfiguration(tx: Transaction, user: Principal, id: string, version?: number, editing = false) {
  const row = await tx.solarConfiguration.findFirst({ where: { AND: [{ id }, scope(user)] } });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Solar configuration not found');
  if (version !== undefined) {
    if (row.version !== version) throw new ApiError(409, 'VERSION_CONFLICT', 'Configuration changed; refresh before retrying');
    if (row.status === 'APPROVED' || row.status === 'ARCHIVED') throw new ApiError(409, 'CONFIGURATION_IMMUTABLE', 'Create a new revision instead of changing this record');
  }
  if (editing) {
    designer(user);
    if (!editable.includes(row.status)) throw new ApiError(409, 'CONFIGURATION_NOT_EDITABLE', 'Edit only DRAFT or REVISION_REQUIRED configurations');
    await handoff(tx, user, row);
  }
  return row;
}
export async function saveConfiguration(tx: Transaction, user: Principal, row: SolarConfiguration, data: Prisma.SolarConfigurationUncheckedUpdateInput, event: string, reason: string, details: object = {}) {
  if (typeof data.status === 'string' && data.status !== row.status && !transitions[row.status].includes(data.status)) throw new ApiError(409, 'INVALID_CONFIGURATION_TRANSITION', `Cannot move from ${row.status} to ${data.status}`);
  const update = await tx.solarConfiguration.updateMany({ where: { id: row.id, version: row.version }, data: { ...data, version: { increment: 1 } } });
  if (update.count !== 1) throw new ApiError(409, 'VERSION_CONFLICT', 'Configuration changed; refresh before retrying');
  const current = await tx.solarConfiguration.findUniqueOrThrow({ where: { id: row.id } });
  if (current.status !== row.status) await tx.billOfMaterials.update({ where: { configurationId: row.id }, data: { status: current.status } });
  await tx.solarConfigurationHistory.create({ data: { configurationId: row.id, actorId: user.id, event, fromStatus: row.status, toStatus: current.status, version: current.version, reason, details: json(details) } });
  return current;
}
