/**
 * surveyService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for Site Survey Management.
 */

import type {
  Survey,
  CreateSurveyRequestData,
  SurveyExecutionData,
  SurveyFilters,
} from '../types/survey.types';
import { MOCK_SURVEYS } from '../data/mockSurveyData';

function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _surveysStore: Survey[] = [...MOCK_SURVEYS];
let _nextSurveyId = _surveysStore.length + 1;

export const surveyService = {
  async list(filters: SurveyFilters = {}): Promise<{ data: Survey[]; total: number }> {
    await delay();
    let results = [..._surveysStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.customerName.toLowerCase().includes(q) ||
          s.surveyId.toLowerCase().includes(q) ||
          s.siteLocation.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((s) => s.status === filters.status);
    }

    if (filters.approvalStatus) {
      results = results.filter((s) => s.approval.approvalStatus === filters.approvalStatus);
    }

    if (filters.surveyorId) {
      results = results.filter((s) => s.assignedSurveyorId === filters.surveyorId);
    }

    if (filters.systemType) {
      results = results.filter((s) => s.systemType === filters.systemType);
    }

    if (filters.dateFrom) {
      results = results.filter((s) => s.scheduledDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      results = results.filter((s) => s.scheduledDate <= filters.dateTo!);
    }

    // Sort by scheduledDate desc
    results.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

    const total = results.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const start = (page - 1) * pageSize;

    return {
      data: results.slice(start, start + pageSize),
      total,
    };
  },

  async getById(id: string): Promise<Survey | null> {
    await delay();
    return _surveysStore.find((s) => s.id === id) ?? null;
  },

  async create(data: CreateSurveyRequestData): Promise<Survey> {
    await delay(500);
    const id = `srv-${String(_nextSurveyId).padStart(3, '0')}`;
    const surveyId = `SRV-${String(_nextSurveyId).padStart(4, '0')}`;
    _nextSurveyId++;

    const now = new Date().toISOString();
    const survey: Survey = {
      ...data,
      id,
      surveyId,
      photos: [],
      status: data.saveAsDraft ? 'draft' : 'scheduled',
      approval: {
        approvalStatus: 'pending_approval',
      },
      createdAt: now,
      updatedAt: now,
    };

    _surveysStore = [survey, ..._surveysStore];
    return survey;
  },

  async saveExecution(id: string, data: SurveyExecutionData): Promise<Survey> {
    await delay(500);
    const idx = _surveysStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Survey not found');

    const updated: Survey = {
      ..._surveysStore[idx],
      roofInfo: data.roofInfo,
      electricalInfo: data.electricalInfo,
      feasibility: data.feasibility,
      photos: data.photos,
      customerConfirmation: data.customerConfirmation,
      status: data.submitForApproval ? 'submitted' : 'in_progress',
      updatedAt: new Date().toISOString(),
    };

    _surveysStore = [..._surveysStore.slice(0, idx), updated, ..._surveysStore.slice(idx + 1)];
    return updated;
  },

  async approve(id: string, approverId: string, approverName: string): Promise<Survey> {
    await delay(400);
    const idx = _surveysStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Survey not found');

    const now = new Date().toISOString();
    const updated: Survey = {
      ..._surveysStore[idx],
      status: 'approved',
      approval: {
        approvalStatus: 'approved',
        approverId,
        approverName,
        approvalDate: now,
      },
      updatedAt: now,
    };

    _surveysStore = [..._surveysStore.slice(0, idx), updated, ..._surveysStore.slice(idx + 1)];
    return updated;
  },

  async reject(id: string, approverId: string, approverName: string, reason: string): Promise<Survey> {
    await delay(400);
    const idx = _surveysStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Survey not found');

    const now = new Date().toISOString();
    const updated: Survey = {
      ..._surveysStore[idx],
      status: 'rejected',
      approval: {
        approvalStatus: 'rejected',
        approverId,
        approverName,
        approvalDate: now,
        rejectionReason: reason,
      },
      updatedAt: now,
    };

    _surveysStore = [..._surveysStore.slice(0, idx), updated, ..._surveysStore.slice(idx + 1)];
    return updated;
  },

  async requestReinspection(
    id: string,
    approverId: string,
    approverName: string,
    instructions: string
  ): Promise<Survey> {
    await delay(400);
    const idx = _surveysStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Survey not found');

    const now = new Date().toISOString();
    const updated: Survey = {
      ..._surveysStore[idx],
      status: 'reinspection_required',
      approval: {
        approvalStatus: 'pending_approval',
        approverId,
        approverName,
        approvalDate: now,
        reinspectionInstructions: instructions,
      },
      updatedAt: now,
    };

    _surveysStore = [..._surveysStore.slice(0, idx), updated, ..._surveysStore.slice(idx + 1)];
    return updated;
  },

  async getDashboardStats() {
    await delay(250);
    const all = _surveysStore;
    return {
      total: all.length,
      pending: all.filter((s) => s.status === 'scheduled' || s.status === 'assigned').length,
      scheduled: all.filter((s) => s.status === 'scheduled').length,
      inProgress: all.filter((s) => s.status === 'in_progress').length,
      submitted: all.filter((s) => s.status === 'submitted').length,
      approved: all.filter((s) => s.status === 'approved').length,
      rejected: all.filter((s) => s.status === 'rejected').length,
      reinspection: all.filter((s) => s.status === 'reinspection_required').length,
    };
  },
};

