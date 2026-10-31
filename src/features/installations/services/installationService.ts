/**
 * installationService.ts
 * ─────────────────────────────────────────────────────────────
 * Master service layer for M05: Installation Management.
 */

import type {
  Installation,
  InstallationFilters,
  InstallationFormData,
  InstallationStatus,
  InstallationSchedule,
  InstallationActivity,
} from '../types/installation.types';
import { MOCK_INSTALLATIONS } from '../data/mockInstallationData';

export interface InstallationDashboardStats {
  total: number;
  draft: number;
  awaitingMaterial: number;
  readyForScheduling: number;
  scheduled: number;
  inProgress: number;
  onHold: number;
  completed: number;
  completionSubmitted: number;
  verified: number;
  delayed: number;
}

// In-memory state holding installations for the session
let installationsStore: Installation[] = [...MOCK_INSTALLATIONS];

export const installationService = {
  /**
   * List installations with filtering, search, and sorting.
   */
  async list(filters?: InstallationFilters): Promise<Installation[]> {
    let result = [...installationsStore];

    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.installationId.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.siteCity.toLowerCase().includes(q) ||
          i.configurationRef.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((i) => i.status === filters.status);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((i) => i.type === filters.type);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter((i) => i.priority === filters.priority);
    }

    if (filters.assignedTeam) {
      result = result.filter((i) => i.schedule.assignedTeam === filters.assignedTeam);
    }

    if (filters.installationManager) {
      result = result.filter((i) =>
        i.schedule.installationManager.toLowerCase().includes(filters.installationManager!.toLowerCase())
      );
    }

    if (filters.materialReadiness && filters.materialReadiness !== 'all') {
      result = result.filter((i) => i.overallMaterialReadiness === filters.materialReadiness);
    }

    if (filters.dateFrom) {
      result = result.filter((i) => i.schedule.plannedStartDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter((i) => i.schedule.plannedStartDate <= filters.dateTo!);
    }

    return result;
  },

  /**
   * Get an installation by ID or Installation ID (e.g. "ins-001" or "INS-2026-001")
   */
  async getById(id: string): Promise<Installation | null> {
    const found = installationsStore.find(
      (i) => i.id === id || i.installationId.toLowerCase() === id.toLowerCase()
    );
    return found ? { ...found } : null;
  },

  /**
   * Create a new installation work order.
   */
  async create(data: InstallationFormData, createdBy: string = 'Current User'): Promise<Installation> {
    const nextNum = installationsStore.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newId = `ins-${padded}`;
    const newInstallationId = `INS-2026-${padded}`;
    const nowIso = new Date().toISOString();

    const newActivity: InstallationActivity = {
      id: `act-${Date.now()}`,
      type: 'created',
      description: `Work order ${newInstallationId} created for ${data.customerName}`,
      performedBy: createdBy,
      timestamp: nowIso,
    };

    const newRecord: Installation = {
      id: newId,
      installationId: newInstallationId,
      title: data.title,
      type: data.type,
      priority: data.priority,
      status: 'draft',
      overallMaterialReadiness: 'not_checked',

      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      siteId: data.siteId,
      siteAddress: data.siteAddress,
      siteCity: data.siteCity,
      siteState: data.siteState,
      sitePincode: data.sitePincode,

      surveyId: data.surveyId,
      surveyRef: data.surveyRef,
      configurationId: data.configurationId,
      configurationRef: data.configurationRef,
      configurationName: data.configurationName,
      systemType: data.systemType,
      systemCapacity: data.systemCapacity,

      specialInstructions: data.specialInstructions,
      siteContact: {
        contactPerson: data.contactPerson,
        contactNumber: data.contactNumber,
      },

      schedule: {
        plannedStartDate: data.plannedStartDate,
        plannedEndDate: data.plannedEndDate,
        assignedTeam: data.assignedTeam,
        assignedTechnicians: [],
        installationManager: data.installationManager,
      },

      materials: [],
      materialIssueReferences: [],
      activities: [newActivity],

      createdAt: nowIso,
      updatedAt: nowIso,
    };

    installationsStore.unshift(newRecord);
    return { ...newRecord };
  },

  /**
   * Update installation general details.
   */
  async update(id: string, updates: Partial<Installation>, _updatedBy: string = 'Current User'): Promise<Installation> {
    const idx = installationsStore.findIndex((i) => i.id === id || i.installationId === id);
    if (idx === -1) throw new Error('Installation not found');

    const current = installationsStore[idx];
    const nowIso = new Date().toISOString();

    const updatedRecord: Installation = {
      ...current,
      ...updates,
      updatedAt: nowIso,
    };

    installationsStore[idx] = updatedRecord;
    return { ...updatedRecord };
  },

  /**
   * Update installation status with workflow validation and automatic activity logging.
   */
  async updateStatus(
    id: string,
    newStatus: InstallationStatus,
    notes?: string,
    performedBy: string = 'Current User'
  ): Promise<Installation> {
    const idx = installationsStore.findIndex((i) => i.id === id || i.installationId === id);
    if (idx === -1) throw new Error('Installation not found');

    const current = installationsStore[idx];
    const nowIso = new Date().toISOString();

    let activityType: InstallationActivity['type'] = 'checklist_updated';
    if (newStatus === 'scheduled') activityType = 'scheduled';
    else if (newStatus === 'in_progress') activityType = 'work_started';
    else if (newStatus === 'on_hold') activityType = 'work_paused';
    else if (newStatus === 'completed') activityType = 'work_completed';
    else if (newStatus === 'completion_submitted') activityType = 'completion_submitted';
    else if (newStatus === 'verified') activityType = 'verified';
    else if (newStatus === 'cancelled') activityType = 'cancelled';

    const newActivity: InstallationActivity = {
      id: `act-${Date.now()}`,
      type: activityType,
      description: `Status changed from ${current.status.replace('_', ' ')} to ${newStatus.replace('_', ' ')}${notes ? `: ${notes}` : ''}`,
      performedBy,
      timestamp: nowIso,
      notes,
    };

    const updatedSchedule = { ...current.schedule };
    if (newStatus === 'in_progress' && !updatedSchedule.actualStartDate) {
      updatedSchedule.actualStartDate = nowIso.split('T')[0];
    }
    if ((newStatus === 'completed' || newStatus === 'completion_submitted' || newStatus === 'verified') && !updatedSchedule.actualEndDate) {
      updatedSchedule.actualEndDate = nowIso.split('T')[0];
    }

    const updatedRecord: Installation = {
      ...current,
      status: newStatus,
      schedule: updatedSchedule,
      activities: [newActivity, ...current.activities],
      updatedAt: nowIso,
    };

    installationsStore[idx] = updatedRecord;
    return { ...updatedRecord };
  },

  /**
   * Update installation schedule.
   */
  async updateSchedule(
    id: string,
    newSchedule: Partial<InstallationSchedule>,
    performedBy: string = 'Current User'
  ): Promise<Installation> {
    const idx = installationsStore.findIndex((i) => i.id === id || i.installationId === id);
    if (idx === -1) throw new Error('Installation not found');

    const current = installationsStore[idx];
    const nowIso = new Date().toISOString();

    const mergedSchedule: InstallationSchedule = {
      ...current.schedule,
      ...newSchedule,
    };

    const newActivity: InstallationActivity = {
      id: `act-${Date.now()}`,
      type: 'rescheduled',
      description: `Schedule updated: ${mergedSchedule.plannedStartDate} to ${mergedSchedule.plannedEndDate} (${mergedSchedule.assignedTeam || 'Unassigned'})`,
      performedBy,
      timestamp: nowIso,
    };

    const updatedRecord: Installation = {
      ...current,
      schedule: mergedSchedule,
      activities: [newActivity, ...current.activities],
      updatedAt: nowIso,
    };

    installationsStore[idx] = updatedRecord;
    return { ...updatedRecord };
  },

  /**
   * Compute dashboard stats dynamically.
   */
  async getDashboardStats(): Promise<InstallationDashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    const all = installationsStore;

    // Check for delayed jobs: plannedEndDate < today and status not in (completed, completion_submitted, verified, cancelled)
    const delayed = all.filter((i) => {
      const isClosed = ['completed', 'completion_submitted', 'verified', 'cancelled'].includes(i.status);
      return !isClosed && i.schedule.plannedEndDate < today;
    }).length;

    return {
      total: all.length,
      draft: all.filter((i) => i.status === 'draft').length,
      awaitingMaterial: all.filter((i) => i.status === 'awaiting_material').length,
      readyForScheduling: all.filter((i) => i.status === 'ready_for_scheduling').length,
      scheduled: all.filter((i) => i.status === 'scheduled').length,
      inProgress: all.filter((i) => i.status === 'in_progress').length,
      onHold: all.filter((i) => i.status === 'on_hold').length,
      completed: all.filter((i) => i.status === 'completed').length,
      completionSubmitted: all.filter((i) => i.status === 'completion_submitted').length,
      verified: all.filter((i) => i.status === 'verified').length,
      delayed,
    };
  },
};
