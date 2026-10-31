/**
 * profitability.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Installation Profitability Analysis in Module M09.
 */

export interface InstallationProfitability {
  installationId: string;
  installationRef: string;
  customerName: string;
  systemCapacity: string;
  systemType?: string;
  installationStatus: string;
  completionDate?: string;

  // Revenue & Collections
  invoiceRevenue: number;
  amountCollected: number;
  outstandingAmount: number;

  // Recorded vs Estimated Costs
  materialCost: number;
  isMaterialCostEstimated: boolean; // true if derived from M03 estimate rather than recorded invoices

  labourCost: number;
  isLabourCostEstimated: boolean;

  transportationCost: number;
  isTransportationCostEstimated: boolean;

  otherRecordedCosts: number;

  totalRecordedCost: number;
  recordedProfit: number;
  profitMarginPercent: number;

  hasAllActuals: boolean;
  notes?: string;
}

