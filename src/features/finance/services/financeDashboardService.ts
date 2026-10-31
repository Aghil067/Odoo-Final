/**
 * financeDashboardService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Finance Dashboard KPIs & analytics in Module M09.
 */

import type { FinanceDashboardMetrics } from '../types/financeDashboard.types';
import { invoiceService } from './invoiceService';
import { paymentService } from './paymentService';
import { expenseService } from './expenseService';
import { technicianPaymentService } from './technicianPaymentService';
import { MOCK_MONTHLY_SUMMARY } from '../data/mockFinanceData';

export const financeDashboardService = {
  /**
   * Aggregate dynamic metrics across financial ledgers.
   */
  async getMetrics(): Promise<FinanceDashboardMetrics> {
    const [invRes, payRes, expRes, techRes] = await Promise.all([
      invoiceService.list(),
      paymentService.list(),
      expenseService.list(),
      technicianPaymentService.list(),
    ]);

    const invoices = invRes.data;
    const payments = payRes.data;
    const expenses = expRes.data;
    const techPayments = techRes.data;

    const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalAmountCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingCustomerPayments = invoices.reduce((sum, inv) => sum + inv.remainingBalance, 0);

    const totalRecordedExpenses = expenses
      .filter((e) => e.status === 'approved' || e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const technicianPaymentsPending = techPayments.reduce(
      (sum, tp) => sum + tp.pendingAmount,
      0
    );

    const installationRevenue = invoices
      .filter((inv) => !!inv.installationId)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Actual recorded profit = total amount collected minus recorded actual expenses & technician disbursements
    const totalTechPaid = techPayments.reduce((sum, tp) => sum + tp.paidAmount, 0);
    const overallRecordedProfit = totalAmountCollected - (totalRecordedExpenses + totalTechPaid);

    const collectionEfficiencyPercent =
      totalInvoicedAmount > 0
        ? Math.round((totalAmountCollected / totalInvoicedAmount) * 100)
        : 0;

    const outstandingInvoices = invoices.filter(
      (inv) => inv.status === 'overdue' || inv.status === 'partially_paid' || inv.status === 'issued'
    );

    return {
      totalInvoicedAmount,
      totalAmountCollected,
      outstandingCustomerPayments,
      totalRecordedExpenses,
      technicianPaymentsPending,
      installationRevenue,
      overallRecordedProfit,
      collectionEfficiencyPercent,
      monthlyTrend: MOCK_MONTHLY_SUMMARY,
      recentPayments: payments.slice(0, 5),
      recentExpenses: expenses.slice(0, 5),
      outstandingInvoices: outstandingInvoices.slice(0, 5),
    };
  },
};

