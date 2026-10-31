/**
 * customerService.ts
 * ─────────────────────────────────────────────────────────────
 * Customer API service.
 * Currently backed by mock data. Swap to apiClient when backend is ready.
 *
 * HOW TO SWITCH TO REAL API:
 *  Replace the mock implementations with apiClient.get/post/put calls.
 *  The service interface and return shapes stay the same — no UI changes needed.
 */

import type {
  Customer, CustomerSummary, CustomerFormData,
  CustomerFilters, CustomerActivity,
} from '../types/customer.types';
import { MOCK_CUSTOMERS, getMockCustomerActivity } from '../data/mockData';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _store = [...MOCK_CUSTOMERS]; // mutable in-memory store
let _nextId = _store.length + 1;

function toSummary(c: Customer): CustomerSummary {
  return {
    id: c.id, customerId: c.customerId, fullName: c.fullName, phone: c.phone,
    email: c.email, customerType: c.customerType, city: c.city,
    numberOfSites: c.numberOfSites, status: c.status, createdAt: c.createdAt,
  };
}

export const customerService = {
  /** GET /api/customers */
  async list(filters: CustomerFilters = {}): Promise<{ data: CustomerSummary[]; total: number }> {
    await delay();
    let results = _store.map(toSummary);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (c) => c.fullName.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.customerType) results = results.filter((c) => c.customerType === filters.customerType);
    if (filters.city) results = results.filter((c) => (c.city ?? '').toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters.status) results = results.filter((c) => c.status === filters.status);

    const sortBy = (filters.sortBy as keyof CustomerSummary) ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';
    results.sort((a, b) => {
      const va = String(a[sortBy] ?? '');
      const vb = String(b[sortBy] ?? '');
      return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const total = results.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: results.slice(start, start + pageSize), total };
  },

  /** GET /api/customers/:id */
  async getById(id: string): Promise<Customer | null> {
    await delay();
    return _store.find((c) => c.id === id) ?? null;
  },

  /** POST /api/customers */
  async create(data: CustomerFormData): Promise<Customer> {
    await delay(600);
    const id = `cust-${String(_nextId).padStart(3, '0')}`;
    const customerId = `CUST-${String(_nextId).padStart(4, '0')}`;
    _nextId++;
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id, customerId,
      status: data.status ?? 'prospect',
      numberOfSites: 0,
      createdAt: now, updatedAt: now,
    };
    _store = [..._store, customer];
    return customer;
  },

  /** PUT /api/customers/:id */
  async update(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
    await delay(600);
    const idx = _store.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found.');
    const updated: Customer = { ..._store[idx], ...data, updatedAt: new Date().toISOString() };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  /** GET /api/customers/:id/activity */
  async getActivity(customerId: string): Promise<CustomerActivity[]> {
    await delay(300);
    return getMockCustomerActivity(customerId);
  },

  /** Utility: get all cities for filter dropdown */
  async getCities(): Promise<string[]> {
    await delay(200);
    return [...new Set(_store.map((c) => c.city).filter(Boolean) as string[])].sort();
  },
};

