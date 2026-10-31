/**
 * serialNumber.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Serial Number Tracking in M04.
 */

import type { ProductCategory } from './product.types';

export type SerialNumberStatus =
  | 'available'
  | 'reserved'
  | 'issued'
  | 'installed'
  | 'under_service'
  | 'returned'
  | 'damaged';

export interface SerialMovementItem {
  id: string;
  date: string;
  movementType: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'installation' | 'service';
  fromLocation: string;
  toLocation: string;
  referenceNumber: string; // e.g. "REC-0001", "ISS-0001", "TRF-0001"
  performedBy: string;
  notes?: string;
}

export interface SerialNumberRecord {
  id: string; // e.g. "sn-001"
  serialNumber: string; // Unique string, e.g. "GW-3K-2026-00412"
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  manufacturer: string;
  modelNumber: string;
  currentWarehouseId?: string;
  currentWarehouseName?: string;
  currentLocation?: string; // e.g. "Bay 1 - Shelf A"
  status: SerialNumberStatus;
  receiptReference?: string; // e.g. "REC-0001"
  receiptDate?: string;
  issueReference?: string; // e.g. "ISS-0001"
  linkedInstallationId?: string; // e.g. "INS-2026-001"
  linkedInstallationCustomer?: string; // e.g. "Rajesh Kumar"
  warrantyStatus?: string; // Placeholder for M07: e.g. "Active (10 Years)"
  warrantyExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  movementHistory: SerialMovementItem[];
}

export interface SerialNumberFilters {
  search?: string;
  productId?: string;
  category?: ProductCategory;
  status?: SerialNumberStatus;
  warehouseId?: string;
  page?: number;
  pageSize?: number;
}

export const SERIAL_STATUS_LABELS: Record<SerialNumberStatus, string> = {
  available: 'Available in Warehouse',
  reserved: 'Reserved for Project',
  issued: 'Issued to Field',
  installed: 'Installed at Site',
  under_service: 'Under Service / RMA',
  returned: 'Returned to Stock',
  damaged: 'Damaged / Scrapped',
};

export const SERIAL_STATUS_COLOURS: Record<SerialNumberStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-amber-100 text-amber-800',
  issued: 'bg-blue-100 text-blue-800',
  installed: 'bg-purple-100 text-purple-800',
  under_service: 'bg-orange-100 text-orange-800',
  returned: 'bg-teal-100 text-teal-800',
  damaged: 'bg-red-100 text-red-800',
};

