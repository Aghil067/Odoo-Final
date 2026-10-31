/**
 * warrantyPolicy.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Warranty Policies in M07.
 */

export type WarrantyCoverageType = 'manufacturer' | 'company' | 'extended';

export type WarrantyActivationBasis = 'delivery_date' | 'installation_date' | 'other_approved_date';

export type PolicyStatus = 'draft' | 'active' | 'inactive';

export type DurationUnit = 'months' | 'years';

export type WarrantyProductCategory =
  | 'solar_panels'
  | 'inverter'
  | 'battery'
  | 'charge_controller'
  | 'mounting_hardware'
  | 'electrical_accessories'
  | 'monitoring';

export interface WarrantyPolicy {
  id: string;
  policyId: string; // e.g. "POL-2026-001"
  policyCode: string; // e.g. "POL-PV-20Y"
  policyName: string; // e.g. "Tier-1 Solar PV Module 20-Year Manufacturer Warranty"
  description: string;
  productCategory: WarrantyProductCategory;
  applicableProductId?: string; // Optional specific product or 'all'
  applicableProductName?: string;
  manufacturer: string;
  modelNumber?: string;

  // Coverage
  durationValue: number; // e.g. 20 or 2
  durationUnit: DurationUnit; // 'years' | 'months'
  coverageType: WarrantyCoverageType;
  activationBasis: WarrantyActivationBasis;
  coverageDescription: string;
  exclusions: string;
  termsAndConditions: string;

  // Policy rules
  isTransferable: boolean;
  isProofOfPurchaseRequired: boolean;
  isSerialNumberMandatory: boolean;
  isInstallationProofRequired: boolean;
  coversReplacement: boolean;
  coversRepair: boolean;

  // Status & Metadata
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyPolicyFormData {
  policyCode: string;
  policyName: string;
  description: string;
  productCategory: WarrantyProductCategory;
  applicableProductId?: string;
  applicableProductName?: string;
  manufacturer: string;
  modelNumber?: string;
  durationValue: number;
  durationUnit: DurationUnit;
  coverageType: WarrantyCoverageType;
  activationBasis: WarrantyActivationBasis;
  coverageDescription: string;
  exclusions: string;
  termsAndConditions: string;
  isTransferable: boolean;
  isProofOfPurchaseRequired: boolean;
  isSerialNumberMandatory: boolean;
  isInstallationProofRequired: boolean;
  coversReplacement: boolean;
  coversRepair: boolean;
  status: PolicyStatus;
}

export interface WarrantyPolicyFilters {
  search?: string;
  productCategory?: string;
  coverageType?: WarrantyCoverageType;
  status?: PolicyStatus;
}

export const COVERAGE_TYPE_LABELS: Record<WarrantyCoverageType, string> = {
  manufacturer: 'Manufacturer Warranty',
  company: 'Company Warranty',
  extended: 'Extended Warranty',
};

export const COVERAGE_TYPE_COLOURS: Record<WarrantyCoverageType, { bg: string; text: string; border: string }> = {
  manufacturer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  company: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  extended: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export const ACTIVATION_BASIS_LABELS: Record<WarrantyActivationBasis, string> = {
  delivery_date: 'Delivery Date',
  installation_date: 'Installation Date',
  other_approved_date: 'Other Approved Date',
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
};

export const POLICY_STATUS_COLOURS: Record<PolicyStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  inactive: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
};

