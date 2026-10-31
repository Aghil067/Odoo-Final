/**
 * assignmentService.ts
 * ─────────────────────────────────────────────────────────────
 * Master service layer for technician work order assignments.
 * Links to M05 Installation Management and future M08 Service Tasks.
 */

import type {
  TechnicianAssignment,
  AssignmentFilters,
  AssignmentFormData,
  AssignmentStatus,
  AssignedCrewMember,
} from '../types/assignment.types';
import { MOCK_ASSIGNMENTS, MOCK_TEAMS, MOCK_TECHNICIANS } from '../data/mockTechnicianData';
import { technicianService } from './technicianService';

let assignmentsStore: TechnicianAssignment[] = [...MOCK_ASSIGNMENTS];

export const assignmentService = {
  /**
   * List all assignments with multi-attribute filtering.
   */
  async list(filters?: AssignmentFilters): Promise<TechnicianAssignment[]> {
    let result = [...assignmentsStore];

    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.assignmentId.toLowerCase().includes(q) ||
          a.referenceId.toLowerCase().includes(q) ||
          a.customerName.toLowerCase().includes(q) ||
          a.referenceTitle.toLowerCase().includes(q) ||
          a.siteCity.toLowerCase().includes(q)
      );
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((a) => a.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter((a) => a.priority === filters.priority);
    }

    if (filters.teamId && filters.teamId !== 'all') {
      result = result.filter((a) => a.assignedTeamId === filters.teamId);
    }

    if (filters.technicianId && filters.technicianId !== 'all') {
      result = result.filter((a) =>
        a.assignedTechnicians.some((t) => t.technicianId === filters.technicianId)
      );
    }

    if (filters.dateFrom) {
      result = result.filter((a) => a.scheduledStartDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter((a) => a.scheduledStartDate <= filters.dateTo!);
    }

    return result;
  },

  /**
   * Get assignment by ID.
   */
  async getById(id: string): Promise<TechnicianAssignment | null> {
    const found = assignmentsStore.find(
      (a) => a.id === id || a.assignmentId.toLowerCase() === id.toLowerCase()
    );
    return found ? { ...found } : null;
  },

  /**
   * Get assignments assigned to a specific technician (for "My Assignments" view).
   */
  async getMyAssignments(technicianId: string): Promise<TechnicianAssignment[]> {
    return assignmentsStore.filter((a) =>
      a.assignedTechnicians.some((t) => t.technicianId === technicianId)
    );
  },

  /**
   * Create a new assignment.
   */
  async create(data: AssignmentFormData, assignedBy: string = 'Installation Manager'): Promise<TechnicianAssignment> {
    const nextNum = assignmentsStore.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newId = `asn-${padded}`;
    const newAsnId = `ASN-2026-${padded}`;
    const nowIso = new Date().toISOString();

    const team = MOCK_TEAMS.find((tm) => tm.id === data.assignedTeamId);

    // Resolve assigned technicians details
    const assignedTechnicians: AssignedCrewMember[] = data.technicianIds.map((tid) => {
      const tech = MOCK_TECHNICIANS.find((t) => t.id === tid);
      return {
        technicianId: tid,
        name: tech?.fullName || 'Technician',
        role: tid === team?.leaderId ? 'Crew Leader' : 'Crew Member',
        phone: tech?.phone || '',
        status: 'assigned',
      };
    });

    const newAssignment: TechnicianAssignment = {
      id: newId,
      assignmentId: newAsnId,
      type: data.type,
      priority: data.priority,
      status: 'assigned',

      referenceId: data.referenceId,
      referenceTitle: data.referenceTitle,

      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      siteAddress: data.siteAddress,
      siteCity: data.siteCity,

      systemCapacity: data.systemCapacity,
      systemType: data.systemType,
      requiredSkills: data.requiredSkills,

      scheduledStartDate: data.scheduledStartDate,
      scheduledEndDate: data.scheduledEndDate,
      scheduledStartTime: data.scheduledStartTime || '08:30',
      scheduledEndTime: data.scheduledEndTime || '17:30',

      assignedTeamId: data.assignedTeamId,
      assignedTeamName: team?.name,
      assignedTechnicians,
      assignedBy,
      assignedAt: nowIso,

      workInstructions: data.workInstructions,

      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: nowIso,
          type: 'created',
          description: `Assignment ${newAsnId} created for ${data.referenceId} (${data.customerName})`,
          performedBy: assignedBy,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    assignmentsStore.unshift(newAssignment);

    // Update technicians' availability status to 'assigned'
    for (const tid of data.technicianIds) {
      await technicianService.update(tid, {
        availabilityStatus: 'assigned',
        currentAssignmentSummary: `${newAssignment.referenceId} (${newAssignment.customerName})`,
      });
    }

    return { ...newAssignment };
  },

  /**
   * Update assignment status with audit event logging.
   */
  async updateStatus(
    assignmentId: string,
    newStatus: AssignmentStatus,
    notes?: string,
    performedBy: string = 'Current User'
  ): Promise<TechnicianAssignment> {
    const idx = assignmentsStore.findIndex(
      (a) => a.id === assignmentId || a.assignmentId === assignmentId
    );
    if (idx === -1) throw new Error('Assignment not found');

    const current = assignmentsStore[idx];
    const nowIso = new Date().toISOString();

    let eventType: Parameters<typeof assignmentsStore[0]['history']['push']>[0]['type'] = 'started';
    if (newStatus === 'accepted') eventType = 'accepted';
    else if (newStatus === 'in_progress') eventType = 'started';
    else if (newStatus === 'completed') eventType = 'completed';
    else if (newStatus === 'reassigned') eventType = 'reassigned';
    else if (newStatus === 'cancelled') eventType = 'cancelled';

    const newHistoryEvent = {
      id: `h-${Date.now()}`,
      timestamp: nowIso,
      type: eventType,
      description: `Assignment status updated to ${newStatus.replace('_', ' ').toUpperCase()}${notes ? `: ${notes}` : ''}`,
      performedBy,
      notes,
    };

    const updatedAssignment: TechnicianAssignment = {
      ...current,
      status: newStatus,
      actualStartDate: newStatus === 'in_progress' && !current.actualStartDate ? nowIso.split('T')[0] : current.actualStartDate,
      actualEndDate: newStatus === 'completed' && !current.actualEndDate ? nowIso.split('T')[0] : current.actualEndDate,
      remarks: notes ? `${current.remarks ? `${current.remarks} | ` : ''}${notes}` : current.remarks,
      history: [newHistoryEvent, ...current.history],
      updatedAt: nowIso,
    };

    assignmentsStore[idx] = updatedAssignment;

    // If completed or cancelled, release technicians back to 'available'
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      for (const t of current.assignedTechnicians) {
        await technicianService.update(t.technicianId, {
          availabilityStatus: 'available',
          currentAssignmentSummary: undefined,
        });
      }
    } else if (newStatus === 'in_progress') {
      for (const t of current.assignedTechnicians) {
        await technicianService.update(t.technicianId, {
          availabilityStatus: 'busy',
        });
      }
    }

    return { ...updatedAssignment };
  },

  /**
   * Reassign assignment to a new team or technicians.
   */
  async reassign(
    assignmentId: string,
    newTeamId?: string,
    newTechnicianIds?: string[],
    performedBy: string = 'Installation Manager'
  ): Promise<TechnicianAssignment> {
    const idx = assignmentsStore.findIndex(
      (a) => a.id === assignmentId || a.assignmentId === assignmentId
    );
    if (idx === -1) throw new Error('Assignment not found');

    const current = assignmentsStore[idx];
    const nowIso = new Date().toISOString();

    const team = newTeamId ? MOCK_TEAMS.find((tm) => tm.id === newTeamId) : undefined;

    let assignedTechnicians = current.assignedTechnicians;
    if (newTechnicianIds && newTechnicianIds.length > 0) {
      assignedTechnicians = newTechnicianIds.map((tid) => {
        const tech = MOCK_TECHNICIANS.find((t) => t.id === tid);
        return {
          technicianId: tid,
          name: tech?.fullName || 'Technician',
          role: tid === team?.leaderId ? 'Crew Leader' : 'Crew Member',
          phone: tech?.phone || '',
          status: 'assigned',
        };
      });
    }

    const updatedAssignment: TechnicianAssignment = {
      ...current,
      status: 'reassigned',
      assignedTeamId: newTeamId || current.assignedTeamId,
      assignedTeamName: team ? team.name : current.assignedTeamName,
      assignedTechnicians,
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: nowIso,
          type: 'reassigned',
          description: `Reassigned to ${team?.name || 'new technicians'} by ${performedBy}`,
          performedBy,
        },
        ...current.history,
      ],
      updatedAt: nowIso,
    };

    assignmentsStore[idx] = updatedAssignment;
    return { ...updatedAssignment };
  },
};
