/**
 * paymentService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Customer Payments & Receipts in Module M09.
 */

import type { CustomerPayment, PaymentFormData } from '../types/payment.types';
import { MOCK_PAYMENTS } from '../data/mockFinanceData';
import { invoiceService } from './invoiceService';

let paymentsStore: CustomerPayment[] = [...MOCK_PAYMENTS];

export interface PaymentFilters {
  search?: string;
  customerId?: string;
  invoiceId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentService = {
  /**
   * List customer payments with optional filtering.
   */
  async list(filters?: PaymentFilters): Promise<{ data: CustomerPayment[]; total: number }> {
    let result = [...paymentsStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.receiptNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.transactionReference.toLowerCase().includes(q)
      );
    }

    if (filters.customerId) {
      result = result.filter((p) => p.customerId === filters.customerId);
    }

    if (filters.invoiceId) {
      result = result.filter((p) => p.invoiceId === filters.invoiceId);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      result = result.filter((p) => p.paymentMethod === filters.paymentMethod);
    }

    if (filters.startDate) {
      result = result.filter((p) => p.paymentDate >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter((p) => p.paymentDate <= filters.endDate!);
    }

    return { data: result, total: result.length };
  },

  /**
   * Get single payment by ID.
   */
  async getById(id: string): Promise<CustomerPayment | null> {
    const found = paymentsStore.find((p) => p.id === id || p.receiptNumber === id);
    return found ? { ...found } : null;
  },

  /**
   * Record a new customer payment.
   * Automatically updates corresponding invoice's balance & status.
   */
  async recordPayment(formData: PaymentFormData): Promise<CustomerPayment> {
    const invoice = await invoiceService.getById(formData.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (formData.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (formData.amount > invoice.remainingBalance) {
      throw new Error(
        `Payment amount (₹${formData.amount.toLocaleString('en-IN')}) exceeds invoice remaining balance (₹${invoice.remainingBalance.toLocaleString('en-IN')})`
      );
    }

    const nextRecNum = paymentsStore.length + 115;
    const receiptNumber = `REC-2026-0${nextRecNum}`;

    const prevPaid = invoice.amountPaid;
    const remainingAfter = invoice.remainingBalance - formData.amount;

    // Apply to invoice
    invoiceService.applyPayment(invoice.id, formData.amount);

    const newPayment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      installationId: invoice.installationId,
      installationRef: invoice.installationRef,
      paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0],
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      transactionReference: formData.transactionReference,
      bankName: formData.bankName,
      notes: formData.notes,
      recordedBy: 'Finance Officer (SunPower)',
      invoiceTotalAmount: invoice.totalAmount,
      previouslyPaidAmount: prevPaid,
      remainingBalanceAfterPayment: remainingAfter,
      createdAt: new Date().toISOString(),
    };

    paymentsStore.unshift(newPayment);
    return { ...newPayment };
  },
};

