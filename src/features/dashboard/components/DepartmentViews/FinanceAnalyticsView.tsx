/**
 * FinanceAnalyticsView.tsx
 * ─────────────────────────────────────────────────────────────
 * Financial Performance & Profitability Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, Receipt, DollarSign } from 'lucide-react';
import type { SystemKPIs, MonthlyTrendData } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { MonthlyRevenueExpenseChart } from '../../../finance/components/FinanceCharts';

interface FinanceAnalyticsViewProps {
  kpis: SystemKPIs;
  trends: MonthlyTrendData[];
}

export const FinanceAnalyticsView: React.FC<FinanceAnalyticsViewProps> = ({
  kpis,
  trends,
}) => {
  const financeMonthlyData = trends.map((t) => ({
    month: t.month,
    revenue: t.revenue,
    expenses: t.expenses,
    collections: t.collections,
    profit: t.revenue - t.expenses,
  }));

  return (
    <div className="space-y-6">
      {/* Finance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Total Invoiced"
          value={`₹${(kpis.totalInvoiced / 1000).toFixed(0)}k`}
          subtitle="Gross sales billing"
          icon={CreditCard}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/finance/invoices"
        />

        <KPICard
          title="Total Collected"
          value={`₹${(kpis.totalCollected / 1000).toFixed(0)}k`}
          subtitle="Verified incoming cash receipts"
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkPath="/finance/payments"
          trendText="Realized cash flow"
          trendColor="text-emerald-700"
        />

        <KPICard
          title="Outstanding Receivables"
          value={`₹${(kpis.outstandingPayments / 1000).toFixed(0)}k`}
          subtitle="Pending milestone collections"
          icon={DollarSign}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          linkPath="/finance/invoices"
          trendText="Customer aging"
          trendColor="text-rose-600"
        />

        <KPICard
          title="Recorded Expenses"
          value={`₹${(kpis.totalRecordedExpenses / 1000).toFixed(0)}k`}
          subtitle="Operating, labour & logistics costs"
          icon={Receipt}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          linkPath="/finance/expenses"
          trendText="Reconciled actuals"
          trendColor="text-purple-700"
        />
      </div>

      {/* Monthly Financial Trend Chart from M09 */}
      <MonthlyRevenueExpenseChart data={financeMonthlyData} />

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-bold text-slate-900 block">Overall Realized Cash Margin</span>
          <div className="text-2xl font-bold font-mono text-green-700">
            ₹{(kpis.overallRecordedProfit / 1000).toFixed(0)}k
          </div>
          <p className="text-slate-500">
            Total realized customer payments minus approved supplier and contractor disbursements.
          </p>
          <div className="pt-2">
            <Link to="/finance/profitability" className="text-green-700 font-semibold hover:underline">
              Inspect Job Costing (M09) &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-bold text-slate-900 block">Technician Payouts Outstanding</span>
          <div className="text-2xl font-bold font-mono text-amber-700">
            ₹{(kpis.technicianPaymentsPending / 1000).toFixed(1)}k
          </div>
          <p className="text-slate-500">
            Approved and submitted field installation labour claims pending final NEFT release.
          </p>
          <div className="pt-2">
            <Link to="/finance/technician-payments" className="text-green-700 font-semibold hover:underline">
              Review Payouts &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="font-bold text-slate-900 block">Solar Subsidy Claims Status</span>
          <div className="text-2xl font-bold font-mono text-cyan-700">4 Tracked</div>
          <p className="text-slate-500">
            PM Surya Ghar Muft Bijli Yojana Central Financial Assistance (CFA) applications.
          </p>
          <div className="pt-2">
            <Link to="/finance/subsidies" className="text-green-700 font-semibold hover:underline">
              Track Subsidies &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

