/**
 * materialReadinessService.ts
 * ─────────────────────────────────────────────────────────────
 * Cross-references M03 BOM requirements with M04 inventory stock levels
 * and material issue records.
 */

import type { InstallationMaterial, MaterialReadinessStatus } from '../types/installation.types';
import { stockService } from '../../inventory/services/stockService';
import { issueService } from '../../inventory/services/issueService';

export interface MaterialReadinessReport {
  overallStatus: MaterialReadinessStatus;
  totalRequiredComponents: number;
  fullyAvailableCount: number;
  partiallyAvailableCount: number;
  unavailableCount: number;
  issuedCount: number;
  items: InstallationMaterial[];
}

export const materialReadinessService = {
  /**
   * Evaluates material readiness for a given list of installation materials,
   * querying M04 stock balances and issue notes.
   */
  async evaluateReadiness(
    installationId: string,
    materials: InstallationMaterial[]
  ): Promise<MaterialReadinessReport> {
    try {
      // 1. Check if any stock issues exist for this installation
      const issueResponse = await issueService.list();
      const linkedIssues = issueResponse.data.filter(
        (iss) => iss.referenceId === installationId || (iss.notes && iss.notes.includes(installationId))
      );
      const isIssued = linkedIssues.some((iss) => iss.status === 'issued');

      // 2. Fetch inventory overview
      const stockResponse = await stockService.getStockOverview();
      const stockBalances = stockResponse.data;

      let availableCount = 0;
      let partialCount = 0;
      let unavailableCount = 0;
      let issuedCount = 0;

      const updatedMaterials: InstallationMaterial[] = materials.map((mat) => {
        // Find matching stock item by product name or SKU/ID
        const stockItem = stockBalances.find(
          (s) =>
            s.productId === mat.productId ||
            s.productName.toLowerCase().includes(mat.productName.toLowerCase()) ||
            mat.productName.toLowerCase().includes(s.productName.toLowerCase())
        );

        const currentStock = stockItem ? stockItem.availableQuantity : (mat.availableQuantity ?? 0);
        let status: MaterialReadinessStatus = 'not_checked';

        if (isIssued || (mat.issuedQuantity && mat.issuedQuantity >= mat.requiredQuantity)) {
          status = 'issued';
          issuedCount++;
        } else if (currentStock >= mat.requiredQuantity) {
          status = 'available';
          availableCount++;
        } else if (currentStock > 0) {
          status = 'partially_available';
          partialCount++;
        } else {
          status = 'unavailable';
          unavailableCount++;
        }

        return {
          ...mat,
          availableQuantity: currentStock,
          materialStatus: status,
        };
      });

      let overallStatus: MaterialReadinessStatus = 'not_checked';
      if (updatedMaterials.length === 0) {
        overallStatus = 'not_checked';
      } else if (isIssued || issuedCount === updatedMaterials.length) {
        overallStatus = 'issued';
      } else if (availableCount === updatedMaterials.length) {
        overallStatus = 'available';
      } else if (availableCount > 0 || partialCount > 0) {
        overallStatus = 'partially_available';
      } else {
        overallStatus = 'unavailable';
      }

      return {
        overallStatus,
        totalRequiredComponents: updatedMaterials.length,
        fullyAvailableCount: availableCount,
        partiallyAvailableCount: partialCount,
        unavailableCount,
        issuedCount,
        items: updatedMaterials,
      };
    } catch {
      // Fallback gracefully
      return {
        overallStatus: 'not_checked',
        totalRequiredComponents: materials.length,
        fullyAvailableCount: 0,
        partiallyAvailableCount: 0,
        unavailableCount: 0,
        issuedCount: 0,
        items: materials,
      };
    }
  },
};
