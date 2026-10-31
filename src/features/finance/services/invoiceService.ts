/**
 * invoiceService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Customer Invoices in Module M09.
 */

import type {
  Invoice,
  InvoiceFormData,
  InvoiceStatus,
} from '../types/invoice.types';
import { MOCK_INVOICES } from '../data/mockFinanceData';

let invoicesStore: Invoice[] = [...MOCK_INVOICES];

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | 'all';
  customerId?: string;
  installationId?: string;
  startDate?: string;
  endDate?: string;
}

export const invoiceService = {
  /**
   * List all invoices with optional filtering.
   */
  async list(filters?: InvoiceFilters): Promise<{ data: Invoice[]; total: number }> {
    let result = [...invoicesStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.installationRef && inv.installationRef.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((inv) => inv.status === filters.status);
    }

    if (filters.customerId) {
      result = result.filter((inv) => inv.customerId === filters.customerId);
    }

    if (filters.installationId) {
      result = result.filter((inv) => inv.installationId === filters.installationId);
    }

    if (filters.startDate) {
      result = result.filter((inv) => inv.invoiceDate >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter((inv) => inv.invoiceDate <= filters.endDate!);
    }

    return { data: result, total: result.length };
  },

  /**
   * Get single invoice by ID.
   */
  async getById(id: string): Promise<Invoice | null> {
    const found = invoicesStore.find((inv) => inv.id === id || inv.invoiceNumber === id);
    return found ? { ...found } : null;
  },

  /**
   * Create a new customer invoice.
   */
  async create(formData: InvoiceFormData): Promise<Invoice> {
    const nextNum = invoicesStore.length + 43;
    const invoiceNumber = `INV-2026-00${nextNum}`;

    const items = formData.items.map((item, idx) => ({
      ...item,
      id: `li-${Date.now()}-${idx}`,
      amount: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.round((subtotal * (formData.taxRate || 0)) / 100);

    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (formData.discountValue || 0)) / 100);
    } else if (formData.discountType === 'fixed') {
      discountAmount = formData.discountValue || 0;
    }

    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      customerGst: formData.customerGst,
      installationId: formData.installationId,
      installationRef: formData.installationRef,
      systemCapacity: formData.systemCapacity,
      systemType: formData.systemType,
      invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      items,
      subtotal,
      taxRate: formData.taxRate,
      taxAmount,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      remainingBalance: totalAmount,
      status: formData.saveAsDraft ? 'draft' : 'issued',
      notes: formData.notes,
      terms: formData.terms || 'Payment due within 15 days of invoice date. 5-year solar workmanship warranty included.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoicesStore.unshift(newInvoice);
    return { ...newInvoice };
  },

  /**
   * Update an existing draft or issued invoice.
   */
  async update(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const idx = invoicesStore.findIndex((inv) => inv.id === id);
    if (idx === -1) throw new Error('Invoice not found');

    const updated = {
      ...invoicesStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    invoicesStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Update an existing invoice from form data.
   */
  async updateFromForm(id: string, formData: InvoiceFormData): Promise<Invoice> {
    const idx = invoicesStore.findIndex((inv) => inv.id === id);
    if (idx === -1) throw new Error('Invoice not found');

    const cur = invoicesStore[idx];

    const items = formData.items.map((item, index) => ({
      ...item,
      id: `li-${Date.now()}-${index}`,
      amount: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.round((subtotal * (formData.taxRate || 0)) / 100);

    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (formData.discountValue || 0)) / 100);
    } else if (formData.discountType === 'fixed') {
      discountAmount = formData.discountValue || 0;
    }

    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    const remainingBalance = Math.max(0, totalAmount - cur.amountPaid);

    let newStatus = formData.saveAsDraft ? ('draft' as const) : cur.status === 'draft' ? ('issued' as const) : cur.status;
    if (remainingBalance === 0 && totalAmount > 0) newStatus = 'paid';

    const updated: Invoice = {
      ...cur,
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      customerGst: formData.customerGst,
      installationId: formData.installationId,
      installationRef: formData.installationRef,
      systemCapacity: formData.systemCapacity,
      systemType: formData.systemType,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      items,
      subtotal,
      taxRate: formData.taxRate,
      taxAmount,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      discountAmount,
      totalAmount,
      remainingBalance,
      status: newStatus,
      notes: formData.notes,
      terms: formData.terms,
      updatedAt: new Date().toISOString(),
    };

    invoicesStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Internal helper: apply payment amount to invoice and recalculate balance/status.
   */
  applyPayment(invoiceId: string, paymentAmount: number): Invoice {
    const idx = invoicesStore.findIndex((inv) => inv.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found for payment allocation');

    const current = invoicesStore[idx];
    const newPaid = current.amountPaid + paymentAmount;
    const remaining = Math.max(0, current.totalAmount - newPaid);

    let newStatus: InvoiceStatus = current.status;
    if (remaining === 0) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partially_paid';
    }

    const updated: Invoice = {
      ...current,
      amountPaid: newPaid,
      remainingBalance: remaining,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    invoicesStore[idx] = updated;
    return { ...updated };
  },
};
