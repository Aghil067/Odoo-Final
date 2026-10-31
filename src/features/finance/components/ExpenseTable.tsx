/**
 * ExpenseTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Business Expenses Ledger Table in Module M09.
 */

import React, { useState } from 'react';
import { Search, Plus, CheckCircle, XCircle, FileText, Check } from 'lucide-react';
import type { Expense, ExpenseCategory, ExpenseStatus } from '../types/expense.types';
import { EXPENSE_CATEGORY_LABELS } from '../types/expense.types';
import { ExpenseStatusBadge } from './FinanceStatusBadge';

interface ExpenseTableProps {
  expenses: Expense[];
  onOpenCreate?: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onMarkPaid?: (id: string) => Promise<void>;
  canApprove?: boolean;
  isLoading?: boolean;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onOpenCreate,
  onApprove,
  onReject,
  onMarkPaid,
  canApprove = true,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.expenseReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vendorOrPayee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.installationRef && e.installationRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ref, description, vendor..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Expense Ref</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description & Payee</th>
              <th className="py-3 px-4">Related Project / Ticket</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              {canApprove && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  Loading expenses...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No business expenses recorded matching the filters.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.expenseReference}</td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 capitalize">
                      {EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] || e.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{e.description}</div>
                    <div className="text-[11px] text-slate-500">Payee: {e.vendorOrPayee}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    {e.installationRef ? (
                      <span className="text-blue-700">{e.installationRef}</span>
                    ) : e.serviceTicketRef ? (
                      <span className="text-purple-700">{e.serviceTicketRef}</span>
                    ) : (
                      <span className="text-slate-400">General Overhead</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{e.expenseDate}</td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                    ₹{e.amount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <ExpenseStatusBadge status={e.status as ExpenseStatus} size="sm" />
                  </td>

                  {canApprove && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {e.status === 'submitted' && onApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(e.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Approve Expense"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {e.status === 'submitted' && onReject && (
                          <button
                            type="button"
                            onClick={() => {
                              const reason = window.prompt('Provide rejection justification:');
                              if (reason) onReject(e.id, reason);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="Reject Expense"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {e.status === 'approved' && onMarkPaid && (
                          <button
                            type="button"
                            onClick={() => onMarkPaid(e.id)}
                            className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                            title="Disburse / Mark Paid"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

