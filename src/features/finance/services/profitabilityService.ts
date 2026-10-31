/**
 * profitabilityService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Installation Profitability in Module M09.
 */

import type { InstallationProfitability } from '../types/profitability.types';
import { MOCK_PROFITABILITY } from '../data/mockFinanceData';

let profitabilityStore: InstallationProfitability[] = [...MOCK_PROFITABILITY];

export interface ProfitabilityFilters {
  search?: string;
  installationStatus?: string;
  onlyReconciledActuals?: boolean;
  minMargin?: number;
}

export const profitabilityService = {
  /**
   * List profitability records with multi-attribute filtering.
   */
  async list(filters?: ProfitabilityFilters): Promise<{ data: InstallationProfitability[]; total: number }> {
    let result = [...profitabilityStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.installationRef.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.systemCapacity.toLowerCase().includes(q)
      );
    }

    if (filters.installationStatus && filters.installationStatus !== 'all') {
      result = result.filter((p) => p.installationStatus === filters.installationStatus);
    }

    if (filters.onlyReconciledActuals) {
      result = result.filter((p) => p.hasAllActuals);
    }

    if (filters.minMargin !== undefined) {
      result = result.filter((p) => p.profitMarginPercent >= filters.minMargin!);
    }

    return { data: result, total: result.length };
  },

  /**
   * Get single profitability record by installation ID or Ref.
   */
  async getByInstallationId(id: string): Promise<InstallationProfitability | null> {
    const found = profitabilityStore.find(
      (p) => p.installationId === id || p.installationRef === id
    );
    return found ? { ...found } : null;
  },
};

