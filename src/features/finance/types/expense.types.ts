/**
 * expense.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Expense Management in Module M09.
 */

export type ExpenseCategory =
  | 'material'
  | 'labour'
  | 'transportation'
  | 'installation'
  | 'maintenance_and_service'
  | 'office'
  | 'equipment'
  | 'other';

export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface Expense {
  id: string;
  expenseReference: string; // e.g. "EXP-2026-001"
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;

  installationId?: string;
  installationRef?: string;
  serviceTicketId?: string;
  serviceTicketRef?: string;

  vendorOrPayee: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'corporate_card' | 'other';
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
  status: ExpenseStatus;

  submittedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  installationId?: string;
  serviceTicketId?: string;
  vendorOrPayee: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'corporate_card' | 'other';
  receiptFileName?: string;
  notes?: string;
  saveAsDraft?: boolean;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  material: 'Material & BOS',
  labour: 'Direct Labour',
  transportation: 'Transportation & Logistics',
  installation: 'Installation & Tooling',
  maintenance_and_service: 'Maintenance & Service',
  office: 'Office & Admin',
  equipment: 'Machinery & Equipment Rental',
  other: 'Miscellaneous / Other',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
};

export const EXPENSE_STATUS_COLORS: Record<
  ExpenseStatus,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  paid: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

