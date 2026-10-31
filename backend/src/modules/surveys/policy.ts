import { Prisma, type SurveyStatus } from '@prisma/client';
import { atomic, type Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';

export const activeSurveyStatuses: SurveyStatus[] = ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED'];
export const terminalSurveyStatuses: SurveyStatus[] = ['APPROVED', 'REJECTED', 'CANCELED'];
export const editableSurveyStatuses: SurveyStatus[] = ['IN_PROGRESS', 'REVISION_REQUIRED'];
export const surveyTransitions: Record<SurveyStatus, readonly SurveyStatus[]> = {
  REQUESTED: ['SCHEDULED', 'CANCELED'], SCHEDULED: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['SUBMITTED', 'CANCELED'], SUBMITTED: ['APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'CANCELED'],
  REVISION_REQUIRED: ['SCHEDULED', 'SUBMITTED', 'CANCELED'], APPROVED: [], REJECTED: [], CANCELED: [],
};

export function requireTransition(from: SurveyStatus, to: SurveyStatus) {
  if (!surveyTransitions[from].includes(to)) throw new ApiError(409, 'INVALID_SURVEY_TRANSITION', `Cannot move from ${from} to ${to}`);
}

export async function surveyAtomic<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  try { return await atomic(work); }
  catch (error) {
    // PostgreSQL exclusion violations can be wrapped differently by Prisma's engine.
    // Inspect internally; never return raw database messages or constraint contents.
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      const internal = error.message;
      if (internal.includes('SiteSurvey_no_overlap') || internal.includes('23P01') || internal.includes('SiteSurvey_one_running_visit')) {
        throw new ApiError(409, 'SURVEYOR_BUSY', 'The surveyor has a conflicting appointment or an ongoing visit');
      }
      if ((error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2004') || internal.includes('23514')) {
        throw new ApiError(409, 'SURVEY_CONSTRAINT', 'Survey constraints rejected the change; refresh and check its current lifecycle and assignment');
      }
    }
    throw error;
  }
}
