/**
 * adjustmentService.ts
 * ─────────────────────────────────────────────────────────────
 * Stock Adjustments Service for M04.
 */

import type {
  StockAdjustment,
  StockAdjustmentFormData,
  AdjustmentStatus,
} from '../types/stock.types';
import { MOCK_ADJUSTMENTS, MOCK_WAREHOUSES } from '../data/mockInventoryData';
import { stockService } from './stockService';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _adjustmentsStore: StockAdjustment[] = [...MOCK_ADJUSTMENTS];
let _nextAdjustmentId = _adjustmentsStore.length + 1;

export const adjustmentService = {
  async list(filters: { search?: string; status?: AdjustmentStatus | '' } = {}): Promise<{
    data: StockAdjustment[];
    total: number;
  }> {
    await delay();
    let results = [..._adjustmentsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.adjustmentNumber.toLowerCase().includes(q) ||
          a.warehouseName.toLowerCase().includes(q) ||
          a.explanation.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((a) => a.status === filters.status);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<StockAdjustment | null> {
    await delay(150);
    return _adjustmentsStore.find((a) => a.id === id || a.adjustmentNumber === id) ?? null;
  },

  async create(data: StockAdjustmentFormData, user = 'Current User'): Promise<StockAdjustment> {
    await delay(500);
    const id = `adj-${String(_nextAdjustmentId).padStart(3, '0')}`;
    const adjustmentNumber = `ADJ-${String(_nextAdjustmentId).padStart(4, '0')}`;
    _nextAdjustmentId++;

    const wh = MOCK_WAREHOUSES.find((w) => w.id === data.warehouseId);

    const lines = data.lines.map((l, index) => ({
      ...l,
      id: `al-${Date.now()}-${index}`,
      difference: l.physicalCount - l.systemQuantity,
    }));

    const totalDifference = lines.reduce((acc, curr) => acc + curr.difference, 0);

    const adjustment: StockAdjustment = {
      ...data,
      id,
      adjustmentNumber,
      warehouseName: wh?.name ?? 'Warehouse',
      status: data.status ?? 'submitted',
      lines,
      totalItems: lines.length,
      totalDifference,
      adjustedBy: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    _adjustmentsStore = [adjustment, ..._adjustmentsStore];

    // Log movement
    for (const line of adjustment.lines) {
      if (line.difference !== 0) {
        await stockService.logMovement({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          movementType: 'adjustment',
          quantity: line.difference,
          uom: line.unit,
          sourceLocation: adjustment.warehouseName,
          referenceNumber: adjustmentNumber,
          performedBy: user,
          notes: adjustment.explanation,
        });
      }
    }

    return adjustment;
  },

  async updateStatus(id: string, status: AdjustmentStatus, approverName = 'Admin'): Promise<StockAdjustment> {
    await delay(300);
    const idx = _adjustmentsStore.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Adjustment record not found');

    const updated: StockAdjustment = {
      ..._adjustmentsStore[idx],
      status,
      approvedBy: status === 'approved' ? approverName : undefined,
      updatedAt: new Date().toISOString(),
    };

    _adjustmentsStore = [
      ..._adjustmentsStore.slice(0, idx),
      updated,
      ..._adjustmentsStore.slice(idx + 1),
    ];
    return updated;
  },
};

