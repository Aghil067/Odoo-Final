/**
 * warrantyPolicyService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Warranty Policies in M07.
 */

import type {
  WarrantyPolicy,
  WarrantyPolicyFormData,
  WarrantyPolicyFilters,
  PolicyStatus,
} from '../types/warrantyPolicy.types';
import { MOCK_WARRANTY_POLICIES } from '../data/mockWarrantyData';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _policiesStore: WarrantyPolicy[] = [...MOCK_WARRANTY_POLICIES];

export const warrantyPolicyService = {
  async list(filters: WarrantyPolicyFilters = {}): Promise<{
    data: WarrantyPolicy[];
    total: number;
  }> {
    await delay();
    let results = [..._policiesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.policyId.toLowerCase().includes(q) ||
          p.policyCode.toLowerCase().includes(q) ||
          p.policyName.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
      );
    }

    if (filters.productCategory) {
      results = results.filter((p) => p.productCategory === filters.productCategory);
    }

    if (filters.coverageType) {
      results = results.filter((p) => p.coverageType === filters.coverageType);
    }

    if (filters.status) {
      results = results.filter((p) => p.status === filters.status);
    }

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<WarrantyPolicy | null> {
    await delay();
    return _policiesStore.find((p) => p.id === id || p.policyId === id) || null;
  },

  async create(data: WarrantyPolicyFormData): Promise<WarrantyPolicy> {
    await delay();
    const newId = `pol-${String(_policiesStore.length + 1).padStart(3, '0')}`;
    const newPolicyId = `POL-2026-${String(_policiesStore.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newPolicy: WarrantyPolicy = {
      ...data,
      id: newId,
      policyId: newPolicyId,
      createdAt: now,
      updatedAt: now,
    };

    _policiesStore = [newPolicy, ..._policiesStore];
    return newPolicy;
  },

  async update(id: string, data: Partial<WarrantyPolicyFormData>): Promise<WarrantyPolicy> {
    await delay();
    const index = _policiesStore.findIndex((p) => p.id === id || p.policyId === id);
    if (index === -1) {
      throw new Error(`Policy not found with ID: ${id}`);
    }

    const updated: WarrantyPolicy = {
      ..._policiesStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    _policiesStore[index] = updated;
    return updated;
  },

  async toggleStatus(id: string, newStatus: PolicyStatus): Promise<WarrantyPolicy> {
    await delay();
    const index = _policiesStore.findIndex((p) => p.id === id || p.policyId === id);
    if (index === -1) {
      throw new Error(`Policy not found with ID: ${id}`);
    }

    const updated: WarrantyPolicy = {
      ..._policiesStore[index],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    _policiesStore[index] = updated;
    return updated;
  },

  async getActivePoliciesForProduct(category: string, manufacturer?: string): Promise<WarrantyPolicy[]> {
    await delay();
    return _policiesStore.filter(
      (p) =>
        p.status === 'active' &&
        (p.productCategory === category || !category) &&
        (!manufacturer || p.manufacturer.toLowerCase().includes(manufacturer.toLowerCase()) || p.manufacturer === 'SunPower Solutions / Multi-Brand')
    );
  },
};

