/**
 * execution.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for On-site Installation Execution,
 * Checklist, Time Tracking, Photographs, Issues, and Customer Sign-off.
 */

// ─── Checklist ────────────────────────────────────────────────

export type ChecklistCategory =
  | 'preparation'
  | 'mounting'
  | 'solar_panels'
  | 'inverter'
  | 'battery'
  | 'electrical'
  | 'testing'
  | 'handover';

export type ChecklistItemStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable';

export interface ExecutionChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description?: string;
  status: ChecklistItemStatus;
  completedAt?: string;
  completedBy?: string;
  remarks?: string;
  required: boolean;
}

// ─── Time Tracking ────────────────────────────────────────────

export interface InstallationTimeRecord {
  id: string;
  workStartDate: string;
  workStartTime: string;
  workEndDate?: string;
  workEndTime?: string;
  durationMinutes?: number;
  technicianName: string;
  technicianRole?: string;
  remarks?: string;
}

// ─── Photographs ──────────────────────────────────────────────

export type PhotoCategory =
  | 'before_installation'
  | 'mounting_structure'
  | 'solar_panels'
  | 'inverter'
  | 'battery'
  | 'electrical_connections'
  | 'earthing'
  | 'completed_installation'
  | 'other';

export interface InstallationPhoto {
  id: string;
  category: PhotoCategory;
  title?: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: string;
}

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before_installation: 'Before Installation (Site Prep)',
  mounting_structure: 'Mounting Structure & Rails',
  solar_panels: 'Solar PV Panels Array',
  inverter: 'Inverter & Isolation Box',
  battery: 'Battery Storage (LiFePO4/Lead-Acid)',
  electrical_connections: 'AC/DC Distribution & Wiring',
  earthing: 'Earthing & Lightning Arrestor',
  completed_installation: 'Completed Installation View',
  other: 'Other / Site Observation',
};

// ─── Issues & Observations ────────────────────────────────────

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface InstallationIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  actionTaken?: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
  remarks?: string;
}

// ─── Completion & Customer Sign-off ───────────────────────────

export type TestingResult = 'passed' | 'failed' | 'requires_inspection';

export interface InstallationCompletion {
  actualCompletionDate: string;
  workCompletionRemarks: string;
  testingResult: TestingResult;
  gridSyncVerified: boolean;
  vocMeasuredVolts?: number;
  iscMeasuredAmps?: number;
  inverterGenerationKw?: number;
  customerName: string;
  customerConfirmation: boolean;
  customerSignatureData?: string; // Data URL placeholder or svg string
  customerFeedbackRemarks?: string;
  submittedBy: string;
  submittedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewRemarks?: string;
}

export interface InstallationExecutionData {
  installationId: string;
  checklists: ExecutionChecklistItem[];
  timeRecords: InstallationTimeRecord[];
  photos: InstallationPhoto[];
  issues: InstallationIssue[];
  completion?: InstallationCompletion;
}

