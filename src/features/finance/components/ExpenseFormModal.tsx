/**
 * ExpenseFormModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal to record or edit business operating expenses in Module M09.
 */

import React, { useState, useEffect } from 'react';
import { Receipt, X, AlertCircle } from 'lucide-react';
import type { ExpenseFormData, ExpenseCategory } from '../types/expense.types';
import { EXPENSE_CATEGORY_LABELS } from '../types/expense.types';
import { installationService } from '../../installations/services/installationService';
import { serviceTicketService } from '../../service/services/serviceTicketService';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [installationId, setInstallationId] = useState('');
  const [serviceTicketId, setServiceTicketId] = useState('');
  const [vendorOrPayee, setVendorOrPayee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'upi' | 'corporate_card' | 'other'>('bank_transfer');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [notes, setNotes] = useState('');

  const [installations, setInstallations] = useState<any[]>([]);
  const [serviceTickets, setServiceTickets] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [instRes, srvRes] = await Promise.all([
          installationService.list(),
          serviceTicketService.list(),
        ]);
        setInstallations(Array.isArray(instRes) ? instRes : (instRes as any).data || []);
        setServiceTickets(srvRes.data || []);
      } catch (err) {
        console.error('Failed to load expense reference options', err);
      }
    }
    if (isOpen) {
      loadRefs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (saveAsDraft: boolean) => {
    setError(null);

    if (!description.trim()) {
      setError('Expense description is required.');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (!vendorOrPayee.trim()) {
      setError('Vendor or payee name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        category,
        description,
        amount,
        expenseDate,
        installationId: installationId || undefined,
        serviceTicketId: serviceTicketId || undefined,
        vendorOrPayee,
        paymentMethod,
        receiptFileName: receiptFileName || undefined,
        notes,
        saveAsDraft,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Business Expense</h3>
              <p className="text-xs text-slate-500">Procurement, labour, logistics or field operational costs.</p>
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

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Description of Expenditure <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10 sq.mm DC solar cable rolls and 50 MC4 pairs"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Vendor / Payee <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={vendorOrPayee}
                onChange={(e) => setVendorOrPayee(e.target.value)}
                placeholder="e.g. Sri Balaji Electricals"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Related Installation (M05)</label>
              <select
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- General / Non-Project --</option>
                {installations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.installationId} ({i.customerName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Related Service Ticket (M08)</label>
              <select
                value={serviceTicketId}
                onChange={(e) => setServiceTicketId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- None --</option>
                {serviceTickets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ticketRef} ({s.customerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / Scanner</option>
                <option value="corporate_card">Corporate Credit Card</option>
                <option value="cash">Petty Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Receipt / Voucher Attachment</label>
              <input
                type="text"
                value={receiptFileName}
                onChange={(e) => setReceiptFileName(e.target.value)}
                placeholder="bill_vendor_scan.pdf"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes / Justification</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved under emergency replacement quota"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
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
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record & Submit Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

