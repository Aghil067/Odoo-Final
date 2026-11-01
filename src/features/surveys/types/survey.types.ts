/**
 * survey.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Site Survey Management (M02).
 */

import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';
import type { PropertyType } from './site.types';

// ─── Survey Statuses ──────────────────────────────────────────

export type SurveyStatus =
  | 'requested'
  | 'draft'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reinspection_required'
  | 'cancelled';

export type ApprovalStatus = 'not_submitted' | 'pending_approval' | 'approved' | 'rejected';

export type SurveyPriority = 'low' | 'medium' | 'high' | 'unspecified';

// ─── Technical Survey Execution Types ─────────────────────────

export type RoofType = 'rcc_concrete' | 'metal_sheet' | 'tiled_roof' | 'other';
export type RoofCondition = 'good' | 'average' | 'poor';
export type RoofSlope = 'flat' | 'slightly_sloped' | 'steep';
export type ShadingCondition = 'no_shade' | 'partial_shade' | 'heavy_shade';

export interface RoofInformation {
  roofType: RoofType;
  customRoofType?: string;
  roofCondition: RoofCondition;
  availableAreaSqFt: number;
  roofLengthFt?: number;
  roofWidthFt?: number;
  numberOfFloors: number;
  roofOrientation: string; // e.g. "South-Facing", "East-West"
  roofSlope: RoofSlope;
  shadingCondition: ShadingCondition;
  nearbyObstacles?: string;
  roofAccessAvailable: boolean;
  structuralConcerns?: string;
}

export interface ElectricalInformation {
  existingElectricityConnection: boolean;
  connectionType: 'single_phase' | 'three_phase';
  meterAvailable: boolean;
  sanctionedLoadKw?: number;
  mainDistributionBoardCondition: 'good' | 'fair' | 'requires_upgrade';
  earthingAvailable: boolean;
  existingInverter: boolean;
  existingSolarInstallation: boolean;
  electricalObservations?: string;
}

export type FeasibilityStatus =
  | 'feasible'
  | 'feasible_with_modifications'
  | 'not_feasible'
  | 'requires_further_inspection';

export interface FeasibilityAssessment {
  roofSuitability: boolean;
  structuralSuitability: boolean;
  electricalSuitability: boolean;
  shadingSuitability: boolean;
  installationAccessibility: boolean;
  estimatedUsableAreaSqFt: number;
  recommendedCapacityKw: number;
  feasibilityStatus: FeasibilityStatus;
  surveyorObservations?: string;
}

export type PhotoCategory =
  | 'full_roof_view'
  | 'roof_surface'
  | 'electrical_meter'
  | 'distribution_board'
  | 'earthing'
  | 'shading_obstacles'
  | 'other';

export interface SurveyPhoto {
  id: string;
  category: PhotoCategory;
  url: string; // Base64 or mock URL
  fileName: string;
  fileSizeBytes: number;
  description?: string;
  uploadedAt: string;
}

export interface CustomerConfirmation {
  representativeName: string;
  confirmed: boolean;
  signatureCaptured: boolean; // boolean flag for UI placeholder
  completionDate: string;
  completionTime: string;
}

export interface SurveyApproval {
  approvalStatus: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  reinspectionInstructions?: string;
}

export interface SurveyActivity {
  id: string;
  type:
    | 'survey_created'
    | 'survey_scheduled'
    | 'survey_assigned'
    | 'survey_started'
    | 'survey_submitted'
    | 'survey_approved'
    | 'survey_rejected'
    | 'reinspection_requested';
  description: string;
  performedBy: string;
  timestamp: string;
}

// ─── Main Survey Entity ───────────────────────────────────────

export interface Survey {
  id: string;
  surveyId: string; // e.g. "SRV-0001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  enquiryId?: string; // Optional link to M01 Enquiry
  siteId: string;
  siteName: string;
  siteLocation: string; // City or summary address
  propertyType: PropertyType | null;

  // Scheduling
  scheduledDate: string;
  preferredTime: string;
  assignedSurveyorId: string;
  assignedSurveyorName: string;
  priority: SurveyPriority;
  instructions?: string;

  // Solar requirements (from request)
  systemType: SystemType;
  requestedCapacity: CapacityOption;
  customRequestedCapacity?: string;
  estimatedMonthlyBill?: number;
  customerRequirements?: string;

  // Findings (filled during execution)
  roofInfo?: RoofInformation;
  electricalInfo?: ElectricalInformation;
  feasibility?: FeasibilityAssessment;
  photos: SurveyPhoto[];
  customerConfirmation?: CustomerConfirmation;

  // Status & Approval
  status: SurveyStatus;
  approval: SurveyApproval;

  createdAt: string;
  updatedAt: string;
}

// ─── Form Data Payloads ───────────────────────────────────────

export interface CreateSurveyRequestData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  enquiryId?: string;
  siteId: string;
  siteName: string;
  siteLocation: string;
  propertyType: PropertyType | null;
  scheduledDate: string;
  preferredTime: string;
  assignedSurveyorId: string;
  assignedSurveyorName: string;
  priority: SurveyPriority;
  instructions?: string;
  systemType: SystemType;
  requestedCapacity: CapacityOption;
  customRequestedCapacity?: string;
  estimatedMonthlyBill?: number;
  customerRequirements?: string;
  saveAsDraft?: boolean;
}

export interface SurveyExecutionData {
  roofInfo: RoofInformation;
  electricalInfo: ElectricalInformation;
  feasibility: FeasibilityAssessment;
  photos: SurveyPhoto[];
  customerConfirmation: CustomerConfirmation;
  submitForApproval?: boolean;
}

export interface SurveyFilters {
  customerId?: string;
  search?: string;
  status?: SurveyStatus | '';
  approvalStatus?: ApprovalStatus | '';
  surveyorId?: string;
  systemType?: SystemType | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── Display Helper Labels & Badges ───────────────────────────

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  requested: 'Requested',
  draft: 'Draft',
  scheduled: 'Scheduled',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  reinspection_required: 'Reinspection Req.',
  cancelled: 'Cancelled',
};

export const SURVEY_STATUS_COLOURS: Record<SurveyStatus, string> = {
  requested: 'bg-slate-100 text-slate-700',
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-amber-100 text-amber-800',
  submitted: 'bg-violet-100 text-violet-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reinspection_required: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-slate-200 text-slate-600',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  not_submitted: 'Not Submitted for Review',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPROVAL_STATUS_COLOURS: Record<ApprovalStatus, string> = {
  not_submitted: 'bg-slate-100 text-slate-700',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export const FEASIBILITY_STATUS_LABELS: Record<FeasibilityStatus, string> = {
  feasible: 'Feasible',
  feasible_with_modifications: 'Feasible with Modifications',
  not_feasible: 'Not Feasible',
  requires_further_inspection: 'Requires Further Inspection',
};

export const FEASIBILITY_STATUS_COLOURS: Record<FeasibilityStatus, string> = {
  feasible: 'bg-green-100 text-green-800',
  feasible_with_modifications: 'bg-amber-100 text-amber-800',
  not_feasible: 'bg-red-100 text-red-800',
  requires_further_inspection: 'bg-violet-100 text-violet-800',
};

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  full_roof_view: 'Full Roof View',
  roof_surface: 'Roof Surface',
  electrical_meter: 'Electrical Meter',
  distribution_board: 'Distribution Board',
  earthing: 'Earthing Connection',
  shading_obstacles: 'Shading / Obstacles',
  other: 'Other / Structural',
};

