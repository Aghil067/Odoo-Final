/**
 * warehouse.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Warehouses and Storage Areas.
 */

export type WarehouseStatus = 'active' | 'inactive';

export interface StorageArea {
  id: string;
  name: string; // e.g. "Bay 1", "Secure Cage", "Bulk Pallet Area"
  code: string; // e.g. "B1", "SEC-A"
  description?: string;
}

export interface Warehouse {
  id: string; // e.g. "wh-001"
  warehouseId: string; // e.g. "WH-0001"
  name: string;
  code: string; // e.g. "MAIN-BLR"
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  status: WarehouseStatus;
  storageAreas: StorageArea[];
  totalStockValue?: number;
  totalProductsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  status: WarehouseStatus;
  storageAreas: { name: string; code: string; description?: string }[];
}

export interface WarehouseFilters {
  search?: string;
  status?: WarehouseStatus;
  city?: string;
}

