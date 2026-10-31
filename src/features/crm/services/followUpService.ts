/**
 * followUpService.ts – Follow-up API service (mock-backed).
 */

import type {
  FollowUp, FollowUpFormData, FollowUpFilters,
  CompleteFollowUpData, RescheduleFollowUpData,
} from '../types/followUp.types';
import { MOCK_FOLLOW_UPS } from '../data/mockData';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _store = [...MOCK_FOLLOW_UPS];
let _nextId = _store.length + 1;

function isOverdue(fu: FollowUp): boolean {
  if (fu.status !== 'pending') return false;
  const today = new Date().toISOString().split('T')[0];
  return fu.followUpDate < today;
}

function isToday(fu: FollowUp): boolean {
  const today = new Date().toISOString().split('T')[0];
  return fu.followUpDate === today && fu.status === 'pending';
}

export const followUpService = {
  async list(filters: FollowUpFilters = {}): Promise<{ data: FollowUp[]; total: number }> {
    await delay();
    let results = [..._store];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (f) => f.customerName.toLowerCase().includes(q) || (f.enquiryRef ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.status) results = results.filter((f) => f.status === filters.status);
    if (filters.type) results = results.filter((f) => f.type === filters.type);
    if (filters.assignedTo) results = results.filter((f) => f.assignedToName.toLowerCase().includes(filters.assignedTo!.toLowerCase()));
    if (filters.dateFilter === 'today') results = results.filter(isToday);
    if (filters.dateFilter === 'overdue') results = results.filter(isOverdue);
    if (filters.dateFilter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      results = results.filter((f) => f.followUpDate > today && f.status === 'pending');
    }

    results.sort((a, b) => {
      const da = `${a.followUpDate}T${a.followUpTime}`;
      const db = `${b.followUpDate}T${b.followUpTime}`;
      return da.localeCompare(db);
    });

    const total = results.length;
    const page = filters.page ?? 1;
    const size = filters.pageSize ?? 10;
    return { data: results.slice((page - 1) * size, (page - 1) * size + size), total };
  },

  async getByCustomerId(customerId: string): Promise<FollowUp[]> {
    await delay(300);
    return _store.filter((f) => f.customerId === customerId);
  },

  async create(data: FollowUpFormData): Promise<FollowUp> {
    await delay(600);
    const id = `fu-${String(_nextId).padStart(3, '0')}`;
    const followUpId = `FU-${String(_nextId).padStart(4, '0')}`;
    _nextId++;
    const now = new Date().toISOString();
    const fu: FollowUp = {
      ...data, id, followUpId,
      assignedToName: data.assignedTo === 'user-sales-01' ? 'Sam Sales' : data.assignedTo,
      customerName: '',           // resolved in component from customer list
      status: 'pending', createdAt: now, updatedAt: now,
    };
    _store = [..._store, fu];
    return fu;
  },

  async update(id: string, data: Partial<FollowUpFormData>): Promise<FollowUp> {
    await delay(600);
    const idx = _store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Follow-up not found.');
    const updated: FollowUp = { ..._store[idx], ...data, updatedAt: new Date().toISOString() };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  async complete(id: string, data: CompleteFollowUpData): Promise<FollowUp> {
    await delay(400);
    const idx = _store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Follow-up not found.');
    const updated: FollowUp = {
      ..._store[idx], status: 'completed',
      outcomeNote: data.outcomeNote, updatedAt: new Date().toISOString(),
    };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  async reschedule(id: string, data: RescheduleFollowUpData): Promise<FollowUp> {
    await delay(400);
    const idx = _store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Follow-up not found.');
    const updated: FollowUp = {
      ..._store[idx], ...data, status: 'rescheduled', updatedAt: new Date().toISOString(),
    };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  async cancel(id: string): Promise<FollowUp> {
    await delay(400);
    const idx = _store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Follow-up not found.');
    const updated: FollowUp = { ..._store[idx], status: 'cancelled', updatedAt: new Date().toISOString() };
    _store = [..._store.slice(0, idx), updated, ..._store.slice(idx + 1)];
    return updated;
  },

  async getDashboardStats() {
    await delay(200);
    const today = new Date().toISOString().split('T')[0];
    return {
      total: _store.length,
      pending: _store.filter((f) => f.status === 'pending').length,
      overdue: _store.filter(isOverdue).length,
      dueToday: _store.filter(isToday).length,
      upcoming: _store.filter((f) => f.followUpDate > today && f.status === 'pending').length,
    };
  },
};

