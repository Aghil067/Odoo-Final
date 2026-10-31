/**
 * receiptService.ts
 * ─────────────────────────────────────────────────────────────
 * Stock Receipts Service for M04.
 */

import type {
  StockReceipt,
  StockReceiptFormData,
  ReceiptStatus,
} from '../types/stock.types';
import { MOCK_RECEIPTS, MOCK_WAREHOUSES } from '../data/mockInventoryData';
import { stockService } from './stockService';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _receiptsStore: StockReceipt[] = [...MOCK_RECEIPTS];
let _nextReceiptId = _receiptsStore.length + 1;

export const receiptService = {
  async list(filters: { search?: string; status?: ReceiptStatus | ''; warehouseId?: string } = {}): Promise<{
    data: StockReceipt[];
    total: number;
  }> {
    await delay();
    let results = [..._receiptsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          (r.supplierReference && r.supplierReference.toLowerCase().includes(q))
      );
    }

    if (filters.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    if (filters.warehouseId) {
      results = results.filter((r) => r.destinationWarehouseId === filters.warehouseId);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<StockReceipt | null> {
    await delay(150);
    return _receiptsStore.find((r) => r.id === id || r.receiptNumber === id) ?? null;
  },

  async create(data: StockReceiptFormData, user = 'Current User'): Promise<StockReceipt> {
    await delay(500);
    const id = `rec-${String(_nextReceiptId).padStart(3, '0')}`;
    const receiptNumber = `REC-${String(_nextReceiptId).padStart(4, '0')}`;
    _nextReceiptId++;

    const wh = MOCK_WAREHOUSES.find((w) => w.id === data.destinationWarehouseId);
    const destinationWarehouseName = wh?.name ?? 'Designated Warehouse';

    const lines = data.lines.map((l, index) => ({
      ...l,
      id: `rl-${Date.now()}-${index}`,
      lineTotal: l.purchaseCost ? l.purchaseCost * l.quantityReceived : undefined,
    }));

    const totalQuantity = lines.reduce((acc, curr) => acc + curr.quantityReceived, 0);
    const totalCost = lines.reduce((acc, curr) => acc + (curr.lineTotal || 0), 0);

    const receipt: StockReceipt = {
      ...data,
      id,
      receiptNumber,
      destinationWarehouseName,
      status: data.status ?? 'received',
      lines,
      totalItems: lines.length,
      totalQuantity,
      totalCost,
      receivedBy: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    _receiptsStore = [receipt, ..._receiptsStore];

    // Log movement if status is received
    if (receipt.status === 'received') {
      for (const line of receipt.lines) {
        await stockService.logMovement({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          movementType: 'receipt',
          quantity: line.quantityReceived,
          uom: line.unit,
          destinationLocation: destinationWarehouseName,
          referenceNumber: receiptNumber,
          performedBy: user,
          serialNumbers: line.serialNumbers,
        });
      }
    }

    return receipt;
  },

  async updateStatus(id: string, status: ReceiptStatus): Promise<StockReceipt> {
    await delay(300);
    const idx = _receiptsStore.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Receipt not found');

    const updated: StockReceipt = {
      ..._receiptsStore[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    _receiptsStore = [
      ..._receiptsStore.slice(0, idx),
      updated,
      ..._receiptsStore.slice(idx + 1),
    ];
    return updated;
  },
};

