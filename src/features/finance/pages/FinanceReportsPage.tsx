/**
 * FinanceReportsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Financial Reports & Analytical Statements in Module M09.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  CreditCard,
  Receipt,
  HardHat,
  TrendingUp,
  Award,
  Download,
} from 'lucide-react';
import type { Invoice } from '../types/invoice.types';
import type { CustomerPayment } from '../types/payment.types';
import type { Expense } from '../types/expense.types';
import type { TechnicianPaymentRecord } from '../types/technicianPayment.types';
import type { InstallationProfitability } from '../types/profitability.types';
import type { SubsidyApplication } from '../types/subsidy.types';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { expenseService } from '../services/expenseService';
import { technicianPaymentService } from '../services/technicianPaymentService';
import { profitabilityService } from '../services/profitabilityService';
import { subsidyService } from '../services/subsidyService';
import { MonthlyRevenueExpenseChart } from '../components/FinanceCharts';
import { MOCK_MONTHLY_SUMMARY } from '../data/mockFinanceData';

type ReportTab =
  | 'revenue'
  | 'expenses'
  | 'collections'
  | 'outstanding'
  | 'technicians'
  | 'profitability'
  | 'subsidies';

export const FinanceReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [techPayments, setTechPayments] = useState<TechnicianPaymentRecord[]>([]);
  const [profitability, setProfitability] = useState<InstallationProfitability[]>([]);
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllData() {
      try {
        setIsLoading(true);
        const [invRes, payRes, expRes, techRes, profRes, subRes] = await Promise.all([
          invoiceService.list(),
          paymentService.list(),
          expenseService.list(),
          technicianPaymentService.list(),
          profitabilityService.list(),
          subsidyService.list(),
        ]);

        setInvoices(invRes.data);
        setPayments(payRes.data);
        setExpenses(expRes.data);
        setTechPayments(techRes.data);
        setProfitability(profRes.data);
        setSubsidies(subRes.data);
      } catch (err) {
        console.error('Failed to load reports data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, []);

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.remainingBalance, 0);
  const totalTechPaid = techPayments.reduce((s, t) => s + t.paidAmount, 0);

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'revenue', label: 'Revenue Statement', icon: FileText },
    { id: 'collections', label: 'Payment Collections', icon: CreditCard },
    { id: 'expenses', label: 'Expense Analysis', icon: Receipt },
    { id: 'outstanding', label: 'Outstanding Invoices', icon: BarChart3 },
    { id: 'technicians', label: 'Technician Payouts', icon: HardHat },
    { id: 'profitability', label: 'Project Profitability', icon: TrendingUp },
    { id: 'subsidies', label: 'Subsidy Pipeline', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financial Reports & Summaries</h1>
          <p className="text-xs text-slate-500">
            Generate formal auditing statements, revenue summaries, and installation margins.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Statement (PDF)
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white border-t-2 border-l border-r border-green-600 text-green-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading statements...</div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Statement */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <MonthlyRevenueExpenseChart data={MOCK_MONTHLY_SUMMARY} />

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Invoice Ledger Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4 text-xs text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Gross Billed</span>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                      ₹{totalInvoiced.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-700">Realized Collections</span>
                    <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
                      ₹{totalCollected.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <span className="text-rose-700">Unpaid Receivables</span>
                    <div className="text-lg font-bold font-mono text-rose-800 mt-1">
                      ₹{totalOutstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Collections */}
          {activeTab === 'collections' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Customer Payment Collections Audit ({payments.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Receipt #</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-mono font-bold text-emerald-800">{p.receiptNumber}</td>
                        <td className="p-2.5 font-medium">{p.customerName}</td>
                        <td className="p-2.5 font-mono text-slate-600">{p.invoiceNumber}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{p.paymentDate}</td>
                        <td className="p-2.5 capitalize">{p.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Business Expenses by Category
                </h3>
                <span className="font-mono font-bold text-sm text-purple-800">
                  Total: ₹{totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Ref</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Vendor</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{e.expenseReference}</td>
                        <td className="p-2.5 font-semibold capitalize text-slate-700">{e.category.replace('_', ' ')}</td>
                        <td className="p-2.5">{e.description}</td>
                        <td className="p-2.5 text-slate-500">{e.vendorOrPayee}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-purple-700">
                          ₹{e.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Outstanding Invoices */}
          {activeTab === 'outstanding' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Aged Receivables & Outstanding Accounts
                </h3>
                <span className="font-mono font-bold text-sm text-rose-700">
                  Due: ₹{totalOutstanding.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                      <th className="p-2.5 text-right">Paid (₹)</th>
                      <th className="p-2.5 text-right">Balance Due (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices
                      .filter((i) => i.remainingBalance > 0)
                      .map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-mono font-bold">{inv.invoiceNumber}</td>
                          <td className="p-2.5 font-medium">{inv.customerName}</td>
                          <td className="p-2.5 font-mono text-slate-500">{inv.dueDate}</td>
                          <td className="p-2.5 text-right font-mono">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-700">₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                            ₹{inv.remainingBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Technicians */}
          {activeTab === 'technicians' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Technician Compensation & Disbursement Summary
                </h3>
                <span className="font-mono font-bold text-sm text-blue-800">
                  Disbursed: ₹{totalTechPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Claim Ref</th>
                      <th className="p-2.5">Technician</th>
                      <th className="p-2.5">Project / Task</th>
                      <th className="p-2.5 text-right">Agreed (₹)</th>
                      <th className="p-2.5 text-right">Paid (₹)</th>
                      <th className="p-2.5 text-right">Pending (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {techPayments.map((tp) => (
                      <tr key={tp.id}>
                        <td className="p-2.5 font-mono font-bold">{tp.paymentReference}</td>
                        <td className="p-2.5 font-medium">{tp.technicianName}</td>
                        <td className="p-2.5 font-mono text-slate-500">{tp.installationRef || tp.serviceTaskRef}</td>
                        <td className="p-2.5 text-right font-mono">₹{tp.agreedAmount.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700">₹{tp.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                          ₹{tp.pendingAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profitability */}
          {activeTab === 'profitability' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Solar Project Gross Margin & Profitability Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Project Ref</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5 text-right">Revenue (₹)</th>
                      <th className="p-2.5 text-right">Total Cost (₹)</th>
                      <th className="p-2.5 text-right">Profit (₹)</th>
                      <th className="p-2.5 text-right">Margin (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profitability.map((p) => (
                      <tr key={p.installationId}>
                        <td className="p-2.5 font-mono font-bold">{p.installationRef}</td>
                        <td className="p-2.5 font-medium">{p.customerName}</td>
                        <td className="p-2.5 text-right font-mono">₹{p.invoiceRevenue.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono">₹{p.totalRecordedCost.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          ₹{p.recordedProfit.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {p.profitMarginPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subsidies */}
          {activeTab === 'subsidies' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Solar Subsidy Portfolio & Disbursement Tracking
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <th className="p-2.5">Subsidy Ref</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Scheme</th>
                      <th className="p-2.5 text-right">Expected (₹)</th>
                      <th className="p-2.5 text-right">Approved (₹)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subsidies.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2.5 font-mono font-bold">{s.subsidyReference}</td>
                        <td className="p-2.5 font-medium">{s.customerName}</td>
                        <td className="p-2.5">{s.subsidyScheme}</td>
                        <td className="p-2.5 text-right font-mono">₹{s.expectedSubsidyAmount.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                          ₹{s.approvedSubsidyAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-center capitalize font-semibold text-slate-700">
                          {s.status.replace('_', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
