/**
 * invoice.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types and labels for Customer Invoices in Module M09.
 */

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  hsnSacCode?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0042"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGst?: string;

  installationId?: string;
  installationRef?: string;
  systemCapacity?: string;
  systemType?: string;

  invoiceDate: string;
  dueDate: string;

  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number; // e.g. 12 or 18
  taxAmount: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;

  status: InvoiceStatus;
  notes?: string;
  terms?: string;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGst?: string;

  installationId?: string;
  installationRef?: string;
  systemCapacity?: string;
  systemType?: string;

  invoiceDate: string;
  dueDate: string;

  items: Omit<InvoiceLineItem, 'id' | 'amount'>[];
  taxRate: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;

  notes?: string;
  terms?: string;
  saveAsDraft?: boolean;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<
  InvoiceStatus,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  issued: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  partially_paid: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
};

