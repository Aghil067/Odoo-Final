/**
 * warrantyClaim.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Warranty Claims & Resolution in M07.
 */

export type ClaimStatus =
  | 'submitted'
  | 'under_review'
  | 'eligible'
  | 'ineligible'
  | 'approved'
  | 'rejected'
  | 'repair_in_progress'
  | 'replacement_in_progress'
  | 'resolved'
  | 'closed';

export type ClaimPriority = 'low' | 'medium' | 'high' | 'critical';

export type ClaimIssueCategory =
  | 'inverter_failure'
  | 'battery_failure'
  | 'solar_panel_damage'
  | 'charge_controller_failure'
  | 'electrical_issue'
  | 'performance_issue'
  | 'other';

export type EligibilityOutcome = 'eligible' | 'ineligible' | 'requires_further_review';

export interface ClaimEligibilityChecklist {
  warrantyRecordExists: boolean;
  warrantyIsActive: boolean;
  serialNumberMatches: boolean;
  claimFallsWithinCoveragePeriod: boolean;
  productMatchesWarranty: boolean;
  requiredEvidenceAvailable: boolean;
}

export type ResolutionType = 'repair' | 'replacement' | 'manufacturer_referral' | 'other_resolution';

export interface WarrantyClaimResolution {
  resolutionType: ResolutionType;
  resolutionDate: string;
  resolutionDescription: string;
  repairedProductName?: string;
  replacementProductId?: string;
  replacementProductName?: string;
  replacementSerialNumber?: string; // Must come from M04 inventory
  technicianOrServiceRef?: string; // Prepares navigation to M08
  customerConfirmed: boolean;
  customerConfirmationDate?: string;
  supportingPhotographs?: string[];
  resolvedBy: string;
}

export interface WarrantyClaim {
  id: string;
  claimId: string; // e.g. "CLM-2026-001"

  // Linked Customer (M01)
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Linked Warranty & Equipment (M07 & M04)
  warrantyId: string; // internal id
  warrantyRef: string; // e.g. "WAR-2026-001"
  productId: string;
  productName: string;
  serialNumber?: string;
  installationRef?: string;

  // Issue details
  claimDate: string;
  issueCategory: ClaimIssueCategory;
  issueTitle: string;
  detailedDescription: string;
  priority: ClaimPriority;
  failureSymptoms?: string;
  equipmentCondition?: string;
  errorCode?: string;

  // Supporting evidence
  supportingPhotos: string[];
  documents?: { name: string; url: string; size: string }[];
  remarks?: string;

  // Workflow
  status: ClaimStatus;
  assignedReviewerId?: string;
  assignedReviewerName?: string;

  eligibility: {
    checklist: ClaimEligibilityChecklist;
    outcome: EligibilityOutcome;
    checkedAt?: string;
    checkedBy?: string;
    notes?: string;
  };

  reviewDecision?: {
    decision: 'approved' | 'rejected' | 'ineligible' | 'info_requested';
    reviewerId: string;
    reviewerName: string;
    decisionDate: string;
    reasonOrRemarks: string;
  };

  resolution?: WarrantyClaimResolution;

  createdAt: string;
  updatedAt: string;
}

export interface WarrantyClaimFormData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  warrantyId: string;
  warrantyRef: string;
  productId: string;
  productName: string;
  serialNumber?: string;
  installationRef?: string;

  issueCategory: ClaimIssueCategory;
  issueTitle: string;
  detailedDescription: string;
  issueDate: string;
  priority: ClaimPriority;
  failureSymptoms?: string;
  equipmentCondition?: string;
  errorCode?: string;

  supportingPhotos: string[];
  remarks?: string;
  saveAsDraft?: boolean;
}

export interface WarrantyClaimFilters {
  search?: string;
  status?: ClaimStatus;
  priority?: ClaimPriority;
  issueCategory?: ClaimIssueCategory;
  dateFrom?: string;
  dateTo?: string;
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  eligible: 'Eligible',
  ineligible: 'Ineligible',
  approved: 'Approved',
  rejected: 'Rejected',
  repair_in_progress: 'Repair in Progress',
  replacement_in_progress: 'Replacement in Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const CLAIM_STATUS_COLOURS: Record<
  ClaimStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  submitted: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  under_review: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  eligible: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ineligible: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  approved: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  rejected: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  repair_in_progress: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  replacement_in_progress: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  resolved: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  closed: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
};

export const CLAIM_PRIORITY_LABELS: Record<ClaimPriority, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
  critical: 'Critical Emergency',
};

export const CLAIM_PRIORITY_COLOURS: Record<ClaimPriority, { bg: string; text: string; badge: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-700 border-orange-200' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' },
};

export const ISSUE_CATEGORY_LABELS: Record<ClaimIssueCategory, string> = {
  inverter_failure: 'Inverter Failure / Error Code',
  battery_failure: 'Battery Storage / Degradation Issue',
  solar_panel_damage: 'Solar Panel Physical / Output Damage',
  charge_controller_failure: 'Charge Controller Malfunction',
  electrical_issue: 'Electrical Cabling & Protection Trip',
  performance_issue: 'Generation Underperformance',
  other: 'Other Hardware Issue',
};

export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  repair: 'Component Field / Bench Repair',
  replacement: 'Hardware Replacement (New Serial Unit)',
  manufacturer_referral: 'Manufacturer RMA & Factory Warranty Referral',
  other_resolution: 'Special Resolution / Engineering Fix',
};

