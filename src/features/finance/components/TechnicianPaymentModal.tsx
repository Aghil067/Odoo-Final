/**
 * TechnicianPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal to review, approve & disburse technician payments in Module M09.
 */

import React, { useState } from 'react';
import { HardHat, X, CheckCircle2, DollarSign } from 'lucide-react';
import type { TechnicianPaymentRecord } from '../types/technicianPayment.types';
import { TechPaymentStatusBadge } from './FinanceStatusBadge';

interface TechnicianPaymentModalProps {
  paymentRecord: TechnicianPaymentRecord;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, approvedAmount?: number) => Promise<void>;
  onDisburse: (id: string, amount: number, method: string, reference: string, notes?: string) => Promise<void>;
}

export const TechnicianPaymentModal: React.FC<TechnicianPaymentModalProps> = ({
  paymentRecord,
  isOpen,
  onClose,
  onApprove,
  onDisburse,
}) => {
  const [approvedAmount, setApprovedAmount] = useState<number>(
    paymentRecord.approvedAmount || paymentRecord.agreedAmount
  );
  const [disburseAmount, setDisburseAmount] = useState<number>(paymentRecord.pendingAmount);
  const [disburseMethod, setDisburseMethod] = useState('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApproveConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onApprove(paymentRecord.id, approvedAmount);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Approval failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisburseConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disburseAmount <= 0) {
      setError('Disbursement amount must be greater than zero.');
      return;
    }
    if (disburseAmount > paymentRecord.pendingAmount) {
      setError(`Cannot disburse more than pending amount (₹${paymentRecord.pendingAmount.toLocaleString('en-IN')}).`);
      return;
    }
    if (!transactionRef.trim()) {
      setError('Payment transaction reference / UTR is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onDisburse(
        paymentRecord.id,
        disburseAmount,
        disburseMethod,
        transactionRef,
        disburseNotes
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Disbursement recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{paymentRecord.paymentReference}</span>
                <TechPaymentStatusBadge status={paymentRecord.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500">Technician: {paymentRecord.technicianName}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Breakdown Card */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Work Assignment:</span>
            <span className="font-semibold text-slate-800">
              {paymentRecord.installationRef ? `Installation: ${paymentRecord.installationRef}` : `Service: ${paymentRecord.serviceTaskRef}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Work Period:</span>
            <span className="font-mono text-slate-700">{paymentRecord.workPeriodStart} to {paymentRecord.workPeriodEnd}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block">Agreed</span>
              <span className="font-mono font-semibold text-slate-800 text-sm mt-0.5 block">
                ₹{paymentRecord.agreedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Paid</span>
              <span className="font-mono font-semibold text-emerald-700 text-sm mt-0.5 block">
                ₹{paymentRecord.paidAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Pending</span>
              <span className="font-mono font-bold text-rose-700 text-sm mt-0.5 block">
                ₹{paymentRecord.pendingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Approval Form (if pending/submitted) */}
        {paymentRecord.status === 'submitted' && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Approved Payment Amount (₹)
              </label>
              <input
                type="number"
                min={1}
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className="w-full text-sm font-semibold font-mono px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApproveConfirm}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Approving...' : 'Approve Technician Claim'}
            </button>
          </div>
        )}

        {/* Disbursement Form (if approved or partially paid) */}
        {paymentRecord.pendingAmount > 0 && paymentRecord.status !== 'submitted' && (
          <form onSubmit={handleDisburseConfirm} className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Disburse Payment to Technician
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Disburse Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  max={paymentRecord.pendingAmount}
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full text-xs font-mono font-semibold px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Method</label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI Transfer</option>
                  <option value="cash">Direct Cash Voucher</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Transaction Ref / UTR / Cheque</label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UTR-9982310892"
                className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Disbursement Remarks / Notes</label>
              <input
                type="text"
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                placeholder="e.g. Cleared via corporate NEFT batch"
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
              >
                {isSubmitting ? 'Recording...' : 'Record Disbursement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
