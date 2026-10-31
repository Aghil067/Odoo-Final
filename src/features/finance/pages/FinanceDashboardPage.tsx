/**
 * FinanceDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Executive Finance & Accounting Dashboard in Module M09.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  Receipt,
  HardHat,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Printer,
} from 'lucide-react';
import type { FinanceDashboardMetrics } from '../types/financeDashboard.types';
import type { Invoice } from '../types/invoice.types';
import type { CustomerPayment } from '../types/payment.types';
import { financeDashboardService } from '../services/financeDashboardService';
import { paymentService } from '../services/paymentService';
import { MonthlyRevenueExpenseChart, CollectionEfficiencyTrend } from '../components/FinanceCharts';
import { InvoiceStatusBadge } from '../components/FinanceStatusBadge';
import { PaymentRecordModal } from '../components/PaymentRecordModal';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal';
import { InvoicePrintPreviewModal } from '../components/InvoicePrintPreviewModal';

export const FinanceDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<FinanceDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<CustomerPayment | null>(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await financeDashboardService.getMetrics();
      setMetrics(res);
    } catch (err) {
      console.error('Failed to load finance dashboard metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async () => {
    await loadData();
  };

  if (isLoading || !metrics) {
    return (
      <div className="text-center py-24 text-xs text-slate-400">
        Loading SunPower Solutions financial executive dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-green-600 rounded-sm inline-block" />
            Finance & Accounting Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Real-time invoices, cash receipts, operating expenses, technician disbursements & installation profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/finance/invoices/new"
            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Core KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Invoiced */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Invoiced
          </span>
          <div className="text-lg font-bold font-mono text-slate-900">
            ₹{(metrics.totalInvoicedAmount / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-slate-500">Gross billing</div>
        </div>

        {/* Collected */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Amount Collected
          </span>
          <div className="text-lg font-bold font-mono text-emerald-800">
            ₹{(metrics.totalAmountCollected / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Realized receipts</div>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm space-y-1 bg-rose-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
            Outstanding Due
          </span>
          <div className="text-lg font-bold font-mono text-rose-800">
            ₹{(metrics.outstandingCustomerPayments / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-rose-500 font-medium">Pending collections</div>
        </div>

        {/* Recorded Expenses */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm space-y-1 bg-purple-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Recorded Expenses
          </span>
          <div className="text-lg font-bold font-mono text-purple-800">
            ₹{(metrics.totalRecordedExpenses / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-purple-600 font-medium">Actual operating costs</div>
        </div>

        {/* Technician Pending */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Tech Payouts Pending
          </span>
          <div className="text-lg font-bold font-mono text-amber-800">
            ₹{(metrics.technicianPaymentsPending / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-amber-600 font-medium">Field labour liabilities</div>
        </div>

        {/* Installation Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-1 bg-blue-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Project Revenue
          </span>
          <div className="text-lg font-bold font-mono text-blue-800">
            ₹{(metrics.installationRevenue / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-blue-600 font-medium">M05 Solar Projects</div>
        </div>

        {/* Recorded Profit */}
        <div className="bg-white p-3.5 rounded-xl border border-green-300 shadow-sm space-y-1 bg-green-50/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 block">
            Recorded Profit
          </span>
          <div className="text-lg font-bold font-mono text-green-800">
            ₹{(metrics.overallRecordedProfit / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-green-700 font-medium">Net cash realization</div>
        </div>
      </div>

      {/* Visual Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyRevenueExpenseChart data={metrics.monthlyTrend} />
        </div>
        <div>
          <CollectionEfficiencyTrend
            efficiencyPercent={metrics.collectionEfficiencyPercent}
            totalInvoiced={metrics.totalInvoicedAmount}
            totalCollected={metrics.totalAmountCollected}
            outstanding={metrics.outstandingCustomerPayments}
          />
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/finance/invoices"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span>Invoices</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to="/finance/payments"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payments</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to="/finance/expenses"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>Expenses</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to="/finance/technician-payments"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-blue-600" />
            <span>Tech Payouts</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to="/finance/profitability"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Profitability</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to="/finance/subsidies"
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-600" />
            <span>Subsidies</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* 2-Columns: Urgent Outstanding Invoices & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                Pending & Overdue Receivables
              </h3>
              <p className="text-xs text-slate-500">Invoices requiring payment collection follow-up.</p>
            </div>
            <Link to="/finance/invoices" className="text-xs text-green-700 hover:underline font-semibold">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {metrics.outstandingInvoices.length === 0 ? (
              <p className="text-center py-6 text-slate-400">All customer invoices are cleared.</p>
            ) : (
              metrics.outstandingInvoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <InvoiceStatusBadge status={inv.status} size="sm" />
                    </div>
                    <p className="font-medium text-slate-800">{inv.customerName}</p>
                    <p className="text-[11px] text-slate-500">Due Date: {inv.dueDate}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-bold text-rose-700 text-sm">
                      ₹{inv.remainingBalance.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActivePaymentInvoice(inv)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px]"
                      >
                        Record Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePrintInvoice(inv)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Recent Payment Collections
              </h3>
              <p className="text-xs text-slate-500">Realized customer deposits & RTGS transfers.</p>
            </div>
            <Link to="/finance/payments" className="text-xs text-green-700 hover:underline font-semibold">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {metrics.recentPayments.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No payment receipts recorded yet.</p>
            ) : (
              metrics.recentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800">{p.receiptNumber}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800">{p.customerName}</p>
                    <p className="text-[11px] text-slate-500">
                      Inv: <span className="font-mono">{p.invoiceNumber}</span> • {p.paymentDate}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveReceipt(p)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activePaymentInvoice && (
        <PaymentRecordModal
          invoice={activePaymentInvoice}
          isOpen={true}
          onClose={() => setActivePaymentInvoice(null)}
          onSubmit={async (data) => {
            await paymentService.recordPayment(data);
            await handleRecordPayment();
          }}
        />
      )}

      {activeReceipt && (
        <PaymentReceiptModal
          payment={activeReceipt}
          isOpen={true}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {activePrintInvoice && (
        <InvoicePrintPreviewModal
          invoice={activePrintInvoice}
          isOpen={true}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}
    </div>
  );
};
