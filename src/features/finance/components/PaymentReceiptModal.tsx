/**
 * PaymentReceiptModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Official Payment Receipt & Acknowledgement modal in Module M09.
 */

import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { CustomerPayment } from '../types/payment.types';
import { PAYMENT_METHOD_LABELS } from '../types/payment.types';

interface PaymentReceiptModalProps {
  payment: CustomerPayment;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        {/* Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Payment Receipt Preview</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
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

        {/* Receipt Content */}
        <div className="space-y-5 text-xs text-slate-800 border-2 border-emerald-600/30 p-6 rounded-2xl bg-emerald-50/10">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <div className="text-lg font-bold text-green-700">SunPower Solutions</div>
              <p className="text-[11px] text-slate-500">Official Payment Acknowledgement</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">GSTIN: 29AAECS1234F1Z9</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                RECEIPT
              </span>
              <div className="font-mono font-bold text-sm text-slate-900 mt-1">{payment.receiptNumber}</div>
              <div className="text-[11px] text-slate-500">Date: {payment.paymentDate}</div>
            </div>
          </div>

          {/* Customer & Payment Details */}
          <div className="space-y-3">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Received From:</span>
              <span className="font-bold text-slate-900">{payment.customerName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Invoice Reference:</span>
              <span className="font-mono font-semibold text-slate-800">{payment.invoiceNumber}</span>
            </div>

            {payment.installationRef && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Installation Project:</span>
                <span className="font-semibold text-slate-800">{payment.installationRef}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-800">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Transaction / UTR Ref:</span>
              <span className="font-mono text-slate-800 font-semibold">{payment.transactionReference}</span>
            </div>

            {payment.bankName && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank Name:</span>
                <span className="text-slate-800">{payment.bankName}</span>
              </div>
            )}
          </div>

          {/* Amount Paid Callout */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 block">AMOUNT RECEIVED</span>
              <span className="text-[10px] text-emerald-600">Cleared against invoice</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-800">
              ₹{payment.amount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Invoice Reconciliation Summary */}
          <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
            <div>
              <span className="text-slate-400 block">Invoice Total</span>
              <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                ₹{payment.invoiceTotalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Previous Paid</span>
              <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                ₹{payment.previouslyPaidAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Remaining Due</span>
              <span className="font-mono font-bold text-rose-700 mt-0.5 block">
                ₹{payment.remainingBalanceAfterPayment.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {payment.notes && (
            <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-100">
              Remark: {payment.notes}
            </p>
          )}

          {/* Signoff */}
          <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-[11px] text-slate-500">
            <div>
              <span>Recorded By: {payment.recordedBy}</span>
              <p className="text-[10px] text-slate-400">System generated receipt. Computer verified.</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-800">SunPower Solutions Accounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

