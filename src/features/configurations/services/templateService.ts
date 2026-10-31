/**
 * templateService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for System Templates.
 */

import type {
  SystemTemplate,
  TemplateFormData,
  TemplateFilters,
} from '../types/template.types';
import { MOCK_TEMPLATES } from '../data/mockConfigurationData';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _templatesStore: SystemTemplate[] = [...MOCK_TEMPLATES];
let _nextTemplateId = _templatesStore.length + 1;

function calculateTotalCost(components: SystemTemplate['components']): number {
  return components.reduce((acc, curr) => acc + (curr.estimatedUnitCost || 0) * curr.quantity, 0);
}

export const templateService = {
  async list(filters: TemplateFilters = {}): Promise<{ data: SystemTemplate[]; total: number }> {
    await delay();
    let results = [..._templatesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.templateName.toLowerCase().includes(q) ||
          t.templateId.toLowerCase().includes(q) ||
          t.templateCode.toLowerCase().includes(q)
      );
    }

    if (filters.systemType) {
      results = results.filter((t) => t.systemType === filters.systemType);
    }

    if (filters.ratedCapacity) {
      results = results.filter((t) => t.ratedCapacity === filters.ratedCapacity);
    }

    if (filters.status) {
      results = results.filter((t) => t.status === filters.status);
    }

    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const total = results.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const start = (page - 1) * pageSize;

    return {
      data: results.slice(start, start + pageSize),
      total,
    };
  },

  async getById(id: string): Promise<SystemTemplate | null> {
    await delay(150);
    return _templatesStore.find((t) => t.id === id) ?? null;
  },

  async create(data: TemplateFormData): Promise<SystemTemplate> {
    await delay(500);
    const id = `tpl-${String(_nextTemplateId).padStart(3, '0')}`;
    const templateId = `TPL-${String(_nextTemplateId).padStart(4, '0')}`;
    _nextTemplateId++;

    const now = new Date().toISOString();
    const estimatedTotalCost = calculateTotalCost(data.components);

    const template: SystemTemplate = {
      ...data,
      id,
      templateId,
      estimatedTotalCost,
      createdAt: now,
      updatedAt: now,
    };

    _templatesStore = [template, ..._templatesStore];
    return template;
  },

  async update(id: string, data: Partial<TemplateFormData>): Promise<SystemTemplate> {
    await delay(450);
    const idx = _templatesStore.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Template not found');

    const merged = { ..._templatesStore[idx], ...data };
    if (data.components) {
      merged.estimatedTotalCost = calculateTotalCost(data.components);
    }
    merged.updatedAt = new Date().toISOString();

    _templatesStore = [
      ..._templatesStore.slice(0, idx),
      merged,
      ..._templatesStore.slice(idx + 1),
    ];
    return merged;
  },

  async toggleStatus(id: string): Promise<SystemTemplate> {
    await delay(250);
    const idx = _templatesStore.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Template not found');

    const newStatus = _templatesStore[idx].status === 'active' ? 'inactive' : 'active';
    const updated: SystemTemplate = {
      ..._templatesStore[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    _templatesStore = [
      ..._templatesStore.slice(0, idx),
      updated,
      ..._templatesStore.slice(idx + 1),
    ];
    return updated;
  },
};

