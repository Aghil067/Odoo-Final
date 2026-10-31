/**
 * PaymentRecordModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal interface to record customer payments against invoices in Module M09.
 */

import React, { useState } from 'react';
import { CreditCard, X, AlertCircle } from 'lucide-react';
import type { Invoice } from '../types/invoice.types';
import type { PaymentFormData, PaymentMethod } from '../types/payment.types';

interface PaymentRecordModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number>(invoice.remainingBalance);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amount > invoice.remainingBalance) {
      setError(
        `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds the invoice balance due (₹${invoice.remainingBalance.toLocaleString('en-IN')}).`
      );
      return;
    }

    if (!transactionReference.trim()) {
      setError('Transaction reference (UTR / Cheque / Ref Number) is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        invoiceId: invoice.id,
        amount,
        paymentDate,
        paymentMethod,
        transactionReference,
        bankName,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Summary Box */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-semibold text-slate-900">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Invoice Amount:</span>
            <span className="font-mono font-semibold text-slate-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Previously Collected:</span>
            <span className="font-mono text-emerald-700 font-semibold">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Outstanding Balance:</span>
            <span className="font-mono text-rose-700">₹{invoice.remainingBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={invoice.remainingBalance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-sm font-semibold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(invoice.remainingBalance)}
                className="text-[11px] text-green-700 hover:underline font-medium"
              >
                Full Balance (₹{invoice.remainingBalance.toLocaleString('en-IN')})
              </button>
              {invoice.remainingBalance > 50000 && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.round(invoice.remainingBalance / 2))}
                  className="text-[11px] text-slate-500 hover:underline font-medium"
                >
                  50% Milestone (₹{Math.round(invoice.remainingBalance / 2).toLocaleString('en-IN')})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cheque">Cheque / DD</option>
                <option value="cash">Cash Collection</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Transaction / UTR / Cheque Ref <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. HDFC982348201 or CHQ-402918"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Bank Name (Optional)</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, SBI"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milestone 2 installation completion cleared into account"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

