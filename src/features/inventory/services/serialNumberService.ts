/**
 * serialNumberService.ts
 * ─────────────────────────────────────────────────────────────
 * Serial Number Tracking Service for M04.
 */

import type {
  SerialNumberRecord,
  SerialNumberStatus,
  SerialNumberFilters,
} from '../types/serialNumber.types';
import { MOCK_SERIAL_NUMBERS } from '../data/mockInventoryData';

function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _serialsStore: SerialNumberRecord[] = [...MOCK_SERIAL_NUMBERS];

export const serialNumberService = {
  async list(filters: SerialNumberFilters = {}): Promise<{
    data: SerialNumberRecord[];
    total: number;
  }> {
    await delay();
    let results = [..._serialsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.serialNumber.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.manufacturer.toLowerCase().includes(q) ||
          s.modelNumber.toLowerCase().includes(q) ||
          (s.linkedInstallationCustomer && s.linkedInstallationCustomer.toLowerCase().includes(q))
      );
    }

    if (filters.status) {
      results = results.filter((s) => s.status === filters.status);
    }

    if (filters.productId) {
      results = results.filter((s) => s.productId === filters.productId);
    }

    if (filters.category) {
      results = results.filter((s) => s.category === filters.category);
    }

    if (filters.warehouseId) {
      results = results.filter((s) => s.currentWarehouseId === filters.warehouseId);
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

  async getById(id: string): Promise<SerialNumberRecord | null> {
    await delay(150);
    return (
      _serialsStore.find(
        (s) => s.id === id || s.serialNumber.toLowerCase() === id.toLowerCase()
      ) ?? null
    );
  },

  async getAvailableSerialsForProduct(productId: string, warehouseId?: string): Promise<string[]> {
    await delay(100);
    return _serialsStore
      .filter(
        (s) =>
          s.productId === productId &&
          s.status === 'available' &&
          (!warehouseId || s.currentWarehouseId === warehouseId)
      )
      .map((s) => s.serialNumber);
  },

  async updateStatus(
    id: string,
    status: SerialNumberStatus,
    note?: string,
    user = 'Current User'
  ): Promise<SerialNumberRecord> {
    await delay(300);
    const idx = _serialsStore.findIndex((s) => s.id === id || s.serialNumber === id);
    if (idx === -1) throw new Error('Serial number not found');

    const current = _serialsStore[idx];
    const movementItem = {
      id: `sm-${Date.now()}`,
      date: new Date().toISOString(),
      movementType: 'status_change' as any,
      fromLocation: current.currentWarehouseName ?? 'Unknown',
      toLocation: status,
      referenceNumber: 'STATUS-MOD',
      performedBy: user,
      notes: note || `Status changed from ${current.status} to ${status}`,
    };

    const updated: SerialNumberRecord = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      movementHistory: [movementItem, ...current.movementHistory],
    };

    _serialsStore = [
      ..._serialsStore.slice(0, idx),
      updated,
      ..._serialsStore.slice(idx + 1),
    ];
    return updated;
  },
};

