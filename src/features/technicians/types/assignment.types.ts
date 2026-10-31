/**
 * assignment.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Technician Assignments to M05 Installations
 * and M08 Service Tasks.
 */

import type { TechnicianSkill } from './technician.types';

export type AssignmentType = 'installation' | 'service_task';

export type AssignmentStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'reassigned'
  | 'cancelled';

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AssignedCrewMember {
  technicianId: string;
  name: string;
  role: string;
  phone: string;
  status: 'assigned' | 'accepted' | 'declined';
}

export interface AssignmentHistoryEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'team_assigned' | 'technician_added' | 'accepted' | 'started' | 'completed' | 'reassigned' | 'cancelled';
  description: string;
  performedBy: string;
  notes?: string;
}

export interface TechnicianAssignment {
  id: string;
  assignmentId: string; // e.g. "ASN-2026-001"
  type: AssignmentType;
  priority: AssignmentPriority;
  status: AssignmentStatus;

  // Linked Reference: M05 Installation or M08 Service Ticket
  referenceId: string; // e.g. "INS-2026-001" or "SRV-TKT-101"
  referenceTitle: string;

  // Customer & Location
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  siteCity: string;

  // Technical Specs
  systemCapacity?: string; // e.g. "3 kW"
  systemType?: string;
  requiredSkills: TechnicianSkill[];

  // Schedule
  scheduledStartDate: string;
  scheduledEndDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartDate?: string;
  actualEndDate?: string;

  // Crew & Management
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedTechnicians: AssignedCrewMember[];
  assignedBy: string;
  assignedAt: string;

  workInstructions?: string;
  remarks?: string;

  history: AssignmentHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentFormData {
  type: AssignmentType;
  referenceId: string;
  referenceTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  siteCity: string;
  systemCapacity?: string;
  systemType?: string;
  requiredSkills: TechnicianSkill[];
  scheduledStartDate: string;
  scheduledEndDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  assignedTeamId?: string;
  technicianIds: string[];
  priority: AssignmentPriority;
  workInstructions?: string;
}

export interface AssignmentFilters {
  search?: string;
  type?: AssignmentType | 'all';
  status?: AssignmentStatus | 'all';
  technicianId?: string | 'all';
  teamId?: string | 'all';
  priority?: AssignmentPriority | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: 'Pending Assignment',
  assigned: 'Assigned',
  accepted: 'Accepted by Crew',
  in_progress: 'In Progress',
  completed: 'Completed',
  reassigned: 'Reassigned',
  cancelled: 'Cancelled',
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  in_progress: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  reassigned: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};
