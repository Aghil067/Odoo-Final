/**
 * warehouseService.ts
 * ─────────────────────────────────────────────────────────────
 * Warehouse Management Service for M04.
 */

import type {
  Warehouse,
  WarehouseFormData,
  WarehouseFilters,
} from '../types/warehouse.types';
import { MOCK_WAREHOUSES } from '../data/mockInventoryData';

function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _warehousesStore: Warehouse[] = [...MOCK_WAREHOUSES];
let _nextWarehouseId = _warehousesStore.length + 1;

export const warehouseService = {
  async list(filters: WarehouseFilters = {}): Promise<{ data: Warehouse[]; total: number }> {
    await delay();
    let results = [..._warehousesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q) ||
          w.city.toLowerCase().includes(q) ||
          w.contactPerson.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((w) => w.status === filters.status);
    }

    if (filters.city) {
      results = results.filter((w) => w.city.toLowerCase() === filters.city!.toLowerCase());
    }

    results.sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<Warehouse | null> {
    await delay(150);
    return _warehousesStore.find((w) => w.id === id || w.warehouseId === id) ?? null;
  },

  async create(data: WarehouseFormData): Promise<Warehouse> {
    await delay(400);
    const id = `wh-${String(_nextWarehouseId).padStart(3, '0')}`;
    const warehouseId = `WH-${String(_nextWarehouseId).padStart(4, '0')}`;
    _nextWarehouseId++;

    const now = new Date().toISOString();
    const warehouse: Warehouse = {
      ...data,
      id,
      warehouseId,
      storageAreas: data.storageAreas.map((sa, idx) => ({
        id: `sa-new-${Date.now()}-${idx}`,
        name: sa.name,
        code: sa.code,
        description: sa.description,
      })),
      totalStockValue: 0,
      totalProductsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    _warehousesStore = [warehouse, ..._warehousesStore];
    return warehouse;
  },

  async update(id: string, data: Partial<WarehouseFormData>): Promise<Warehouse> {
    await delay(350);
    const idx = _warehousesStore.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('Warehouse not found');

    const current = _warehousesStore[idx];
    const updated: Warehouse = {
      ...current,
      ...data,
      storageAreas: data.storageAreas
        ? data.storageAreas.map((sa, i) => ({
            id: current.storageAreas[i]?.id ?? `sa-gen-${Date.now()}-${i}`,
            name: sa.name,
            code: sa.code,
            description: sa.description,
          }))
        : current.storageAreas,
      updatedAt: new Date().toISOString(),
    };

    _warehousesStore = [
      ..._warehousesStore.slice(0, idx),
      updated,
      ..._warehousesStore.slice(idx + 1),
    ];
    return updated;
  },

  async toggleStatus(id: string): Promise<Warehouse> {
    await delay(250);
    const idx = _warehousesStore.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('Warehouse not found');

    const newStatus = _warehousesStore[idx].status === 'active' ? 'inactive' : 'active';
    const updated: Warehouse = {
      ..._warehousesStore[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    _warehousesStore = [
      ..._warehousesStore.slice(0, idx),
      updated,
      ..._warehousesStore.slice(idx + 1),
    ];
    return updated;
  },
};

