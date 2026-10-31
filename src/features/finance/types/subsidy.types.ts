/**
 * subsidy.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Solar Subsidy Tracking in Module M09.
 */

export type SubsidyStatus =
  | 'not_started'
  | 'documents_pending'
  | 'ready_for_submission'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export interface SubsidyDocumentItem {
  id: string;
  name: string;
  category: 'id_proof' | 'electricity_bill' | 'bank_mandate' | 'commissioning_cert' | 'vendor_undertaking' | 'other';
  required: boolean;
  status: 'uploaded' | 'pending' | 'verified';
  fileName?: string;
  uploadedAt?: string;
}

export interface SubsidyApplication {
  id: string;
  subsidyReference: string; // e.g. "SUB-2026-0031"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;

  installationId: string;
  installationRef: string;
  systemCapacity: string;

  applicationDate: string;
  subsidyScheme: string; // e.g. "PM Surya Ghar Muft Bijli Yojana"
  discomName?: string; // e.g. "BESCOM Bengaluru"
  consumerNumber?: string; // DISCOM Account / Consumer ID

  expectedSubsidyAmount: number;
  approvedSubsidyAmount: number;
  disbursedAmount?: number;
  disbursedDate?: string;

  status: SubsidyStatus;
  submittedDocuments: SubsidyDocumentItem[];

  remarks?: string;
  lastUpdatedDate: string;
  createdAt: string;
}

export interface SubsidyFormData {
  customerId: string;
  customerName: string;
  installationId: string;
  installationRef: string;
  systemCapacity: string;
  applicationDate: string;
  subsidyScheme: string;
  discomName?: string;
  consumerNumber?: string;
  expectedSubsidyAmount: number;
  remarks?: string;
}

export const SUBSIDY_STATUS_LABELS: Record<SubsidyStatus, string> = {
  not_started: 'Not Started',
  documents_pending: 'Documents Pending',
  ready_for_submission: 'Ready for Submission',
  submitted: 'Submitted to Portal',
  under_review: 'DISCOM / Agency Review',
  approved: 'Subsidy Approved',
  rejected: 'Application Rejected',
  disbursed: 'Subsidy Disbursed',
};

export const SUBSIDY_STATUS_COLORS: Record<
  SubsidyStatus,
  { bg: string; text: string; border: string }
> = {
  not_started: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  documents_pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ready_for_submission: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  under_review: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  disbursed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
};

