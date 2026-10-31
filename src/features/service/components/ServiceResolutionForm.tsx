/**
 * ServiceResolutionForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Resolution & Ticket Closure panel for Service Managers in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, RotateCcw, Star } from 'lucide-react';
import type { ServiceTicketResolution } from '../types/serviceResolution.types';
import type { RepairOutcome } from '../types/serviceTask.types';
import { serialNumberService } from '../../inventory/services/serialNumberService';

interface ServiceResolutionFormProps {
  initialResolution?: ServiceTicketResolution;
  ticketStatus: string;
  onResolve: (resolution: ServiceTicketResolution) => Promise<void>;
  onCloseTicket: () => Promise<void>;
  onReopenTicket: (reason: string) => Promise<void>;
  isManager?: boolean;
}

export const ServiceResolutionForm: React.FC<ServiceResolutionFormProps> = ({
  initialResolution,
  ticketStatus,
  onResolve,
  onCloseTicket,
  onReopenTicket,
  isManager = true,
}) => {
  const [diagnosis, setDiagnosis] = useState(initialResolution?.finalDiagnosis || '');
  const [rootCause, setRootCause] = useState(initialResolution?.rootCause || '');
  const [workPerformed, setWorkPerformed] = useState(initialResolution?.workPerformed || '');
  const [outcome, setOutcome] = useState<RepairOutcome>(initialResolution?.repairOutcome || 'successfully_repaired');
  const [replacementSerial, setReplacementSerial] = useState(initialResolution?.replacementSerialNumber || '');
  const [notes, setNotes] = useState(initialResolution?.serviceManagerNotes || '');
  const [customerConfirmed, setCustomerConfirmed] = useState(initialResolution?.customerConfirmed ?? true);
  const [rating, setRating] = useState(initialResolution?.customerRating || 5);

  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSerials() {
      try {
        const res = await serialNumberService.list({ status: 'available' });
        setAvailableSerials(res.data || []);
      } catch (err) {
        console.error('Failed to load serials', err);
      }
    }
    loadSerials();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!diagnosis.trim()) {
      setError('Final Diagnosis is required.');
      return;
    }
    if (!rootCause.trim()) {
      setError('Root Cause is required.');
      return;
    }
    if (!workPerformed.trim()) {
      setError('Work Performed summary is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res: ServiceTicketResolution = {
        finalDiagnosis: diagnosis,
        rootCause,
        workPerformed,
        replacementSerialNumber: outcome === 'replacement_required' ? replacementSerial : undefined,
        repairOutcome: outcome,
        resolutionDate: new Date().toISOString().split('T')[0],
        serviceManagerNotes: notes,
        customerConfirmed,
        customerRating: rating,
        resolvedBy: 'Service Manager',
      };
      await onResolve(res);
    } catch (err: any) {
      setError(err?.message || 'Resolution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenConfirm = async () => {
    if (!reopenReason.trim()) {
      alert('Please state a reason for reopening this ticket.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onReopenTicket(reopenReason);
      setShowReopenModal(false);
      setReopenReason('');
    } catch (err: any) {
      alert('Failed to reopen ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Service Resolution & Formal Closure
          </h3>
          <p className="text-xs text-slate-500">
            Document definitive root cause, customer satisfaction score, and finalize service contract closure.
          </p>
        </div>

        {ticketStatus === 'resolved' && isManager && (
          <button
            type="button"
            onClick={onCloseTicket}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Close Ticket
          </button>
        )}

        {(ticketStatus === 'resolved' || ticketStatus === 'closed') && isManager && (
          <button
            type="button"
            onClick={() => setShowReopenModal(true)}
            className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reopen Ticket
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Resolution Form */}
      <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Final Technical Diagnosis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={ticketStatus === 'closed' || !isManager}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Inverter grid overvoltage ceiling tripping due to localized utility line surge"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Root Cause Identification <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={ticketStatus === 'closed' || !isManager}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. BESCOM distribution transformer set at 254V during light daytime loading"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Service Manager Remarks / Notes
            </label>
            <textarea
              rows={2}
              disabled={ticketStatus === 'closed' || !isManager}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal post-service review notes, SLA notes or warranty claim reference..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Work Performed & Verification Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              disabled={ticketStatus === 'closed' || !isManager}
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="e.g. Recalibrated overvoltage parameter to 258V in SolisCloud; checked neutral-to-earth voltage (<1.8V); monitored steady generation..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Repair Outcome</label>
            <select
              disabled={ticketStatus === 'closed' || !isManager}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as RepairOutcome)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
            >
              <option value="successfully_repaired">Successfully Rectified on Site</option>
              <option value="temporary_fix">Temporary Fix (Subject to Review)</option>
              <option value="replacement_required">Replacement Unit Installed</option>
              <option value="further_inspection_required">Further Bench Inspection Required</option>
            </select>
          </div>

          {outcome === 'replacement_required' && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Replacement Serial Number (from M04 Warehouse)
              </label>
              <select
                disabled={ticketStatus === 'closed' || !isManager}
                value={replacementSerial}
                onChange={(e) => setReplacementSerial(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
              >
                <option value="">-- Select from M04 inventory --</option>
                {availableSerials.map((s) => (
                  <option key={s.id} value={s.serialNumber}>
                    {s.serialNumber} ({s.productName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Rating (1 - 5 Stars)</label>
            <div className="flex items-center gap-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={ticketStatus === 'closed' || !isManager}
                  onClick={() => setRating(star)}
                  className={`p-1 ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={ticketStatus === 'closed' || !isManager}
                checked={customerConfirmed}
                onChange={(e) => setCustomerConfirmed(e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500"
              />
              <span className="font-semibold text-slate-800">
                Customer Walkthrough & Satisfaction Confirmation Formally Received
              </span>
            </label>
          </div>
        </div>

        {ticketStatus !== 'resolved' && ticketStatus !== 'closed' && isManager && (
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Resolving...' : 'Resolve Service Ticket'}
            </button>
          </div>
        )}
      </form>

      {/* Reopen Ticket Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-700">
              <RotateCcw className="w-5 h-5" />
              Reopen Service Ticket
            </h3>
            <p className="text-xs text-slate-600">
              State the reason why this ticket is being reopened (e.g. recurrence of tripping error, customer callback).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reopen Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="State technical justification..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reopenReason.trim() || isSubmitting}
                onClick={handleReopenConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
