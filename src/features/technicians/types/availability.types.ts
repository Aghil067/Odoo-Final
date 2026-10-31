/**
 * availability.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Technician Availability and Schedules.
 */

import type { AvailabilityStatus } from './technician.types';

export interface LeaveRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  startDate: string;
  endDate: string;
  leaveType: 'sick' | 'casual' | 'annual' | 'emergency';
  reason?: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface DailyScheduleSlot {
  date: string;
  status: AvailabilityStatus;
  assignmentId?: string;
  assignmentTitle?: string;
  customerName?: string;
  siteCity?: string;
  hours: number;
}

export interface TechnicianAvailabilitySummary {
  technicianId: string;
  technicianName: string;
  teamName?: string;
  status: AvailabilityStatus;
  activeAssignmentCount: number;
  currentAssignmentSummary?: string;
  nextAvailableDate: string;
  leaves: LeaveRecord[];
  upcomingDays: DailyScheduleSlot[];
}
