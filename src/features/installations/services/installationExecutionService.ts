/**
 * installationExecutionService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for field technicians and managers during on-site execution:
 * Checklists, Time Tracking, Photos, Issues, and Completion Sign-off.
 */

import type {
  InstallationExecutionData,
  ExecutionChecklistItem,
  ChecklistItemStatus,
  InstallationTimeRecord,
  InstallationPhoto,
  InstallationIssue,
  InstallationCompletion,
} from '../types/execution.types';
import type { Installation } from '../types/installation.types';
import { MOCK_EXECUTION_DATA } from '../data/mockInstallationData';
import { installationService } from './installationService';

// Default checklist items for newly initialized installations
const DEFAULT_CHECKLIST_TEMPLATE: Omit<ExecutionChecklistItem, 'id'>[] = [
  { category: 'preparation', title: 'Site access confirmed & safety hazards surveyed', status: 'pending', required: true },
  { category: 'preparation', title: 'Materials received on site & inspected against BOM delivery slip', status: 'pending', required: true },
  { category: 'mounting', title: 'Mounting structure baseplates anchored with chemical fasteners', status: 'pending', required: true },
  { category: 'mounting', title: 'Aluminium rails leveled & aligned at optimal tilt angle', status: 'pending', required: true },
  { category: 'solar_panels', title: 'Solar PV modules mounted and torqued with mid/end clamps', status: 'pending', required: true },
  { category: 'inverter', title: 'Inverter wall-mounted in shaded, ventilated area with clearance', status: 'pending', required: true },
  { category: 'battery', title: 'Battery storage module securely racked with DC breaker (if applicable)', status: 'not_applicable', required: false },
  { category: 'electrical', title: 'DC string cabling routed through UV-resistant conduits', status: 'pending', required: true },
  { category: 'electrical', title: 'AC distribution box (ACDB) & DC isolator box wired properly', status: 'pending', required: true },
  { category: 'electrical', title: 'Dual chemical earthing pits & lightning arrestor bonded', status: 'pending', required: true },
  { category: 'testing', title: 'Open circuit voltage (Voc) & short circuit current (Isc) verified', status: 'pending', required: true },
  { category: 'testing', title: 'Grid synchronisation test & inverter mobile app configuration', status: 'pending', required: true },
  { category: 'handover', title: 'Site cleaned up and customer briefing on operation and monitoring', status: 'pending', required: true },
];

let executionStore: Record<string, InstallationExecutionData> = { ...MOCK_EXECUTION_DATA };

export const installationExecutionService = {
  /**
   * Get or initialize execution data for an installation.
   */
  async getExecution(installationId: string): Promise<InstallationExecutionData> {
    if (!executionStore[installationId]) {
      executionStore[installationId] = {
        installationId,
        checklists: DEFAULT_CHECKLIST_TEMPLATE.map((item, idx) => ({
          ...item,
          id: `chk-${installationId}-${idx + 1}`,
        })),
        timeRecords: [],
        photos: [],
        issues: [],
      };
    }
    return JSON.parse(JSON.stringify(executionStore[installationId]));
  },

  /**
   * Update checklist item status.
   */
  async updateChecklistItem(
    installationId: string,
    itemId: string,
    status: ChecklistItemStatus,
    remarks?: string,
    completedBy?: string
  ): Promise<ExecutionChecklistItem[]> {
    const data = await this.getExecution(installationId);
    const itemIndex = data.checklists.findIndex((c) => c.id === itemId);

    if (itemIndex !== -1) {
      data.checklists[itemIndex] = {
        ...data.checklists[itemIndex],
        status,
        remarks: remarks !== undefined ? remarks : data.checklists[itemIndex].remarks,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        completedBy: status === 'completed' ? (completedBy || 'Technician') : undefined,
      };

      executionStore[installationId] = data;

      // Log activity
      await installationService.update(installationId, {}, completedBy || 'Technician');
    }

    return [...data.checklists];
  },

  /**
   * Add a work time record.
   */
  async addTimeRecord(
    installationId: string,
    record: Omit<InstallationTimeRecord, 'id'>
  ): Promise<InstallationTimeRecord> {
    const data = await this.getExecution(installationId);
    const newRecord: InstallationTimeRecord = {
      ...record,
      id: `tim-${Date.now()}`,
    };

    data.timeRecords.unshift(newRecord);
    executionStore[installationId] = data;
    return newRecord;
  },

  /**
   * Add an installation photo.
   */
  async addPhoto(
    installationId: string,
    photo: Omit<InstallationPhoto, 'id' | 'uploadedAt'>
  ): Promise<InstallationPhoto> {
    const data = await this.getExecution(installationId);
    const newPhoto: InstallationPhoto = {
      ...photo,
      id: `pht-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };

    data.photos.unshift(newPhoto);
    executionStore[installationId] = data;
    return newPhoto;
  },

  /**
   * Delete an installation photo.
   */
  async deletePhoto(installationId: string, photoId: string): Promise<boolean> {
    const data = await this.getExecution(installationId);
    data.photos = data.photos.filter((p) => p.id !== photoId);
    executionStore[installationId] = data;
    return true;
  },

  /**
   * Report an on-site issue or observation.
   */
  async addIssue(
    installationId: string,
    issue: Omit<InstallationIssue, 'id' | 'reportedAt' | 'status'>
  ): Promise<InstallationIssue> {
    const data = await this.getExecution(installationId);
    const newIssue: InstallationIssue = {
      ...issue,
      id: `iss-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: 'open',
    };

    data.issues.unshift(newIssue);
    executionStore[installationId] = data;
    return newIssue;
  },

  /**
   * Mark an issue as resolved.
   */
  async resolveIssue(
    installationId: string,
    issueId: string,
    actionTaken: string,
    resolvedBy: string
  ): Promise<InstallationIssue> {
    const data = await this.getExecution(installationId);
    const idx = data.issues.findIndex((i) => i.id === issueId);
    if (idx === -1) throw new Error('Issue not found');

    const updatedIssue: InstallationIssue = {
      ...data.issues[idx],
      status: 'resolved',
      actionTaken,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
    };

    data.issues[idx] = updatedIssue;
    executionStore[installationId] = data;
    return updatedIssue;
  },

  /**
   * Submit completion & customer sign-off.
   */
  async submitCompletion(
    installationId: string,
    completionData: Omit<InstallationCompletion, 'submittedDate' | 'reviewStatus'>
  ): Promise<Installation> {
    const data = await this.getExecution(installationId);
    const nowIso = new Date().toISOString();

    const fullCompletion: InstallationCompletion = {
      ...completionData,
      submittedDate: nowIso,
      reviewStatus: 'pending',
    };

    data.completion = fullCompletion;
    executionStore[installationId] = data;

    // Transition installation status to 'completion_submitted'
    return await installationService.updateStatus(
      installationId,
      'completion_submitted',
      `Completion submitted by ${completionData.submittedBy} with testing result: ${completionData.testingResult.toUpperCase()}`,
      completionData.submittedBy
    );
  },

  /**
   * Manager review & verify installation.
   */
  async reviewCompletion(
    installationId: string,
    decision: 'approved' | 'rejected',
    remarks: string,
    reviewedBy: string
  ): Promise<Installation> {
    const data = await this.getExecution(installationId);
    if (!data.completion) throw new Error('No completion record submitted yet');

    data.completion.reviewedBy = reviewedBy;
    data.completion.reviewDate = new Date().toISOString();
    data.completion.reviewStatus = decision;
    data.completion.reviewRemarks = remarks;
    executionStore[installationId] = data;

    const newStatus = decision === 'approved' ? 'verified' : 'in_progress';
    return await installationService.updateStatus(
      installationId,
      newStatus,
      `Installation review ${decision.toUpperCase()} by ${reviewedBy}: ${remarks}`,
      reviewedBy
    );
  },
};

