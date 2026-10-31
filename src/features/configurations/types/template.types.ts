/**
 * template.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for System Templates.
 */

import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';
import type { ComponentCategory } from './component.types';

export type TemplateStatus = 'draft' | 'active' | 'inactive';
export type PhaseType = 'single_phase' | 'three_phase';

export interface TemplateComponentItem {
  id: string; // unique item id inside template
  componentId: string; // reference to SystemComponent
  name: string;
  category: ComponentCategory;
  modelNumber: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedUnitCost?: number;
  remarks?: string;
}

export interface SystemTemplate {
  id: string;
  templateId: string; // e.g. "TPL-0001"
  templateName: string; // e.g. "3 kW On-grid Residential Standard"
  templateCode: string; // e.g. "ONG-3KW-1PH"
  description?: string;
  systemType: SystemType;
  ratedCapacity: CapacityOption;
  customCapacity?: string;
  phaseType: PhaseType;
  status: TemplateStatus;
  components: TemplateComponentItem[];
  estimatedTotalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  templateName: string;
  templateCode: string;
  description?: string;
  systemType: SystemType;
  ratedCapacity: CapacityOption;
  customCapacity?: string;
  phaseType: PhaseType;
  status: TemplateStatus;
  components: TemplateComponentItem[];
}

export interface TemplateFilters {
  search?: string;
  systemType?: SystemType | '';
  ratedCapacity?: CapacityOption | '';
  status?: TemplateStatus | '';
  page?: number;
  pageSize?: number;
}

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
};

export const TEMPLATE_STATUS_COLOURS: Record<TemplateStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  single_phase: 'Single Phase (230V)',
  three_phase: 'Three Phase (415V)',
};

