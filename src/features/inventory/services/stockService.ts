/**
 * stockService.ts
 * ─────────────────────────────────────────────────────────────
 * Stock Balance and Movements Service for M04.
 */

import type {
  StockBalance,
  StockMovement,
  StockStatus,
  MovementType,
} from '../types/stock.types';
import type { ProductCategory } from '../types/product.types';
import {
  MOCK_STOCK_BALANCES,
  MOCK_MOVEMENTS,
  MOCK_PRODUCTS,
  MOCK_WAREHOUSES,
  MOCK_SERIAL_NUMBERS,
} from '../data/mockInventoryData';

function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _stockBalancesStore: StockBalance[] = [...MOCK_STOCK_BALANCES];
let _movementsStore: StockMovement[] = [...MOCK_MOVEMENTS];

export const stockService = {
  async getStockOverview(filters: {
    search?: string;
    warehouseId?: string;
    category?: ProductCategory;
    status?: StockStatus;
  } = {}): Promise<{ data: StockBalance[]; total: number }> {
    await delay();
    let results = [..._stockBalancesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (sb) =>
          sb.productName.toLowerCase().includes(q) ||
          sb.sku.toLowerCase().includes(q) ||
          sb.warehouseName.toLowerCase().includes(q) ||
          sb.location.toLowerCase().includes(q)
      );
    }

    if (filters.warehouseId) {
      results = results.filter((sb) => sb.warehouseId === filters.warehouseId);
    }

    if (filters.category) {
      results = results.filter((sb) => sb.category === filters.category);
    }

    if (filters.status) {
      results = results.filter((sb) => sb.status === filters.status);
    }

    results.sort((a, b) => a.productName.localeCompare(b.productName));

    return {
      data: results,
      total: results.length,
    };
  },

  async getMovements(filters: {
    search?: string;
    movementType?: MovementType;
    productId?: string;
    warehouseId?: string;
  } = {}): Promise<{ data: StockMovement[]; total: number }> {
    await delay();
    let results = [..._movementsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (m) =>
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.movementId.toLowerCase().includes(q) ||
          m.performedBy.toLowerCase().includes(q)
      );
    }

    if (filters.movementType) {
      results = results.filter((m) => m.movementType === filters.movementType);
    }

    if (filters.productId) {
      results = results.filter((m) => m.productId === filters.productId);
    }

    results.sort((a, b) => b.date.localeCompare(a.date));

    return {
      data: results,
      total: results.length,
    };
  },

  async logMovement(movement: Omit<StockMovement, 'id' | 'movementId' | 'date'>): Promise<StockMovement> {
    const id = `mov-${Date.now()}`;
    const movementId = `MOV-${String(_movementsStore.length + 1).padStart(4, '0')}`;
    const newMovement: StockMovement = {
      ...movement,
      id,
      movementId,
      date: new Date().toISOString(),
    };
    _movementsStore = [newMovement, ..._movementsStore];
    return newMovement;
  },

  async getDashboardStats() {
    await delay(200);
    const products = MOCK_PRODUCTS;
    const warehouses = MOCK_WAREHOUSES;
    const balances = _stockBalancesStore;
    const serials = MOCK_SERIAL_NUMBERS;

    const totalProducts = products.length;
    const totalWarehouses = warehouses.length;
    const totalStockQuantity = balances.reduce((acc, curr) => acc + curr.totalQuantity, 0);

    const lowStockCount = balances.filter((b) => b.status === 'low_stock').length;
    const outOfStockCount = balances.filter((b) => b.status === 'out_of_stock').length;
    const serialTrackedItemsCount = serials.length;
    const availableSerialsCount = serials.filter((s) => s.status === 'available').length;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const b of balances) {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + b.totalQuantity;
    }

    // Warehouse distribution
    const warehouseCounts: Record<string, { name: string; quantity: number }> = {};
    for (const b of balances) {
      if (!warehouseCounts[b.warehouseId]) {
        warehouseCounts[b.warehouseId] = { name: b.warehouseName, quantity: 0 };
      }
      warehouseCounts[b.warehouseId].quantity += b.totalQuantity;
    }

    // Low stock items list
    const lowStockAlerts = balances.filter(
      (b) => b.status === 'low_stock' || b.status === 'out_of_stock'
    );

    return {
      totalProducts,
      totalWarehouses,
      totalStockQuantity,
      lowStockCount,
      outOfStockCount,
      serialTrackedItemsCount,
      availableSerialsCount,
      categoryCounts,
      warehouseCounts,
      lowStockAlerts,
    };
  },
};

