/**
 * warrantyClaimService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Warranty Claims in M07.
 */

import type {
  WarrantyClaim,
  WarrantyClaimFormData,
  WarrantyClaimFilters,
  WarrantyClaimResolution,
  ClaimStatus,
  ClaimEligibilityChecklist,
  EligibilityOutcome,
} from '../types/warrantyClaim.types';
import { MOCK_WARRANTY_CLAIMS } from '../data/mockWarrantyData';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _claimsStore: WarrantyClaim[] = [...MOCK_WARRANTY_CLAIMS];

export const warrantyClaimService = {
  async list(filters: WarrantyClaimFilters = {}): Promise<{
    data: WarrantyClaim[];
    total: number;
  }> {
    await delay();
    let results = [..._claimsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.claimId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          (c.serialNumber && c.serialNumber.toLowerCase().includes(q)) ||
          c.warrantyRef.toLowerCase().includes(q) ||
          c.issueTitle.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    if (filters.priority) {
      results = results.filter((c) => c.priority === filters.priority);
    }

    if (filters.issueCategory) {
      results = results.filter((c) => c.issueCategory === filters.issueCategory);
    }

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<WarrantyClaim | null> {
    await delay();
    return _claimsStore.find((c) => c.id === id || c.claimId === id) || null;
  },

  async getClaimsForWarranty(warrantyId: string): Promise<WarrantyClaim[]> {
    await delay();
    return _claimsStore.filter((c) => c.warrantyId === warrantyId || c.warrantyRef === warrantyId);
  },

  async create(data: WarrantyClaimFormData): Promise<WarrantyClaim> {
    await delay();
    const newId = `clm-${String(_claimsStore.length + 1).padStart(3, '0')}`;
    const newClaimId = `CLM-2026-${String(_claimsStore.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const isDraft = !!data.saveAsDraft;

    const newClaim: WarrantyClaim = {
      id: newId,
      claimId: newClaimId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,

      warrantyId: data.warrantyId,
      warrantyRef: data.warrantyRef,
      productId: data.productId,
      productName: data.productName,
      serialNumber: data.serialNumber,
      installationRef: data.installationRef,

      claimDate: data.issueDate || now.split('T')[0],
      issueCategory: data.issueCategory,
      issueTitle: data.issueTitle,
      detailedDescription: data.detailedDescription,
      priority: data.priority,
      failureSymptoms: data.failureSymptoms,
      equipmentCondition: data.equipmentCondition,
      errorCode: data.errorCode,

      supportingPhotos: data.supportingPhotos || [],
      remarks: data.remarks,

      status: isDraft ? 'submitted' : 'submitted',
      assignedReviewerName: 'Pending Assignment',

      eligibility: {
        checklist: {
          warrantyRecordExists: true,
          warrantyIsActive: true,
          serialNumberMatches: true,
          claimFallsWithinCoveragePeriod: true,
          productMatchesWarranty: true,
          requiredEvidenceAvailable: data.supportingPhotos.length > 0,
        },
        outcome: data.supportingPhotos.length > 0 ? 'eligible' : 'requires_further_review',
        notes: 'Submitted via Warranty Management portal. Awaiting supervisor review.',
      },

      createdAt: now,
      updatedAt: now,
    };

    _claimsStore = [newClaim, ..._claimsStore];
    return newClaim;
  },

  async updateReview(
    id: string,
    reviewData: {
      decision: 'approved' | 'rejected' | 'ineligible' | 'info_requested';
      reviewerId: string;
      reviewerName: string;
      reasonOrRemarks: string;
      checklist: ClaimEligibilityChecklist;
      outcome: EligibilityOutcome;
    }
  ): Promise<WarrantyClaim> {
    await delay();
    const index = _claimsStore.findIndex((c) => c.id === id || c.claimId === id);
    if (index === -1) {
      throw new Error(`Claim not found: ${id}`);
    }

    const current = _claimsStore[index];
    const now = new Date().toISOString();

    let newStatus: ClaimStatus = current.status;
    if (reviewData.decision === 'approved') newStatus = 'approved';
    else if (reviewData.decision === 'rejected') newStatus = 'rejected';
    else if (reviewData.decision === 'ineligible') newStatus = 'ineligible';
    else if (reviewData.decision === 'info_requested') newStatus = 'under_review';

    const updated: WarrantyClaim = {
      ...current,
      status: newStatus,
      assignedReviewerId: reviewData.reviewerId,
      assignedReviewerName: reviewData.reviewerName,
      eligibility: {
        checklist: reviewData.checklist,
        outcome: reviewData.outcome,
        checkedAt: now,
        checkedBy: reviewData.reviewerName,
        notes: reviewData.reasonOrRemarks,
      },
      reviewDecision: {
        decision: reviewData.decision,
        reviewerId: reviewData.reviewerId,
        reviewerName: reviewData.reviewerName,
        decisionDate: now,
        reasonOrRemarks: reviewData.reasonOrRemarks,
      },
      updatedAt: now,
    };

    _claimsStore[index] = updated;
    return updated;
  },

  async recordResolution(id: string, resolution: WarrantyClaimResolution): Promise<WarrantyClaim> {
    await delay();
    const index = _claimsStore.findIndex((c) => c.id === id || c.claimId === id);
    if (index === -1) {
      throw new Error(`Claim not found: ${id}`);
    }

    const current = _claimsStore[index];
    const now = new Date().toISOString();

    const updated: WarrantyClaim = {
      ...current,
      status: resolution.customerConfirmed ? 'resolved' : 'repair_in_progress',
      resolution,
      updatedAt: now,
    };

    _claimsStore[index] = updated;
    return updated;
  },

  async updateStatus(id: string, status: ClaimStatus): Promise<WarrantyClaim> {
    await delay();
    const index = _claimsStore.findIndex((c) => c.id === id || c.claimId === id);
    if (index === -1) {
      throw new Error(`Claim not found: ${id}`);
    }

    const updated: WarrantyClaim = {
      ..._claimsStore[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    _claimsStore[index] = updated;
    return updated;
  },
};

