/**
 * payment.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Customer Payments & Receipts in Module M09.
 */

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'upi'
  | 'cheque'
  | 'other';

export interface CustomerPayment {
  id: string;
  receiptNumber: string; // e.g. "REC-2026-0105"
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  installationId?: string;
  installationRef?: string;

  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string; // UTR, Cheque No, Transaction ID
  bankName?: string;
  notes?: string;
  recordedBy: string;

  // Snapshot of invoice state after payment
  invoiceTotalAmount: number;
  previouslyPaidAmount: number;
  remainingBalanceAfterPayment: number;

  createdAt: string;
}

export interface PaymentFormData {
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  bankName?: string;
  notes?: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer (NEFT/RTGS/IMPS)',
  upi: 'UPI / Digital Payment',
  cheque: 'Cheque / Demand Draft',
  other: 'Other Method',
};

