/**
 * financeDashboard.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript types for Finance Dashboard & Reports in Module M09.
 */

import type { CustomerPayment } from './payment.types';
import type { Expense } from './expense.types';
import type { Invoice } from './invoice.types';

export interface MonthlyFinancialSummary {
  month: string; // e.g. "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"
  revenue: number;
  expenses: number;
  collections: number;
  profit: number;
}

export interface FinanceDashboardMetrics {
  totalInvoicedAmount: number;
  totalAmountCollected: number;
  outstandingCustomerPayments: number;
  totalRecordedExpenses: number;
  technicianPaymentsPending: number;
  installationRevenue: number;
  overallRecordedProfit: number;
  collectionEfficiencyPercent: number;

  monthlyTrend: MonthlyFinancialSummary[];
  recentPayments: CustomerPayment[];
  recentExpenses: Expense[];
  outstandingInvoices: Invoice[];
}

