/**
 * PaymentTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Customer Payment & Collection Ledger Table in Module M09.
 */

import React, { useState } from 'react';
import { Search, Printer, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CustomerPayment } from '../types/payment.types';
import { PAYMENT_METHOD_LABELS } from '../types/payment.types';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface PaymentTableProps {
  payments: CustomerPayment[];
  isLoading?: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<CustomerPayment | null>(null);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search receipt #, customer, UTR, invoice #..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Receipt #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Method & Reference</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  Loading customer payments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No payment transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(p)}
                      className="text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      {p.receiptNumber}
                    </button>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900">{p.customerName}</td>

                  <td className="py-3 px-4 font-mono">
                    <Link
                      to={`/finance/invoices/${p.invoiceId}`}
                      className="text-slate-700 hover:text-green-700 hover:underline"
                    >
                      {p.invoiceNumber}
                    </Link>
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.paymentDate}</td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">{p.transactionReference}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedReceipt && (
        <PaymentReceiptModal
          payment={selectedReceipt}
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

