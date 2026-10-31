/**
 * componentService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for System Components Catalogue.
 */

import type {
  SystemComponent,
  ComponentFormData,
  ComponentFilters,
} from '../types/component.types';
import { MOCK_COMPONENTS } from '../data/mockConfigurationData';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _componentsStore: SystemComponent[] = [...MOCK_COMPONENTS];
let _nextComponentId = _componentsStore.length + 1;

export const componentService = {
  async list(filters: ComponentFilters = {}): Promise<{ data: SystemComponent[]; total: number }> {
    await delay();
    let results = [..._componentsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.componentId.toLowerCase().includes(q) ||
          c.modelNumber.toLowerCase().includes(q) ||
          c.manufacturer.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      results = results.filter((c) => c.category === filters.category);
    }

    if (filters.manufacturer) {
      results = results.filter((c) =>
        c.manufacturer.toLowerCase().includes(filters.manufacturer!.toLowerCase())
      );
    }

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    results.sort((a, b) => a.name.localeCompare(b.name));

    const total = results.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const start = (page - 1) * pageSize;

    return {
      data: results.slice(start, start + pageSize),
      total,
    };
  },

  async getById(id: string): Promise<SystemComponent | null> {
    await delay(150);
    return _componentsStore.find((c) => c.id === id) ?? null;
  },

  async create(data: ComponentFormData): Promise<SystemComponent> {
    await delay(400);
    const id = `cmp-${String(_nextComponentId).padStart(3, '0')}`;
    const componentId = `CMP-${String(_nextComponentId).padStart(4, '0')}`;
    _nextComponentId++;

    const now = new Date().toISOString();
    const component: SystemComponent = {
      ...data,
      id,
      componentId,
      createdAt: now,
      updatedAt: now,
    };

    _componentsStore = [component, ..._componentsStore];
    return component;
  },

  async update(id: string, data: Partial<ComponentFormData>): Promise<SystemComponent> {
    await delay(400);
    const idx = _componentsStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Component not found');

    const updated: SystemComponent = {
      ..._componentsStore[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    _componentsStore = [
      ..._componentsStore.slice(0, idx),
      updated,
      ..._componentsStore.slice(idx + 1),
    ];
    return updated;
  },

  async toggleStatus(id: string): Promise<SystemComponent> {
    await delay(250);
    const idx = _componentsStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Component not found');

    const newStatus = _componentsStore[idx].status === 'active' ? 'inactive' : 'active';
    const updated: SystemComponent = {
      ..._componentsStore[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    _componentsStore = [
      ..._componentsStore.slice(0, idx),
      updated,
      ..._componentsStore.slice(idx + 1),
    ];
    return updated;
  },
};

