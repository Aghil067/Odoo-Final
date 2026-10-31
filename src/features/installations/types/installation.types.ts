/**
 * installation.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces and status types for M05: Installation Management.
 */

import type { SystemType } from '../../crm/types/enquiry.types';

// ─── Status Workflow ──────────────────────────────────────────

export type InstallationStatus =
  | 'draft'
  | 'awaiting_material'
  | 'ready_for_scheduling'
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'completion_submitted'
  | 'verified'
  | 'cancelled';

export type InstallationPriority = 'low' | 'medium' | 'high';

export type InstallationType = 'residential' | 'commercial';

export type MaterialReadinessStatus =
  | 'not_checked'
  | 'available'
  | 'partially_available'
  | 'unavailable'
  | 'reserved'
  | 'issued';

// ─── Material & Issue Types ───────────────────────────────────

export interface InstallationMaterial {
  id: string;
  productId?: string;
  productName: string;
  category: string;
  modelNumber?: string;
  requiredQuantity: number;
  availableQuantity?: number;
  allocatedQuantity?: number;
  issuedQuantity?: number;
  unit: string;
  materialStatus: MaterialReadinessStatus;
  inventoryProductId?: string;
  notes?: string;
}

export interface MaterialIssueReferenceItem {
  productName: string;
  quantity: number;
  unit: string;
  serialNumbers: string[];
}

export interface MaterialIssueReference {
  issueId: string;
  issueNumber: string;
  warehouseId: string;
  warehouseName: string;
  issueDate: string;
  status: 'draft' | 'issued' | 'cancelled';
  items: MaterialIssueReferenceItem[];
  issuedTo: string;
  notes?: string;
}

// ─── Schedule & Assignment ────────────────────────────────────

export interface AssignedTechnician {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface InstallationSchedule {
  plannedStartDate: string;
  plannedEndDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedTeam?: string;
  assignedTechnicians: AssignedTechnician[];
  installationManager: string;
  installationManagerId?: string;
  rescheduleReason?: string;
}

export interface InstallationSiteContact {
  contactPerson: string;
  contactNumber: string;
  alternateNumber?: string;
  specialAccessInstructions?: string;
}

// ─── Activity Timeline ────────────────────────────────────────

export type InstallationActivityType =
  | 'created'
  | 'materials_checked'
  | 'materials_issued'
  | 'scheduled'
  | 'rescheduled'
  | 'work_started'
  | 'work_paused'
  | 'work_resumed'
  | 'checklist_updated'
  | 'photo_uploaded'
  | 'issue_reported'
  | 'work_completed'
  | 'completion_submitted'
  | 'verified'
  | 'cancelled';

export interface InstallationActivity {
  id: string;
  type: InstallationActivityType;
  description: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

// ─── Main Installation Record ─────────────────────────────────

export interface Installation {
  id: string;
  installationId: string; // e.g. "INS-2026-001"
  title: string;
  type: InstallationType;
  priority: InstallationPriority;
  status: InstallationStatus;
  overallMaterialReadiness: MaterialReadinessStatus;

  // Linked M01 Customer & Site
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  siteId?: string;
  siteAddress: string;
  siteCity: string;
  siteState: string;
  sitePincode?: string;

  // Linked M02 Site Survey
  surveyId: string;
  surveyRef: string; // e.g. "SRV-0001"
  surveyDate?: string;
  surveyorName?: string;
  feasibilityStatus?: string;
  roofType?: string;
  availableRoofAreaSqFt?: number;

  // Linked M03 Solar Configuration & BOM
  configurationId: string;
  configurationRef: string; // e.g. "CFG-0001"
  configurationName: string;
  systemType: SystemType;
  systemCapacity: string; // e.g. "3 kW", "5 kW"
  templateName?: string;
  estimatedTotalCost?: number;

  // Specifics
  specialInstructions?: string;
  siteContact: InstallationSiteContact;
  schedule: InstallationSchedule;
  materials: InstallationMaterial[];
  materialIssueReferences: MaterialIssueReference[];
  activities: InstallationActivity[];

  createdAt: string;
  updatedAt: string;
}

// ─── Filter & Form Interfaces ─────────────────────────────────

export interface InstallationFilters {
  search?: string;
  status?: InstallationStatus | 'all';
  type?: InstallationType | 'all';
  systemType?: string;
  priority?: InstallationPriority | 'all';
  assignedTeam?: string;
  installationManager?: string;
  dateFrom?: string;
  dateTo?: string;
  materialReadiness?: MaterialReadinessStatus | 'all';
}

export interface InstallationFormData {
  title: string;
  type: InstallationType;
  priority: InstallationPriority;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  siteId?: string;
  siteAddress: string;
  siteCity: string;
  siteState: string;
  sitePincode?: string;

  surveyId: string;
  surveyRef: string;
  configurationId: string;
  configurationRef: string;
  configurationName: string;
  systemType: SystemType;
  systemCapacity: string;

  plannedStartDate: string;
  plannedEndDate: string;
  installationManager: string;
  assignedTeam?: string;

  contactPerson: string;
  contactNumber: string;
  specialInstructions?: string;
}

// ─── Status Labels and Colour Mappings ─────────────────────────

export const INSTALLATION_STATUS_LABELS: Record<InstallationStatus, string> = {
  draft: 'Draft',
  awaiting_material: 'Awaiting Material',
  ready_for_scheduling: 'Ready for Scheduling',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  completion_submitted: 'Completion Submitted',
  verified: 'Verified',
  cancelled: 'Cancelled',
};

export const INSTALLATION_STATUS_COLORS: Record<InstallationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  awaiting_material: 'bg-amber-100 text-amber-800 border-amber-200',
  ready_for_scheduling: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  on_hold: 'bg-rose-100 text-rose-800 border-rose-200',
  completed: 'bg-teal-100 text-teal-800 border-teal-200',
  completion_submitted: 'bg-purple-100 text-purple-800 border-purple-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-200 text-gray-700 border-gray-300',
};

export const MATERIAL_READINESS_LABELS: Record<MaterialReadinessStatus, string> = {
  not_checked: 'Not Checked',
  available: 'All Materials Available',
  partially_available: 'Partially Available',
  unavailable: 'Materials Unavailable',
  reserved: 'Materials Reserved',
  issued: 'Materials Issued',
};

export const MATERIAL_READINESS_COLORS: Record<MaterialReadinessStatus, string> = {
  not_checked: 'bg-slate-100 text-slate-600 border-slate-200',
  available: 'bg-green-100 text-green-800 border-green-200',
  partially_available: 'bg-amber-100 text-amber-800 border-amber-200',
  unavailable: 'bg-red-100 text-red-800 border-red-200',
  reserved: 'bg-blue-100 text-blue-800 border-blue-200',
  issued: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

