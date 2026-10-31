/**
 * component.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for System Components Catalogue.
 */

export type ComponentCategory =
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
  | 'other';

export type ComponentStatus = 'active' | 'inactive';

export interface SystemComponent {
  id: string;
  componentId: string; // e.g. "CMP-0001"
  name: string;
  category: ComponentCategory;
  manufacturer: string;
  modelNumber: string;
  specification: string;
  unit: string; // e.g. "Nos", "Meters", "Sets", "Rolls"
  description?: string;
  estimatedUnitCost?: number;
  status: ComponentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentFormData {
  name: string;
  category: ComponentCategory;
  manufacturer: string;
  modelNumber: string;
  specification: string;
  unit: string;
  description?: string;
  estimatedUnitCost?: number;
  status: ComponentStatus;
}

export interface ComponentFilters {
  search?: string;
  category?: ComponentCategory | '';
  manufacturer?: string;
  status?: ComponentStatus | '';
  page?: number;
  pageSize?: number;
}

export const COMPONENT_CATEGORY_LABELS: Record<ComponentCategory, string> = {
  solar_panels: 'Solar Panels',
  inverter: 'Inverter',
  battery: 'Battery Storage',
  charge_controller: 'Charge Controller',
  mounting_structure: 'Mounting Structure',
  dc_cables: 'DC Solar Cables',
  ac_cables: 'AC Grid Cables',
  dc_protection: 'DC Protection Devices (SPD/Fuse)',
  ac_protection: 'AC Protection Devices (MCB/RCCB)',
  earthing_equipment: 'Earthing Equipment & Rods',
  connectors_accessories: 'Connectors & Cable Ties',
  other: 'Other Accessories',
};

export const COMPONENT_CATEGORY_COLOURS: Record<ComponentCategory, string> = {
  solar_panels: 'bg-amber-100 text-amber-800',
  inverter: 'bg-blue-100 text-blue-800',
  battery: 'bg-emerald-100 text-emerald-800',
  charge_controller: 'bg-indigo-100 text-indigo-800',
  mounting_structure: 'bg-slate-100 text-slate-800',
  dc_cables: 'bg-orange-100 text-orange-800',
  ac_cables: 'bg-cyan-100 text-cyan-800',
  dc_protection: 'bg-red-100 text-red-800',
  ac_protection: 'bg-purple-100 text-purple-800',
  earthing_equipment: 'bg-teal-100 text-teal-800',
  connectors_accessories: 'bg-lime-100 text-lime-800',
  other: 'bg-gray-100 text-gray-700',
};

