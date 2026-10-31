/**
 * technicianPaymentService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Technician Payments in Module M09.
 */

import type {
  TechnicianPaymentRecord,
  TechnicianPaymentFormData,
  TechnicianPaymentStatus,
} from '../types/technicianPayment.types';
import { MOCK_TECHNICIAN_PAYMENTS } from '../data/mockFinanceData';

let techPaymentsStore: TechnicianPaymentRecord[] = [...MOCK_TECHNICIAN_PAYMENTS];

export interface TechnicianPaymentFilters {
  search?: string;
  technicianId?: string;
  status?: TechnicianPaymentStatus | 'all';
  relatedType?: 'all' | 'installation' | 'service';
}

export const technicianPaymentService = {
  /**
   * List technician payment records with optional filtering.
   */
  async list(filters?: TechnicianPaymentFilters): Promise<{ data: TechnicianPaymentRecord[]; total: number }> {
    let result = [...techPaymentsStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (tp) =>
          tp.paymentReference.toLowerCase().includes(q) ||
          tp.technicianName.toLowerCase().includes(q) ||
          (tp.installationRef && tp.installationRef.toLowerCase().includes(q)) ||
          (tp.serviceTaskRef && tp.serviceTaskRef.toLowerCase().includes(q))
      );
    }

    if (filters.technicianId) {
      result = result.filter((tp) => tp.technicianId === filters.technicianId);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((tp) => tp.status === filters.status);
    }

    if (filters.relatedType && filters.relatedType !== 'all') {
      result = result.filter((tp) => tp.relatedType === filters.relatedType);
    }

    return { data: result, total: result.length };
  },

  /**
   * Get technician payment by ID.
   */
  async getById(id: string): Promise<TechnicianPaymentRecord | null> {
    const found = techPaymentsStore.find((tp) => tp.id === id || tp.paymentReference === id);
    return found ? { ...found } : null;
  },

  /**
   * Create technician payment voucher.
   */
  async create(formData: TechnicianPaymentFormData, techName: string): Promise<TechnicianPaymentRecord> {
    const nextNum = techPaymentsStore.length + 92;
    const paymentReference = `TECH-PAY-00${nextNum}`;

    const newRecord: TechnicianPaymentRecord = {
      id: `tpay-${Date.now()}`,
      paymentReference,
      technicianId: formData.technicianId,
      technicianName: techName,
      relatedType: formData.relatedType,
      installationId: formData.installationId,
      installationRef: formData.installationId ? 'INS-2026-002' : undefined,
      serviceTaskId: formData.serviceTaskId,
      serviceTaskRef: formData.serviceTaskId ? 'TSK-2026-001' : undefined,
      workPeriodStart: formData.workPeriodStart,
      workPeriodEnd: formData.workPeriodEnd,
      paymentType: formData.paymentType,
      agreedAmount: formData.agreedAmount,
      approvedAmount: formData.agreedAmount,
      paidAmount: 0,
      pendingAmount: formData.agreedAmount,
      status: 'submitted',
      remarks: formData.remarks,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    techPaymentsStore.unshift(newRecord);
    return { ...newRecord };
  },

  /**
   * Approve a technician payment claim.
   */
  async approve(id: string, approvedAmount?: number): Promise<TechnicianPaymentRecord> {
    const idx = techPaymentsStore.findIndex((tp) => tp.id === id);
    if (idx === -1) throw new Error('Technician payment record not found');

    const cur = techPaymentsStore[idx];
    const finalApproved = approvedAmount !== undefined ? approvedAmount : cur.agreedAmount;
    const pending = Math.max(0, finalApproved - cur.paidAmount);

    const updated: TechnicianPaymentRecord = {
      ...cur,
      approvedAmount: finalApproved,
      pendingAmount: pending,
      status: pending === 0 ? 'paid' : cur.paidAmount > 0 ? 'partially_paid' : 'approved',
      updatedAt: new Date().toISOString(),
    };

    techPaymentsStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Record a disbursement to technician.
   */
  async recordDisbursement(
    id: string,
    amount: number,
    method: string,
    reference: string,
    notes?: string
  ): Promise<TechnicianPaymentRecord> {
    const idx = techPaymentsStore.findIndex((tp) => tp.id === id);
    if (idx === -1) throw new Error('Technician payment record not found');

    const cur = techPaymentsStore[idx];
    const newPaid = cur.paidAmount + amount;
    const pending = Math.max(0, cur.approvedAmount - newPaid);

    const histEntry = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      method,
      reference,
      notes,
    };

    const updated: TechnicianPaymentRecord = {
      ...cur,
      paidAmount: newPaid,
      pendingAmount: pending,
      status: pending === 0 ? 'paid' : 'partially_paid',
      paymentMethod: method,
      transactionReference: reference,
      paymentHistory: [...cur.paymentHistory, histEntry],
      updatedAt: new Date().toISOString(),
    };

    techPaymentsStore[idx] = updated;
    return { ...updated };
  },
};

