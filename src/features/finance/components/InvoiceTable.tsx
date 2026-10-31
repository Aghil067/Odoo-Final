/**
 * InvoiceTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Customer Invoices Ledger Table for Module M09.
 */

import React, { useState } from 'react';
import { Search, Plus, Eye, Printer, CreditCard, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Invoice, InvoiceStatus } from '../types/invoice.types';
import { InvoiceStatusBadge } from './FinanceStatusBadge';

interface InvoiceTableProps {
  invoices: Invoice[];
  onOpenRecordPayment?: (invoice: Invoice) => void;
  onOpenPrintPreview?: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onOpenRecordPayment,
  onOpenPrintPreview,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.installationRef && inv.installationRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice #, customer, installation..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Link
          to="/finance/invoices/new"
          className="w-full sm:w-auto px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer & Project</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4 text-right">Total (₹)</th>
              <th className="py-3 px-4 text-right">Collected (₹)</th>
              <th className="py-3 px-4 text-right">Balance Due (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  Loading customer invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No customer invoices found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <Link to={`/finance/invoices/${inv.id}`} className="hover:text-green-700 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {inv.installationRef ? `Ref: ${inv.installationRef}` : 'Non-Project Direct Billing'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    <div>Issued: <span className="font-medium text-slate-700">{inv.invoiceDate}</span></div>
                    <div>Due: <span className="font-medium text-slate-700">{inv.dueDate}</span></div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    ₹{inv.amountPaid.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    ₹{inv.remainingBalance.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <InvoiceStatusBadge status={inv.status as InvoiceStatus} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.remainingBalance > 0 && inv.status !== 'cancelled' && onOpenRecordPayment && (
                        <button
                          type="button"
                          onClick={() => onOpenRecordPayment(inv)}
                          title="Record Customer Payment"
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay
                        </button>
                      )}

                      {onOpenPrintPreview && (
                        <button
                          type="button"
                          onClick={() => onOpenPrintPreview(inv)}
                          title="Print / PDF Invoice"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        to={`/finance/invoices/${inv.id}`}
                        title="View Details"
                        className="p-1.5 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

