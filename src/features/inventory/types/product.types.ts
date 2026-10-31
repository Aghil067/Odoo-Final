/**
 * product.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Products and Hardware Catalogue in M04.
 */

export type ProductCategory =
  | 'solar_panels'
  | 'inverter'
  | 'battery'
  | 'charge_controller'
  | 'mounting_structure'
  | 'dc_cables'
  | 'ac_cables'
  | 'dc_protection'
  | 'ac_protection'
  | 'earthing_equipment'
  | 'connectors_accessories'
  | 'other_supplies';

export type TrackingMethod = 'no_tracking' | 'lot_tracking' | 'serial_tracking';

export type ProductStatus = 'active' | 'inactive';

export interface ProductTechnicalSpecs {
  ratedPower?: string;
  voltage?: string;
  current?: string;
  capacity?: string;
  dimensions?: string;
  weight?: string;
  efficiency?: string;
  warrantyYears?: number;
  additionalSpecs?: string;
}

export interface InventoryProduct {
  id: string; // e.g. "prod-001"
  productId: string; // e.g. "PRD-0001"
  sku: string; // e.g. "WAA-550-BIF"
  name: string;
  category: ProductCategory;
  manufacturer: string;
  modelNumber: string;
  description?: string;
  uom: string; // Unit of measure: "Nos", "Meters", "Pairs", "Sets", "Rolls"
  trackingMethod: TrackingMethod;
  minimumStockLevel: number;
  reorderQuantity: number;
  defaultWarehouseId?: string;
  defaultWarehouseName?: string;
  purchaseCost?: number;
  sellingPrice?: number;
  taxRatePercent?: number;
  specs: ProductTechnicalSpecs;
  compatibleComponentId?: string; // Link to M03 SystemComponent (e.g. "cmp-001")
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  category: ProductCategory;
  manufacturer: string;
  modelNumber: string;
  description?: string;
  uom: string;
  trackingMethod: TrackingMethod;
  minimumStockLevel: number;
  reorderQuantity: number;
  defaultWarehouseId?: string;
  purchaseCost?: number;
  sellingPrice?: number;
  taxRatePercent?: number;
  specs: ProductTechnicalSpecs;
  compatibleComponentId?: string;
  status: ProductStatus;
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  manufacturer?: string;
  trackingMethod?: TrackingMethod;
  status?: ProductStatus;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  pageSize?: number;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  solar_panels: 'Solar Panels',
  inverter: 'Inverters',
  battery: 'Batteries',
  charge_controller: 'Charge Controllers',
  mounting_structure: 'Mounting Structures',
  dc_cables: 'DC Cables',
  ac_cables: 'AC Cables',
  dc_protection: 'DC Protection Devices',
  ac_protection: 'AC Protection Devices',
  earthing_equipment: 'Earthing Equipment',
  connectors_accessories: 'Connectors & Accessories',
  other_supplies: 'Other Supplies',
};

export const TRACKING_METHOD_LABELS: Record<TrackingMethod, string> = {
  no_tracking: 'No Tracking',
  lot_tracking: 'Lot Tracking',
  serial_tracking: 'Serial Tracking',
};

export const TRACKING_METHOD_COLOURS: Record<TrackingMethod, string> = {
  no_tracking: 'bg-slate-100 text-slate-700',
  lot_tracking: 'bg-blue-100 text-blue-800',
  serial_tracking: 'bg-purple-100 text-purple-800',
};

