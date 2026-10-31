/**
 * technicianPayment.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Technician Payments in Module M09.
 */

export type TechnicianPaymentType =
  | 'per_installation'
  | 'daily_rate'
  | 'hourly'
  | 'service_call'
  | 'milestone';

export type TechnicianPaymentStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'rejected';

export interface TechnicianPaymentRecord {
  id: string;
  paymentReference: string; // e.g. "TECH-PAY-0089"
  technicianId: string;
  technicianName: string;

  relatedType: 'installation' | 'service';
  installationId?: string;
  installationRef?: string;
  serviceTaskId?: string;
  serviceTaskRef?: string;

  workPeriodStart: string;
  workPeriodEnd: string;
  paymentType: TechnicianPaymentType;

  agreedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  pendingAmount: number;

  status: TechnicianPaymentStatus;
  paymentMethod?: string;
  transactionReference?: string;
  remarks?: string;

  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    notes?: string;
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface TechnicianPaymentFormData {
  technicianId: string;
  relatedType: 'installation' | 'service';
  installationId?: string;
  serviceTaskId?: string;
  workPeriodStart: string;
  workPeriodEnd: string;
  paymentType: TechnicianPaymentType;
  agreedAmount: number;
  remarks?: string;
}

export const TECHNICIAN_PAYMENT_TYPE_LABELS: Record<TechnicianPaymentType, string> = {
  per_installation: 'Per Installation Rate',
  daily_rate: 'Daily Wage Rate',
  hourly: 'Hourly Rate',
  service_call: 'Service Call Fee',
  milestone: 'Milestone Completion Fee',
};

export const TECHNICIAN_PAYMENT_STATUS_LABELS: Record<
  TechnicianPaymentStatus,
  string
> = {
  pending: 'Pending Review',
  submitted: 'Submitted',
  approved: 'Approved',
  partially_paid: 'Partially Paid',
  paid: 'Fully Paid',
  rejected: 'Rejected',
};

export const TECHNICIAN_PAYMENT_STATUS_COLORS: Record<
  TechnicianPaymentStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  partially_paid: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  paid: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

