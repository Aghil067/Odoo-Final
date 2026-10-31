/**
 * InvoiceDetails.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete Invoice Dossier screen in Module M09.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  CreditCard,
  ArrowLeft,
  FileText,
  User,
  Zap,
} from 'lucide-react';
import type { Invoice } from '../types/invoice.types';
import type { CustomerPayment } from '../types/payment.types';
import { InvoiceStatusBadge } from './FinanceStatusBadge';
import { InvoicePrintPreviewModal } from './InvoicePrintPreviewModal';
import { PaymentRecordModal } from './PaymentRecordModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface InvoiceDetailsProps {
  invoice: Invoice;
  payments: CustomerPayment[];
  onRecordPayment: (data: any) => Promise<void>;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  payments,
  onRecordPayment,
}) => {
  const navigate = useNavigate();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CustomerPayment | null>(null);

  const relatedPayments = payments.filter((p) => p.invoiceId === invoice.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/finance/invoices')}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-slate-900">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-semibold text-slate-800">{invoice.customerName}</span>
              {invoice.installationRef && ` • Linked Project: ${invoice.installationRef}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.remainingBalance > 0 && invoice.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Total Invoiced</span>
          <div className="text-xl font-bold font-mono text-slate-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-slate-400">Inclusive of taxes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">Amount Collected</span>
          <div className="text-xl font-bold font-mono text-emerald-800">₹{invoice.amountPaid.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-600">
            {invoice.totalAmount > 0 ? Math.round((invoice.amountPaid / invoice.totalAmount) * 100) : 0}% Realized
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm space-y-1 bg-rose-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">Balance Due</span>
          <div className="text-xl font-bold font-mono text-rose-800">₹{invoice.remainingBalance.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-rose-600">Due: {invoice.dueDate}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Taxes & Discounts</span>
          <div className="text-xl font-bold font-mono text-slate-700">GST {invoice.taxRate}%</div>
          <span className="text-[10px] text-slate-500">₹{invoice.taxAmount.toLocaleString('en-IN')} Tax</span>
        </div>
      </div>

      {/* 2-Columns: Info & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-green-600" />
                Line Item Details ({invoice.items.length})
              </h3>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-4 text-center">HSN/SAC</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{item.hsnSacCode || '-'}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment History for this invoice */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Recorded Collections for this Invoice ({relatedPayments.length})
            </h3>

            {relatedPayments.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No customer payments recorded yet for this invoice.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {relatedPayments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-800">{p.receiptNumber}</span>
                        <span className="text-[11px] font-semibold capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Date: {p.paymentDate} • Ref: <span className="font-mono text-slate-700 font-semibold">{p.transactionReference}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-emerald-700">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(p)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="View Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer & Project Specs */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              Customer Details
            </h3>

            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px]">Billed To</span>
              <span className="font-bold text-slate-900 block">{invoice.customerName}</span>
              {invoice.customerPhone && <p className="text-slate-600">{invoice.customerPhone}</p>}
              {invoice.customerEmail && <p className="text-slate-600">{invoice.customerEmail}</p>}
              {invoice.customerAddress && <p className="text-slate-600 pt-1">{invoice.customerAddress}</p>}
              {invoice.customerGst && (
                <p className="text-slate-700 pt-1">
                  GSTIN: <span className="font-mono font-semibold">{invoice.customerGst}</span>
                </p>
              )}
            </div>

            {invoice.customerId && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to={`/crm/customers/${invoice.customerId}`}
                  className="text-green-700 hover:underline font-semibold text-[11px]"
                >
                  View Customer in CRM (M01) &rarr;
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Linked Installation Project (M05)
            </h3>

            {invoice.installationId ? (
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 text-[11px] block">Project Reference</span>
                  <span className="font-mono font-bold text-slate-800">{invoice.installationRef}</span>
                </div>
                {invoice.systemCapacity && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">System Capacity</span>
                    <span className="font-semibold text-slate-800">{invoice.systemCapacity}</span>
                  </div>
                )}
                {invoice.systemType && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">System Classification</span>
                    <span className="font-semibold text-slate-800 capitalize">{invoice.systemType.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    to={`/installations/${invoice.installationId}`}
                    className="text-green-700 hover:underline font-semibold text-[11px]"
                  >
                    View Project in M05 &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Direct component or service billing. No installation project attached.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvoicePrintPreviewModal
        invoice={invoice}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />

      <PaymentRecordModal
        invoice={invoice}
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onSubmit={onRecordPayment}
      />

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
