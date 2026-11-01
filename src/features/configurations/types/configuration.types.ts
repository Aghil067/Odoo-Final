/**
 * configuration.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Customer Solar Configurations and Bill of Materials (BOM).
 */

import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';
import type { PhaseType, TemplateComponentItem } from './template.types';
import type { ComponentCategory } from './component.types';

export type ConfigurationStatus =
  | 'draft'
  | 'in_progress'
  | 'ready_for_quotation'
  | 'archived';

export interface ConfigurationComponent extends TemplateComponentItem {
  estimatedLineTotal?: number;
}

export interface ConfigurationActivity {
  id: string;
  type: 'created' | 'template_applied' | 'components_updated' | 'status_changed';
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface SolarConfiguration {
  id: string;
  configurationId: string; // e.g. "CFG-0001"
  configurationName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Site Survey reference (must be approved)
  surveyId: string;
  surveyRef: string; // e.g. "SRV-0001"
  siteLocation: string;
  roofType: string;
  availableRoofAreaSqFt: number;
  recommendedCapacityKw: number;

  // Technical Solar Specifications
  systemType: SystemType;
  ratedCapacity: CapacityOption;
  customCapacity?: string;
  phaseType: PhaseType;
  mountingType?: string;
  tiltAngle?: number;
  azimuth?: string;
  recommendedPanelWattage?: number;

  // Template link
  templateId?: string;
  templateName?: string;

  // Specific components snapshot for this customer
  components: ConfigurationComponent[];
  totalComponentCount: number;
  totalQuantity: number;
  estimatedTotalCost?: number;

  notes?: string;
  discrepancyJustification?: string; // required if differing from survey recommended capacity

  status: ConfigurationStatus;
  activities: ConfigurationActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfigurationData {
  configurationName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  surveyId: string;
  surveyRef: string;
  siteLocation: string;
  roofType: string;
  availableRoofAreaSqFt: number;
  recommendedCapacityKw: number;
  systemType: SystemType;
  ratedCapacity: CapacityOption;
  customCapacity?: string;
  phaseType: PhaseType;
  templateId?: string;
  templateName?: string;
  components: ConfigurationComponent[];
  notes?: string;
  discrepancyJustification?: string;
  status?: ConfigurationStatus;
}

export interface BOMLine {
  itemNumber: number;
  componentId: string;
  componentName: string;
  category: ComponentCategory;
  modelNumber: string;
  specification: string;
  requiredQuantity: number;
  unit: string;
  estimatedUnitCost?: number;
  estimatedLineTotal?: number;
  remarks?: string;
}

export interface BillOfMaterials {
  bomId: string; // e.g. "BOM-0001"
  configurationId: string;
  configurationName: string;
  customerName: string;
  siteLocation: string;
  systemType: SystemType;
  ratedCapacity: string;
  lines: BOMLine[];
  totalItems: number;
  totalQuantity: number;
  totalEstimatedCost: number;
  generatedAt: string;
}

export const CONFIGURATION_STATUS_LABELS: Record<ConfigurationStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  ready_for_quotation: 'Ready for Quotation',
  archived: 'Archived',
};

export const CONFIGURATION_STATUS_COLOURS: Record<ConfigurationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  ready_for_quotation: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export const SYSTEM_TYPE_COLOURS: Record<SystemType, string> = {
  undecided:'bg-slate-50 text-slate-700',
  on_grid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  off_grid: 'bg-amber-50 text-amber-700 border-amber-200',
};


