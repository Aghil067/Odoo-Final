/**
 * warrantyService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Equipment Warranty Records in M07.
 */

import type {
  WarrantyRecord,
  WarrantyRegistrationFormData,
  WarrantyFilters,
  WarrantyDashboardMetrics,
} from '../types/warranty.types';
import { MOCK_WARRANTIES, MOCK_WARRANTY_CLAIMS } from '../data/mockWarrantyData';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _warrantiesStore: WarrantyRecord[] = [...MOCK_WARRANTIES];

export const warrantyService = {
  async list(filters: WarrantyFilters = {}): Promise<{
    data: WarrantyRecord[];
    total: number;
  }> {
    await delay();
    let results = [..._warrantiesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (w) =>
          w.warrantyId.toLowerCase().includes(q) ||
          w.customerName.toLowerCase().includes(q) ||
          w.productName.toLowerCase().includes(q) ||
          (w.serialNumber && w.serialNumber.toLowerCase().includes(q)) ||
          (w.installationRef && w.installationRef.toLowerCase().includes(q)) ||
          w.policyName.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((w) => w.status === filters.status);
    }

    if (filters.productCategory) {
      results = results.filter((w) => w.productCategory === filters.productCategory);
    }

    if (filters.manufacturer) {
      results = results.filter((w) =>
        w.manufacturer.toLowerCase().includes(filters.manufacturer!.toLowerCase())
      );
    }

    if (filters.expiringDays) {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(now.getDate() + filters.expiringDays);

      results = results.filter((w) => {
        if (!w.warrantyExpiryDate) return false;
        const expiry = new Date(w.warrantyExpiryDate);
        return expiry >= now && expiry <= cutoff;
      });
    }

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<WarrantyRecord | null> {
    await delay();
    return _warrantiesStore.find((w) => w.id === id || w.warrantyId === id) || null;
  },

  async register(data: WarrantyRegistrationFormData): Promise<WarrantyRecord> {
    await delay();
    const newId = `war-${String(_warrantiesStore.length + 1).padStart(3, '0')}`;
    const newWarrantyId = `WAR-2026-${String(_warrantiesStore.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const isDraft = !!data.saveAsDraft;

    // Check activation eligibility
    const missingEvidence: string[] = [];
    if (data.activationBasis === 'installation_date' && !data.installationDate) {
      missingEvidence.push('Installation sign-off completion date');
    }
    if (data.activationBasis === 'delivery_date' && !data.deliveryDate) {
      missingEvidence.push('Delivery receipt confirmation');
    }
    if (data.documents.length === 0) {
      missingEvidence.push('Supporting proof document (invoice, delivery, or handover slip)');
    }

    const newWarranty: WarrantyRecord = {
      id: newId,
      warrantyId: newWarrantyId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,

      installationId: data.installationId,
      installationRef: data.installationRef,
      siteAddress: data.siteAddress,
      siteCity: data.siteCity,
      siteState: data.siteState,
      deliveryRef: data.deliveryRef,
      deliveryDate: data.deliveryDate,
      installationDate: data.installationDate,

      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      productCategory: data.productCategory,
      manufacturer: data.manufacturer,
      modelNumber: data.modelNumber,
      serialNumber: data.serialNumber,
      serialNumberId: data.serialNumberId,

      policyId: data.policyId,
      policyRef: data.policyRef,
      policyName: data.policyName,
      coverageType: data.coverageType,
      durationValue: data.durationValue,
      durationUnit: data.durationUnit,
      activationBasis: data.activationBasis,

      warrantyStartDate: data.warrantyStartDate,
      warrantyExpiryDate: data.warrantyExpiryDate,
      isDateOverridden: data.isDateOverridden,
      overrideRemarks: data.overrideRemarks,

      status: isDraft ? 'draft' : missingEvidence.length === 0 ? 'pending_activation' : 'pending_activation',
      activationEligibility: {
        isEligible: missingEvidence.length === 0,
        missingEvidence,
        remarks: missingEvidence.length === 0 ? 'Ready for supervisor activation review.' : 'Pending evidence.',
      },

      documents: data.documents,
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          eventType: 'registered',
          title: isDraft ? 'Warranty Draft Saved' : 'Warranty Registered',
          description: `Registered under policy ${data.policyName}`,
          timestamp: now,
          performedBy: 'Current User',
        },
      ],
      remarks: data.remarks,
      createdAt: now,
      updatedAt: now,
    };

    _warrantiesStore = [newWarranty, ..._warrantiesStore];
    return newWarranty;
  },

  async activate(id: string, activatedBy = 'Admin User'): Promise<WarrantyRecord> {
    await delay();
    const index = _warrantiesStore.findIndex((w) => w.id === id || w.warrantyId === id);
    if (index === -1) {
      throw new Error(`Warranty record not found with ID: ${id}`);
    }

    const current = _warrantiesStore[index];
    const now = new Date().toISOString();

    const updated: WarrantyRecord = {
      ...current,
      status: 'active',
      activatedAt: now,
      activatedBy,
      activationEligibility: {
        isEligible: true,
        missingEvidence: [],
        remarks: `Activated by ${activatedBy} on ${new Date().toLocaleDateString('en-IN')}`,
      },
      activityTimeline: [
        ...current.activityTimeline,
        {
          id: `act-${Date.now()}`,
          eventType: 'activated',
          title: 'Warranty Activated',
          description: `Coverage initiated based on ${current.activationBasis.replace('_', ' ')}. Coverage runs until ${current.warrantyExpiryDate}.`,
          timestamp: now,
          performedBy: activatedBy,
        },
      ],
      updatedAt: now,
    };

    _warrantiesStore[index] = updated;
    return updated;
  },

  async suspend(id: string, reason: string): Promise<WarrantyRecord> {
    await delay();
    const index = _warrantiesStore.findIndex((w) => w.id === id || w.warrantyId === id);
    if (index === -1) {
      throw new Error(`Warranty not found: ${id}`);
    }

    const current = _warrantiesStore[index];
    const now = new Date().toISOString();

    const updated: WarrantyRecord = {
      ...current,
      status: 'suspended',
      suspendedAt: now,
      suspensionReason: reason,
      activityTimeline: [
        ...current.activityTimeline,
        {
          id: `act-${Date.now()}`,
          eventType: 'suspended',
          title: 'Warranty Suspended',
          description: reason,
          timestamp: now,
          performedBy: 'Service Manager',
        },
      ],
      updatedAt: now,
    };

    _warrantiesStore[index] = updated;
    return updated;
  },

  async resume(id: string): Promise<WarrantyRecord> {
    await delay();
    const index = _warrantiesStore.findIndex((w) => w.id === id || w.warrantyId === id);
    if (index === -1) {
      throw new Error(`Warranty not found: ${id}`);
    }

    const current = _warrantiesStore[index];
    const now = new Date().toISOString();

    const updated: WarrantyRecord = {
      ...current,
      status: 'active',
      suspendedAt: undefined,
      suspensionReason: undefined,
      activityTimeline: [
        ...current.activityTimeline,
        {
          id: `act-${Date.now()}`,
          eventType: 'resumed',
          title: 'Warranty Reinstated',
          description: 'Warranty restored to active status following inspection clearance.',
          timestamp: now,
          performedBy: 'Service Manager',
        },
      ],
      updatedAt: now,
    };

    _warrantiesStore[index] = updated;
    return updated;
  },

  async getExpiring(days = 60): Promise<WarrantyRecord[]> {
    await delay();
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + days);

    return _warrantiesStore.filter((w) => {
      if (!w.warrantyExpiryDate) return false;
      const exp = new Date(w.warrantyExpiryDate);
      return exp >= now && exp <= cutoff;
    });
  },

  async getDashboardMetrics(): Promise<WarrantyDashboardMetrics> {
    await delay();
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const totalRegistered = _warrantiesStore.length;
    const activeCount = _warrantiesStore.filter((w) => w.status === 'active').length;
    const expiredCount = _warrantiesStore.filter((w) => w.status === 'expired').length;

    const expiringSoonCount = _warrantiesStore.filter((w) => {
      if (!w.warrantyExpiryDate) return false;
      const exp = new Date(w.warrantyExpiryDate);
      return w.status === 'expiring_soon' || (exp >= now && exp <= thirtyDaysAhead && w.status === 'active');
    }).length;

    const pendingClaimsCount = MOCK_WARRANTY_CLAIMS.filter(
      (c) => c.status === 'submitted' || c.status === 'under_review'
    ).length;

    const approvedClaimsCount = MOCK_WARRANTY_CLAIMS.filter((c) => c.status === 'approved').length;

    const categoryMap = new Map<string, { count: number; active: number }>();
    for (const w of _warrantiesStore) {
      const existing = categoryMap.get(w.productCategory) || { count: 0, active: 0 };
      existing.count += 1;
      if (w.status === 'active') existing.active += 1;
      categoryMap.set(w.productCategory, existing);
    }

    const categoryDistribution = Array.from(categoryMap.entries()).map(([cat, val]) => ({
      category: cat as any,
      count: val.count,
      activeCount: val.active,
    }));

    return {
      totalRegistered,
      activeCount,
      expiredCount,
      expiringSoonCount,
      pendingClaimsCount,
      approvedClaimsCount,
      categoryDistribution,
    };
  },
};

