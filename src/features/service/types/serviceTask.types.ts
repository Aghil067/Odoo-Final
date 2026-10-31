/**
 * serviceTask.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Service Tasks, Field Inspections,
 * Spare Parts, and Repairs in Module M08.
 */

import type { ServicePriority } from './serviceTicket.types';
import type { TechnicianSkill } from '../../technicians/types/technician.types';

export type ServiceTaskStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'awaiting_parts'
  | 'completed'
  | 'cancelled';

export type RepairOutcome =
  | 'successfully_repaired'
  | 'temporary_fix'
  | 'replacement_required'
  | 'further_inspection_required'
  | 'unable_to_resolve';

export type ServicePhotoType =
  | 'before_repair'
  | 'during_repair'
  | 'after_repair'
  | 'equipment_condition'
  | 'other';

export interface ServicePhoto {
  id: string;
  photoType: ServicePhotoType;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ServiceInspectionRecord {
  inspectionDate: string;
  inspectionTime: string;
  equipmentCondition: string;
  observedProblem: string;
  errorCodes?: string;
  possibleRootCause: string;
  inspectionRemarks?: string;
  faultCategory: string;
  faultDescription: string;
  recommendedAction: string;
}

export interface ServiceRepairRecord {
  repairRequired: boolean;
  repairDescription: string;
  actionTaken: string;
  repairStartDate?: string;
  repairCompletionDate?: string;
  outcome: RepairOutcome;
  additionalRemarks?: string;
}

export interface SparePartRequirement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityRequired: number;
  quantityUsed: number;
  serialNumber?: string;
  warehouseId?: string;
  warehouseName?: string;
  issueReference?: string;
  remarks?: string;
}

export interface ServiceCustomerConfirmation {
  customerName: string;
  confirmed: boolean;
  remarks?: string;
  signaturePlaceholder?: string;
  confirmedAt?: string;
}

export interface ServiceTask {
  id: string;
  taskId: string; // e.g. "TSK-2026-001"
  ticketId: string; // internal id
  ticketRef: string; // e.g. "SRV-TKT-101"

  // Context
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  siteCity?: string;

  // Equipment
  productName: string;
  serialNumber?: string;

  // Requirements & Work
  requiredSkills: TechnicianSkill[];
  taskDescription: string;
  workInstructions?: string;
  priority: ServicePriority;

  // Assignment
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  expectedCompletionDate?: string;

  // Status & Progress
  status: ServiceTaskStatus;
  progressPercent: number; // 0 - 100

  // Field execution logs
  inspection?: ServiceInspectionRecord;
  repair?: ServiceRepairRecord;
  spareParts: SparePartRequirement[];
  photos: ServicePhoto[];
  customerConfirmation?: ServiceCustomerConfirmation;

  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTaskFormData {
  ticketId: string;
  ticketRef: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  siteCity?: string;
  productName: string;
  serialNumber?: string;
  requiredSkills: TechnicianSkill[];
  taskDescription: string;
  workInstructions?: string;
  priority: ServicePriority;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  expectedCompletionDate?: string;
}

export interface ServiceTaskFilters {
  search?: string;
  status?: ServiceTaskStatus;
  priority?: ServicePriority;
  technicianId?: string;
  ticketId?: string;
  scheduledDate?: string;
}

export const SERVICE_TASK_STATUS_LABELS: Record<ServiceTaskStatus, string> = {
  pending: 'Pending Assignment',
  assigned: 'Assigned',
  accepted: 'Accepted by Tech',
  scheduled: 'Visit Scheduled',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  awaiting_parts: 'Awaiting Spare Parts',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SERVICE_TASK_STATUS_COLOURS: Record<
  ServiceTaskStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  assigned: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  accepted: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  scheduled: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  on_hold: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  awaiting_parts: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
};

export const REPAIR_OUTCOME_LABELS: Record<RepairOutcome, string> = {
  successfully_repaired: 'Successfully Repaired on Site',
  temporary_fix: 'Temporary Operational Fix (Follow-up Required)',
  replacement_required: 'Hardware Replacement Required',
  further_inspection_required: 'Specialist Bench Testing Required',
  unable_to_resolve: 'Unable to Resolve on Site',
};

