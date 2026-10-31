/**
 * enquiryService.ts – Enquiry API service (mock-backed).
 * Swap internals to apiClient calls when backend is ready.
 */

import type {
  Enquiry, EnquirySummary, EnquiryFormData,
  EnquiryFilters, UpdateEnquiryStatusData,
} from '../types/enquiry.types';
import { MOCK_ENQUIRIES } from '../data/mockData';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _store = [...MOCK_ENQUIRIES];
let _nextId = _store.length + 1;

function toSummary(e: Enquiry): EnquirySummary {
  return {
    id: e.id, enquiryId: e.enquiryId, customerId: e.customerId,
    customerName: e.customerName, customerPhone: e.customerPhone,
    enquiryDate: e.enquiryDate, systemType: e.systemType,
    capacityOption: e.capacityOption, installationLocation: e.installationLocation,
    leadSource: e.leadSource, assignedToName: e.assignedToName,
    status: e.status, nextFollowUpDate: e.nextFollowUpDate,
    priority: e.priority, createdAt: e.createdAt,
  };
}

export const enquiryService = {
  async list(filters: EnquiryFilters = {}): Promise<{ data: EnquirySummary[]; total: number }> {
    await delay();
    let results = _store.map(toSummary);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (e) => e.customerName.toLowerCase().includes(q) ||
          e.enquiryId.toLowerCase().includes(q) ||
          e.customerPhone.includes(q)
      );
    }
    if (filters.status) results = results.filter((e) => e.status === filters.status);
    if (filters.systemType) results = results.filter((e) => e.systemType === filters.systemType);
    if (filters.assignedTo) results = results.filter((e) => e.assignedToName.toLowerCase().includes(filters.assignedTo!.toLowerCase()));
    if (filters.dateFrom) results = results.filter((e) => e.enquiryDate >= filters.dateFrom!);
    if (filters.dateTo) results = results.filter((e) => e.enquiryDate <= filters.dateTo!);

    const sortBy = (filters.sortBy as keyof EnquirySummary) ?? 'createdAt';
    const order = filters.sortOrder ?? 'desc';
    results.sort((a, b) => {
      const va = String(a[sortBy] ?? ''); const vb = String(b[sortBy] ?? '');
      return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const total = results.length;
    const page = filters.page ?? 1;
    const size = filters.pageSize ?? 10;
    const start = (page - 1) * size;
    return { data: results.slice(start, start + size), total };
  },

  async getById(id: string): Promise<Enquiry | null> {
    await delay();
    return _store.find((e) => e.id === id) ?? null;
  },

  async getByCustomerId(customerId: string): Promise<EnquirySummary[]> {
    await delay(300);
    return _store.filter((e) => e.customerId === customerId).map(toSummary);
  },

  async create(data: EnquiryFormData): Promise<Enquiry> {
    await delay(600);
    const id = `enq-${String(_nextId).padStart(3, '0')}`;
    const enquiryId = `ENQ-${String(_nextId).padStart(4, '0')}`;
    _nextId++;
    const now = new Date().toISOString();
    const enquiry: Enquiry = {
      ...data,
      id, enquiryId,
      customerId: data.customerId ?? `cust-temp-${id}`,
      assignedToName: data.assignedTo === 'user-sales-01' ? 'Sam Sales' : data.assignedTo,
      status: data.status ?? 'new',
      createdAt: now, updatedAt: now,
    };
    _store = [..._store, enquiry];
    return enquiry;
  },

  async update(id: string, data: Partial<EnquiryFormData>): Promise<Enquiry> {
    await delay(600);
    const idx = _store.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found.');
    const updated: Enquiry = { ..._store[idx], ...data, updatedAt: new Date().toISOString() };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  async updateStatus(id: string, payload: UpdateEnquiryStatusData): Promise<Enquiry> {
    await delay(400);
    const idx = _store.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found.');
    const updated: Enquiry = { ..._store[idx], ...payload, updatedAt: new Date().toISOString() };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  /** Summary counts for dashboard */
  async getDashboardStats() {
    await delay(300);
    const all = _store;
    return {
      total: all.length,
      newCount: all.filter((e) => e.status === 'new').length,
      qualified: all.filter((e) => e.status === 'qualified').length,
      won: all.filter((e) => e.status === 'won').length,
      lost: all.filter((e) => e.status === 'lost').length,
      byStatus: Object.fromEntries(
        ['new','contacted','qualified','site_survey_pending','survey_completed','quotation_sent','won','lost']
          .map((s) => [s, all.filter((e) => e.status === s).length])
      ),
    };
  },
};

