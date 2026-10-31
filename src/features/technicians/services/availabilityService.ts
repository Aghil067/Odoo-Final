/**
 * availabilityService.ts
 * ─────────────────────────────────────────────────────────────
 * Master service layer for tracking technician availability,
 * leave requests, conflict checks, and upcoming schedule slots.
 */

import type {
  TechnicianAvailabilitySummary,
  LeaveRecord,
  DailyScheduleSlot,
} from '../types/availability.types';
import type { AvailabilityStatus } from '../types/technician.types';
import { MOCK_LEAVES, MOCK_ASSIGNMENTS } from '../data/mockTechnicianData';
import { technicianService } from './technicianService';

let leavesStore: LeaveRecord[] = [...MOCK_LEAVES];

export const availabilityService = {
  /**
   * Fetch real-time availability summary for all technicians with 7-day schedule forecast.
   */
  async getAvailabilityOverview(): Promise<TechnicianAvailabilitySummary[]> {
    const technicians = await technicianService.list();
    const today = new Date('2026-10-31');

    return technicians.map((tech) => {
      // Find leaves
      const techLeaves = leavesStore.filter(
        (l) => l.technicianId === tech.id && l.status === 'approved'
      );

      // Find active assignments
      const techAssignments = MOCK_ASSIGNMENTS.filter((a) =>
        a.assignedTechnicians.some((at) => at.technicianId === tech.id) &&
        (a.status === 'in_progress' || a.status === 'assigned' || a.status === 'accepted')
      );

      // Generate 7-day forecast slots
      const upcomingDays: DailyScheduleSlot[] = [];
      for (let i = 0; i < 7; i++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + i);
        const dateStr = slotDate.toISOString().split('T')[0];

        // Check if on leave
        const isOnLeave = techLeaves.some(
          (l) => l.startDate <= dateStr && l.endDate >= dateStr
        );

        // Check active assignment on this date
        const activeJob = techAssignments.find(
          (a) => a.scheduledStartDate <= dateStr && a.scheduledEndDate >= dateStr
        );

        let slotStatus: AvailabilityStatus = 'available';
        if (isOnLeave) slotStatus = 'on_leave';
        else if (activeJob) slotStatus = activeJob.status === 'in_progress' ? 'busy' : 'assigned';

        upcomingDays.push({
          date: dateStr,
          status: slotStatus,
          assignmentId: activeJob?.referenceId,
          assignmentTitle: activeJob?.referenceTitle,
          customerName: activeJob?.customerName,
          siteCity: activeJob?.siteCity,
          hours: activeJob ? 8 : 0,
        });
      }

      return {
        technicianId: tech.id,
        technicianName: tech.fullName,
        teamName: tech.teamName,
        status: tech.availabilityStatus,
        activeAssignmentCount: techAssignments.length,
        currentAssignmentSummary: tech.currentAssignmentSummary,
        nextAvailableDate: tech.nextAvailableDate || '2026-10-31',
        leaves: techLeaves,
        upcomingDays,
      };
    });
  },

  /**
   * Update technician live availability state.
   */
  async updateStatus(technicianId: string, status: AvailabilityStatus) {
    return await technicianService.update(technicianId, { availabilityStatus: status });
  },

  /**
   * Get all approved or pending leaves.
   */
  async getLeaves(technicianId?: string): Promise<LeaveRecord[]> {
    if (technicianId) {
      return leavesStore.filter((l) => l.technicianId === technicianId);
    }
    return [...leavesStore];
  },

  /**
   * Submit leave request.
   */
  async requestLeave(leaveData: Omit<LeaveRecord, 'id'>): Promise<LeaveRecord> {
    const newLeave: LeaveRecord = {
      ...leaveData,
      id: `lv-${Date.now()}`,
    };
    leavesStore.unshift(newLeave);

    // Update technician availability status to on_leave if current date falls within range
    await technicianService.update(leaveData.technicianId, {
      availabilityStatus: 'on_leave',
    });

    return newLeave;
  },

  /**
   * Conflict check: determines if technician is already booked or on leave between dates.
   */
  async checkConflicts(
    technicianId: string,
    startDate: string,
    endDate: string
  ): Promise<{ hasConflict: boolean; reason?: string }> {
    // 1. Check leaves
    const onLeave = leavesStore.find(
      (l) =>
        l.technicianId === technicianId &&
        l.status === 'approved' &&
        !(l.endDate < startDate || l.startDate > endDate)
    );
    if (onLeave) {
      return {
        hasConflict: true,
        reason: `Technician is on approved ${onLeave.leaveType} leave from ${onLeave.startDate} to ${onLeave.endDate}`,
      };
    }

    // 2. Check overlapping assignments
    const overlapping = MOCK_ASSIGNMENTS.find(
      (a) =>
        (a.status === 'in_progress' || a.status === 'assigned' || a.status === 'accepted') &&
        a.assignedTechnicians.some((at) => at.technicianId === technicianId) &&
        !(a.scheduledEndDate < startDate || a.scheduledStartDate > endDate)
    );

    if (overlapping) {
      return {
        hasConflict: true,
        reason: `Technician already assigned to ${overlapping.referenceId} (${overlapping.customerName}) from ${overlapping.scheduledStartDate} to ${overlapping.scheduledEndDate}`,
      };
    }

    return { hasConflict: false };
  },
};
