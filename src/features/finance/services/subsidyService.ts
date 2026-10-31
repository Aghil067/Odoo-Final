/**
 * subsidyService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Solar Subsidy Tracking in Module M09.
 */

import type {
  SubsidyApplication,
  SubsidyFormData,
  SubsidyStatus,
} from '../types/subsidy.types';
import { MOCK_SUBSIDIES } from '../data/mockFinanceData';

let subsidiesStore: SubsidyApplication[] = [...MOCK_SUBSIDIES];

export interface SubsidyFilters {
  search?: string;
  status?: SubsidyStatus | 'all';
  scheme?: string;
}

export const subsidyService = {
  /**
   * List subsidy applications with optional filtering.
   */
  async list(filters?: SubsidyFilters): Promise<{ data: SubsidyApplication[]; total: number }> {
    let result = [...subsidiesStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.subsidyReference.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.installationRef.toLowerCase().includes(q) ||
          (s.consumerNumber && s.consumerNumber.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((s) => s.status === filters.status);
    }

    if (filters.scheme && filters.scheme !== 'all') {
      result = result.filter((s) => s.subsidyScheme.toLowerCase().includes(filters.scheme!.toLowerCase()));
    }

    return { data: result, total: result.length };
  },

  /**
   * Get single subsidy application by ID or reference.
   */
  async getById(id: string): Promise<SubsidyApplication | null> {
    const found = subsidiesStore.find((s) => s.id === id || s.subsidyReference === id);
    return found ? { ...found } : null;
  },

  /**
   * Create new subsidy tracking dossier.
   */
  async create(formData: SubsidyFormData): Promise<SubsidyApplication> {
    const nextNum = subsidiesStore.length + 35;
    const subsidyReference = `SUB-2026-00${nextNum}`;

    const newApplication: SubsidyApplication = {
      id: `sub-${Date.now()}`,
      subsidyReference,
      customerId: formData.customerId,
      customerName: formData.customerName,
      installationId: formData.installationId,
      installationRef: formData.installationRef,
      systemCapacity: formData.systemCapacity,
      applicationDate: formData.applicationDate || new Date().toISOString().split('T')[0],
      subsidyScheme: formData.subsidyScheme,
      discomName: formData.discomName,
      consumerNumber: formData.consumerNumber,
      expectedSubsidyAmount: formData.expectedSubsidyAmount,
      approvedSubsidyAmount: 0,
      status: 'ready_for_submission',
      submittedDocuments: [
        { id: `doc-${Date.now()}-1`, name: 'Aadhaar Card of Property Owner', category: 'id_proof', required: true, status: 'uploaded', fileName: 'owner_aadhaar.pdf', uploadedAt: new Date().toISOString().split('T')[0] },
        { id: `doc-${Date.now()}-2`, name: 'Latest Paid BESCOM Electricity Bill', category: 'electricity_bill', required: true, status: 'uploaded', fileName: 'electricity_bill.pdf', uploadedAt: new Date().toISOString().split('T')[0] },
        { id: `doc-${Date.now()}-3`, name: 'Cancelled Cheque / Bank Mandate', category: 'bank_mandate', required: true, status: 'uploaded', fileName: 'cancelled_cheque.pdf', uploadedAt: new Date().toISOString().split('T')[0] },
        { id: `doc-${Date.now()}-4`, name: 'Joint Commissioning Certificate (JCC)', category: 'commissioning_cert', required: true, status: 'pending' },
        { id: `doc-${Date.now()}-5`, name: 'SunPower Solutions DCR Undertaking', category: 'vendor_undertaking', required: true, status: 'pending' },
      ],
      remarks: formData.remarks,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    subsidiesStore.unshift(newApplication);
    return { ...newApplication };
  },

  /**
   * Update subsidy status.
   */
  async updateStatus(
    id: string,
    newStatus: SubsidyStatus,
    approvedAmount?: number,
    remarks?: string
  ): Promise<SubsidyApplication> {
    const idx = subsidiesStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subsidy application not found');

    const cur = subsidiesStore[idx];
    const updated: SubsidyApplication = {
      ...cur,
      status: newStatus,
      approvedSubsidyAmount: approvedAmount !== undefined ? approvedAmount : cur.approvedSubsidyAmount,
      disbursedAmount: newStatus === 'disbursed' ? (approvedAmount || cur.expectedSubsidyAmount) : cur.disbursedAmount,
      disbursedDate: newStatus === 'disbursed' ? new Date().toISOString().split('T')[0] : cur.disbursedDate,
      remarks: remarks || cur.remarks,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
    };

    subsidiesStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Document upload simulation placeholder.
   */
  async uploadDocument(
    subsidyId: string,
    documentId: string,
    fileName: string
  ): Promise<SubsidyApplication> {
    const idx = subsidiesStore.findIndex((s) => s.id === subsidyId);
    if (idx === -1) throw new Error('Subsidy application not found');

    const cur = subsidiesStore[idx];
    const docs = cur.submittedDocuments.map((doc) =>
      doc.id === documentId
        ? {
            ...doc,
            status: 'uploaded' as const,
            fileName,
            uploadedAt: new Date().toISOString().split('T')[0],
          }
        : doc
    );

    const updated: SubsidyApplication = {
      ...cur,
      submittedDocuments: docs,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
    };

    subsidiesStore[idx] = updated;
    return { ...updated };
  },
};

