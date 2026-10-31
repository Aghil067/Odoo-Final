/**
 * FinanceCharts.tsx
 * ─────────────────────────────────────────────────────────────
 * Clean responsive financial visualizations for Module M09.
 */

import React from 'react';
import type { MonthlyFinancialSummary } from '../types/financeDashboard.types';

export const MonthlyRevenueExpenseChart: React.FC<{
  data: MonthlyFinancialSummary[];
}> = ({ data }) => {
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.revenue, d.expenses, d.collections]),
    100000
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Monthly Revenue, Expenses & Collections</h3>
          <p className="text-xs text-slate-500">Reconciled cash inflows against business operating costs.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="text-slate-600 font-medium">Billed Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-600 font-medium">Cash Collected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            <span className="text-slate-600 font-medium">Recorded Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
        {data.map((item) => {
          const revHeight = (item.revenue / maxVal) * 100;
          const colHeight = (item.collections / maxVal) * 100;
          const expHeight = (item.expenses / maxVal) * 100;

          return (
            <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div className="w-full flex items-end justify-center gap-1 h-52">
                {/* Revenue Bar */}
                <div
                  style={{ height: `${revHeight}%` }}
                  className="w-1/3 bg-blue-600 rounded-t transition-all group-hover:brightness-110"
                  title={`Revenue: ₹${item.revenue.toLocaleString('en-IN')}`}
                />
                {/* Collection Bar */}
                <div
                  style={{ height: `${colHeight}%` }}
                  className="w-1/3 bg-emerald-500 rounded-t transition-all group-hover:brightness-110"
                  title={`Collected: ₹${item.collections.toLocaleString('en-IN')}`}
                />
                {/* Expense Bar */}
                <div
                  style={{ height: `${expHeight}%` }}
                  className="w-1/3 bg-rose-500 rounded-t transition-all group-hover:brightness-110"
                  title={`Expenses: ₹${item.expenses.toLocaleString('en-IN')}`}
                />
              </div>

              <span className="text-xs font-semibold text-slate-600 mt-2 block">{item.month}</span>

              {/* Tooltip on hover */}
              <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div>Rev: ₹{(item.revenue / 1000).toFixed(0)}k | Col: ₹{(item.collections / 1000).toFixed(0)}k</div>
                <div>Exp: ₹{(item.expenses / 1000).toFixed(0)}k | Profit: ₹{(item.profit / 1000).toFixed(0)}k</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CollectionEfficiencyTrend: React.FC<{
  efficiencyPercent: number;
  totalInvoiced: number;
  totalCollected: number;
  outstanding: number;
}> = ({ efficiencyPercent, totalInvoiced, totalCollected, outstanding }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Payment Collection Efficiency</h3>
        <p className="text-xs text-slate-500">Realized cash receipts vs total invoiced receivables.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Realization Rate</span>
          <span className="font-bold text-base text-emerald-600">{efficiencyPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            style={{ width: `${Math.min(100, efficiencyPercent)}%` }}
            className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
          />
          <div
            style={{ width: `${Math.max(0, 100 - efficiencyPercent)}%` }}
            className="bg-amber-400 h-full rounded-r-full transition-all duration-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Collected to Date</span>
            <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
            <span className="text-[11px] text-amber-700 block">Pending Receivables</span>
            <span className="font-bold text-amber-800 text-sm mt-0.5 block">
              ₹{outstanding.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1">
          Total gross invoiced portfolio: <span className="font-semibold text-slate-600">₹{totalInvoiced.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

