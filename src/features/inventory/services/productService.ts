/**
 * productService.ts
 * ─────────────────────────────────────────────────────────────
 * Product Management Service for M04.
 */

import type {
  InventoryProduct,
  ProductFormData,
  ProductFilters,
} from '../types/product.types';
import { MOCK_PRODUCTS } from '../data/mockInventoryData';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _productsStore: InventoryProduct[] = [...MOCK_PRODUCTS];
let _nextProductId = _productsStore.length + 1;

export const productService = {
  async list(filters: ProductFilters = {}): Promise<{ data: InventoryProduct[]; total: number }> {
    await delay();
    let results = [..._productsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.productId.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          p.modelNumber.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    if (filters.manufacturer) {
      results = results.filter((p) =>
        p.manufacturer.toLowerCase().includes(filters.manufacturer!.toLowerCase())
      );
    }

    if (filters.trackingMethod) {
      results = results.filter((p) => p.trackingMethod === filters.trackingMethod);
    }

    if (filters.status) {
      results = results.filter((p) => p.status === filters.status);
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

  async getById(id: string): Promise<InventoryProduct | null> {
    await delay(150);
    return _productsStore.find((p) => p.id === id || p.productId === id) ?? null;
  },

  async create(data: ProductFormData): Promise<InventoryProduct> {
    await delay(450);
    const id = `prod-${String(_nextProductId).padStart(3, '0')}`;
    const productId = `PRD-${String(_nextProductId).padStart(4, '0')}`;
    _nextProductId++;

    const now = new Date().toISOString();
    const product: InventoryProduct = {
      ...data,
      id,
      productId,
      createdAt: now,
      updatedAt: now,
    };

    _productsStore = [product, ..._productsStore];
    return product;
  },

  async update(id: string, data: Partial<ProductFormData>): Promise<InventoryProduct> {
    await delay(400);
    const idx = _productsStore.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const updated: InventoryProduct = {
      ..._productsStore[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    _productsStore = [
      ..._productsStore.slice(0, idx),
      updated,
      ..._productsStore.slice(idx + 1),
    ];
    return updated;
  },

  async toggleStatus(id: string): Promise<InventoryProduct> {
    await delay(250);
    const idx = _productsStore.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const newStatus = _productsStore[idx].status === 'active' ? 'inactive' : 'active';
    const updated: InventoryProduct = {
      ..._productsStore[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    _productsStore = [
      ..._productsStore.slice(0, idx),
      updated,
      ..._productsStore.slice(idx + 1),
    ];
    return updated;
  },
};

