/**
 * warranty.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Equipment Warranties in M07.
 */

import type {
  WarrantyActivationBasis,
  WarrantyCoverageType,
  WarrantyProductCategory,
} from './warrantyPolicy.types';

export type WarrantyStatus =
  | 'draft'
  | 'pending_activation'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'suspended'
  | 'cancelled';

export type WarrantyDocumentType =
  | 'purchase_proof'
  | 'delivery_proof'
  | 'installation_proof'
  | 'other';

export interface WarrantyDocument {
  id: string;
  documentType: WarrantyDocumentType;
  name: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy?: string;
  remarks?: string;
}

export interface WarrantyActivity {
  id: string;
  eventType:
    | 'registered'
    | 'submitted_activation'
    | 'activated'
    | 'suspended'
    | 'resumed'
    | 'claim_filed'
    | 'expired'
    | 'cancelled';
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
  metadata?: Record<string, string>;
}

export interface WarrantyRecord {
  id: string;
  warrantyId: string; // e.g. "WAR-2026-001"

  // Customer (M01)
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Installation Reference (M05)
  installationId?: string;
  installationRef?: string;
  siteAddress?: string;
  siteCity?: string;
  siteState?: string;
  installationStatus?: string;

  // Delivery Reference
  deliveryRef?: string;
  deliveryDate?: string;
  installationDate?: string;

  // Equipment & Serial (M04)
  productId: string;
  productName: string;
  sku: string;
  productCategory: WarrantyProductCategory;
  manufacturer: string;
  modelNumber: string;
  serialNumber?: string;
  serialNumberId?: string;

  // Policy Reference
  policyId: string;
  policyRef: string;
  policyName: string;
  coverageType: WarrantyCoverageType;
  durationValue: number;
  durationUnit: 'months' | 'years';
  activationBasis: WarrantyActivationBasis;
  coverageDescription?: string;
  exclusions?: string;

  // Dates & Status
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  isDateOverridden: boolean;
  overrideRemarks?: string;

  status: WarrantyStatus;
  activationEligibility: {
    isEligible: boolean;
    missingEvidence: string[];
    remarks?: string;
  };

  activatedAt?: string;
  activatedBy?: string;
  suspendedAt?: string;
  suspensionReason?: string;

  documents: WarrantyDocument[];
  activityTimeline: WarrantyActivity[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyRegistrationFormData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  installationId?: string;
  installationRef?: string;
  siteAddress?: string;
  siteCity?: string;
  siteState?: string;
  deliveryRef?: string;
  deliveryDate?: string;
  installationDate?: string;

  productId: string;
  productName: string;
  sku: string;
  productCategory: WarrantyProductCategory;
  manufacturer: string;
  modelNumber: string;
  serialNumber?: string;
  serialNumberId?: string;

  policyId: string;
  policyRef: string;
  policyName: string;
  coverageType: WarrantyCoverageType;
  durationValue: number;
  durationUnit: 'months' | 'years';
  activationBasis: WarrantyActivationBasis;

  warrantyStartDate: string;
  warrantyExpiryDate: string;
  isDateOverridden: boolean;
  overrideRemarks?: string;

  documents: WarrantyDocument[];
  remarks?: string;
  saveAsDraft?: boolean;
}

export interface WarrantyFilters {
  search?: string;
  productCategory?: string;
  status?: WarrantyStatus;
  manufacturer?: string;
  expiringDays?: number; // 30, 60, 90
  startDateFrom?: string;
  startDateTo?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
}

export interface WarrantyDashboardMetrics {
  totalRegistered: number;
  activeCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  pendingClaimsCount: number;
  approvedClaimsCount: number;
  categoryDistribution: {
    category: WarrantyProductCategory;
    count: number;
    activeCount: number;
  }[];
}

export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  draft: 'Draft',
  pending_activation: 'Pending Activation',
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
};

export const WARRANTY_STATUS_COLOURS: Record<
  WarrantyStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  pending_activation: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  expiring_soon: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  expired: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  suspended: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
};

