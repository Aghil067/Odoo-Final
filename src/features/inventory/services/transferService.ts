/**
 * transferService.ts
 * ─────────────────────────────────────────────────────────────
 * Stock Transfers Service for M04.
 */

import type {
  StockTransfer,
  StockTransferFormData,
  TransferStatus,
} from '../types/stock.types';
import { MOCK_TRANSFERS, MOCK_WAREHOUSES } from '../data/mockInventoryData';
import { stockService } from './stockService';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _transfersStore: StockTransfer[] = [...MOCK_TRANSFERS];
let _nextTransferId = _transfersStore.length + 1;

export const transferService = {
  async list(filters: { search?: string; status?: TransferStatus | '' } = {}): Promise<{
    data: StockTransfer[];
    total: number;
  }> {
    await delay();
    let results = [..._transfersStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.transferNumber.toLowerCase().includes(q) ||
          t.sourceWarehouseName.toLowerCase().includes(q) ||
          t.destinationWarehouseName.toLowerCase().includes(q) ||
          t.reason.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((t) => t.status === filters.status);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<StockTransfer | null> {
    await delay(150);
    return _transfersStore.find((t) => t.id === id || t.transferNumber === id) ?? null;
  },

  async create(data: StockTransferFormData, user = 'Current User'): Promise<StockTransfer> {
    await delay(500);
    const id = `trf-${String(_nextTransferId).padStart(3, '0')}`;
    const transferNumber = `TRF-${String(_nextTransferId).padStart(4, '0')}`;
    _nextTransferId++;

    const srcWh = MOCK_WAREHOUSES.find((w) => w.id === data.sourceWarehouseId);
    const dstWh = MOCK_WAREHOUSES.find((w) => w.id === data.destinationWarehouseId);

    const items = data.items.map((item, index) => ({
      ...item,
      id: `ti-${Date.now()}-${index}`,
    }));

    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);

    const transfer: StockTransfer = {
      ...data,
      id,
      transferNumber,
      sourceWarehouseName: srcWh?.name ?? 'Source Warehouse',
      destinationWarehouseName: dstWh?.name ?? 'Destination Warehouse',
      status: data.status ?? 'in_transit',
      items,
      totalItems: items.length,
      totalQuantity,
      requestedBy: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    _transfersStore = [transfer, ..._transfersStore];

    // Log movement
    for (const item of transfer.items) {
      await stockService.logMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        movementType: 'transfer',
        quantity: item.quantity,
        uom: item.unit,
        sourceLocation: transfer.sourceWarehouseName,
        destinationLocation: transfer.destinationWarehouseName,
        referenceNumber: transferNumber,
        performedBy: user,
        serialNumbers: item.selectedSerialNumbers,
      });
    }

    return transfer;
  },

  async updateStatus(id: string, status: TransferStatus): Promise<StockTransfer> {
    await delay(300);
    const idx = _transfersStore.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transfer record not found');

    const updated: StockTransfer = {
      ..._transfersStore[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    _transfersStore = [
      ..._transfersStore.slice(0, idx),
      updated,
      ..._transfersStore.slice(idx + 1),
    ];
    return updated;
  },
};

