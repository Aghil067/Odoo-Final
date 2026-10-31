/**
 * InvoicePrintPreviewModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Clean print-friendly Invoice document modal in Module M09.
 */

import React from 'react';
import { Printer, X } from 'lucide-react';
import type { Invoice } from '../types/invoice.types';
import { InvoiceStatusBadge } from './FinanceStatusBadge';

interface InvoicePrintPreviewModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintPreviewModal: React.FC<InvoicePrintPreviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        {/* Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800">{invoice.invoiceNumber}</span>
            <InvoiceStatusBadge status={invoice.status} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-bold text-green-700 tracking-tight">SunPower Solutions</div>
              <p className="text-[11px] text-slate-500 font-medium">Turnkey Rooftop Solar & Energy Storage</p>
              <p className="text-[11px] text-slate-600 mt-1">#108, Indiranagar 100ft Road, Bengaluru, KA 560038</p>
              <p className="text-[11px] text-slate-600">GSTIN: <span className="font-mono font-semibold">29AAECS1234F1Z9</span></p>
              <p className="text-[11px] text-slate-600">Email: billing@sunpowersolutions.in | Phone: +91 80 4123 4567</p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-2xl font-black text-slate-900 tracking-wider uppercase block">TAX INVOICE</span>
              <div className="font-mono font-bold text-sm text-green-800">{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-slate-600">Date: <span className="font-medium text-slate-900">{invoice.invoiceDate}</span></div>
              <div className="text-[11px] text-slate-600">Due: <span className="font-medium text-slate-900">{invoice.dueDate}</span></div>
            </div>
          </div>

          {/* Bill To & Project Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed Customer
              </span>
              <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
              {invoice.customerAddress && <p className="text-[11px] text-slate-600 mt-0.5">{invoice.customerAddress}</p>}
              {invoice.customerPhone && <p className="text-[11px] text-slate-600">Phone: {invoice.customerPhone}</p>}
              {invoice.customerGst && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Customer GSTIN: <span className="font-mono font-semibold">{invoice.customerGst}</span>
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Solar Installation Project
              </span>
              <div className="font-semibold text-slate-900">Ref: {invoice.installationRef || 'Direct Supply/Service'}</div>
              {invoice.systemCapacity && (
                <div className="text-[11px] text-slate-600 mt-0.5">Capacity: <span className="font-semibold">{invoice.systemCapacity}</span></div>
              )}
              {invoice.systemType && (
                <div className="text-[11px] text-slate-600 capitalize">System Type: {invoice.systemType.replace('_', ' ')}</div>
              )}
              <div className="mt-2">
                <span className="text-[11px] text-slate-500 font-medium">Payment State: </span>
                <span className="font-bold capitalize text-slate-800">{invoice.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Goods / Services</th>
                  <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">{item.hsnSacCode || '-'}</td>
                    <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs border-t border-slate-200 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Concession / Discount:</span>
                  <span className="font-mono">- ₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>GST ({invoice.taxRate}%):</span>
                <span className="font-mono">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-green-700">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-emerald-700 text-xs border-t border-slate-100 pt-1 font-semibold">
                <span>Amount Paid:</span>
                <span className="font-mono">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-rose-700 text-xs font-bold">
                <span>Remaining Balance:</span>
                <span className="font-mono">₹{invoice.remainingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Bank Details & Signature */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-[11px] text-slate-600">
              <span className="font-bold text-slate-900 block">Bank Account for Electronic Transfer:</span>
              <p>Bank: <span className="font-semibold text-slate-800">HDFC Bank Ltd, Indiranagar</span></p>
              <p>Account Name: <span className="font-semibold text-slate-800">SunPower Solutions Private Limited</span></p>
              <p>Account No: <span className="font-mono font-bold text-slate-900">50200088991122</span></p>
              <p>IFSC Code: <span className="font-mono font-bold text-slate-900">HDFC0000128</span></p>
              <p>UPI ID: <span className="font-mono font-bold text-green-700">sunpower@hdfcbank</span></p>
            </div>

            <div className="flex flex-col justify-end items-end text-right text-[11px] text-slate-500 space-y-12">
              <span>For SunPower Solutions Pvt Ltd</span>
              <div className="border-t border-slate-400 w-48 text-center pt-1 text-slate-700 font-semibold">
                Authorized Signatory
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
              <span className="font-semibold">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
