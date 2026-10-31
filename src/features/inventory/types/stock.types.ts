/**
 * stock.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Stock Balances, Receipts, Issues, Transfers,
 * Adjustments, and Movements.
 */

import type { ProductCategory, TrackingMethod } from './product.types';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockBalance {
  id: string; // e.g. "sb-001"
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  warehouseId: string;
  warehouseName: string;
  location: string; // e.g. "Bay 1 - Shelf A"
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStockLevel: number;
  reorderQuantity: number;
  uom: string;
  status: StockStatus;
  lastStockTakeDate?: string;
  updatedAt: string;
}

// ─── Stock Receipts ──────────────────────────────────────────
export type ReceiptStatus = 'draft' | 'submitted' | 'received' | 'cancelled';

export interface StockReceiptLine {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantityReceived: number;
  unit: string;
  purchaseCost?: number;
  lineTotal?: number;
  trackingMethod: TrackingMethod;
  serialNumbers: string[];
  remarks?: string;
}

export interface StockReceipt {
  id: string; // e.g. "rec-001"
  receiptNumber: string; // e.g. "REC-0001"
  receiptDate: string;
  supplierName: string;
  supplierReference?: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: ReceiptStatus;
  notes?: string;
  lines: StockReceiptLine[];
  totalItems: number;
  totalQuantity: number;
  totalCost?: number;
  receivedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockReceiptFormData {
  receiptDate: string;
  supplierName: string;
  supplierReference?: string;
  destinationWarehouseId: string;
  notes?: string;
  lines: Omit<StockReceiptLine, 'id'>[];
  status?: ReceiptStatus;
}

// ─── Stock Issues ────────────────────────────────────────────
export type IssuePurpose = 'installation' | 'service_repair' | 'internal_use' | 'other';
export type IssueStatus = 'draft' | 'submitted' | 'issued' | 'cancelled';

export interface StockIssueLine {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  availableQuantity: number;
  quantityToIssue: number;
  unit: string;
  trackingMethod: TrackingMethod;
  selectedSerialNumbers: string[];
  remarks?: string;
}

export interface StockIssue {
  id: string; // e.g. "iss-001"
  issueNumber: string; // e.g. "ISS-0001"
  issueDate: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  purpose: IssuePurpose;
  referenceType: 'installation_order' | 'service_ticket' | 'manual' | 'other';
  referenceId?: string; // e.g. "INS-2026-001", "SRV-TKT-104"
  issuedTo: string; // Technician, Customer, or Department
  status: IssueStatus;
  notes?: string;
  lines: StockIssueLine[];
  totalItems: number;
  totalQuantity: number;
  issuedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockIssueFormData {
  issueDate: string;
  sourceWarehouseId: string;
  purpose: IssuePurpose;
  referenceType: 'installation_order' | 'service_ticket' | 'manual' | 'other';
  referenceId?: string;
  issuedTo: string;
  notes?: string;
  lines: Omit<StockIssueLine, 'id'>[];
  status?: IssueStatus;
}

// ─── Stock Transfers ─────────────────────────────────────────
export type TransferStatus = 'draft' | 'submitted' | 'in_transit' | 'completed' | 'cancelled';

export interface StockTransferItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  trackingMethod: TrackingMethod;
  selectedSerialNumbers: string[];
  remarks?: string;
}

export interface StockTransfer {
  id: string; // e.g. "trf-001"
  transferNumber: string; // e.g. "TRF-0001"
  transferDate: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  reason: string;
  status: TransferStatus;
  notes?: string;
  items: StockTransferItem[];
  totalItems: number;
  totalQuantity: number;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferFormData {
  transferDate: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  reason: string;
  notes?: string;
  items: Omit<StockTransferItem, 'id'>[];
  status?: TransferStatus;
}

// ─── Stock Adjustments ───────────────────────────────────────
export type AdjustmentReason =
  | 'physical_count'
  | 'damaged_goods'
  | 'missing_goods'
  | 'data_correction'
  | 'other';

export type AdjustmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface StockAdjustmentLine {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  systemQuantity: number;
  physicalCount: number;
  difference: number; // physicalCount - systemQuantity
  unit: string;
  trackingMethod: TrackingMethod;
  serialNumbers?: string[];
  remarks?: string;
}

export interface StockAdjustment {
  id: string; // e.g. "adj-001"
  adjustmentNumber: string; // e.g. "ADJ-0001"
  warehouseId: string;
  warehouseName: string;
  adjustmentDate: string;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  explanation: string;
  notes?: string;
  lines: StockAdjustmentLine[];
  totalItems: number;
  totalDifference: number;
  adjustedBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentFormData {
  warehouseId: string;
  adjustmentDate: string;
  reason: AdjustmentReason;
  explanation: string;
  notes?: string;
  lines: Omit<StockAdjustmentLine, 'id'>[];
  status?: AdjustmentStatus;
}

// ─── Stock Movement Audit ────────────────────────────────────
export type MovementType = 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return';

export interface StockMovement {
  id: string; // e.g. "mov-001"
  movementId: string; // e.g. "MOV-0001"
  date: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantity: number;
  uom: string;
  sourceLocation?: string;
  destinationLocation?: string;
  referenceNumber: string; // e.g. "REC-0001", "ISS-0001", "TRF-0001", "ADJ-0001"
  performedBy: string;
  serialNumbers?: string[];
  notes?: string;
}

// ─── Status Labels and Colours ───────────────────────────────
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export const STOCK_STATUS_COLOURS: Record<StockStatus, string> = {
  in_stock: 'bg-emerald-100 text-emerald-800',
  low_stock: 'bg-amber-100 text-amber-800',
  out_of_stock: 'bg-red-100 text-red-800',
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const RECEIPT_STATUS_COLOURS: Record<ReceiptStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-800',
  received: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  issued: 'Issued',
  cancelled: 'Cancelled',
};

export const ISSUE_STATUS_COLOURS: Record<IssueStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-800',
  issued: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ISSUE_PURPOSE_LABELS: Record<IssuePurpose, string> = {
  installation: 'Site Installation',
  service_repair: 'Service / Warranty Repair',
  internal_use: 'Internal Testing / R&D',
  other: 'Other Purpose',
};

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TRANSFER_STATUS_COLOURS: Record<TransferStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  physical_count: 'Physical Stock Count',
  damaged_goods: 'Damaged Goods',
  missing_goods: 'Missing Goods',
  data_correction: 'Data Correction',
  other: 'Other Reason',
};

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ADJUSTMENT_STATUS_COLOURS: Record<AdjustmentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  receipt: 'Stock Receipt',
  issue: 'Stock Issue',
  transfer: 'Stock Transfer',
  adjustment: 'Stock Adjustment',
  return: 'Stock Return',
};

export const MOVEMENT_TYPE_COLOURS: Record<MovementType, string> = {
  receipt: 'bg-emerald-100 text-emerald-800',
  issue: 'bg-blue-100 text-blue-800',
  transfer: 'bg-purple-100 text-purple-800',
  adjustment: 'bg-amber-100 text-amber-800',
  return: 'bg-orange-100 text-orange-800',
};

