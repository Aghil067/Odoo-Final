/**
 * SubsidyFormModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal to create or update Solar Subsidy applications in Module M09.
 */

import React, { useState, useEffect } from 'react';
import { Award, X, AlertCircle } from 'lucide-react';
import type { SubsidyFormData } from '../types/subsidy.types';
import { customerService } from '../../crm/services/customerService';
import { installationService } from '../../installations/services/installationService';

interface SubsidyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubsidyFormData) => Promise<void>;
}

export const SubsidyFormModal: React.FC<SubsidyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [installationId, setInstallationId] = useState('');
  const [installationRef, setInstallationRef] = useState('');
  const [systemCapacity, setSystemCapacity] = useState('3 kW');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [subsidyScheme, setSubsidyScheme] = useState('PM Surya Ghar Muft Bijli Yojana (Central CFA)');
  const [discomName, setDiscomName] = useState('BESCOM (Bengaluru Electricity Supply Company)');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [expectedSubsidyAmount, setExpectedSubsidyAmount] = useState<number>(78000);
  const [remarks, setRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, iRes] = await Promise.all([
          customerService.list(),
          installationService.list(),
        ]);
        setCustomers(cRes.data || []);
        setInstallations(Array.isArray(iRes) ? iRes : (iRes as any).data || []);
      } catch (err) {
        console.error('Failed to load subsidy references', err);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.fullName);
      const matchingInst = installations.find((i) => i.customerId === found.id);
      if (matchingInst) {
        setInstallationId(matchingInst.id);
        setInstallationRef(matchingInst.installationId);
        setSystemCapacity(matchingInst.systemCapacity || '3 kW');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (expectedSubsidyAmount <= 0) {
      setError('Expected subsidy amount must be positive.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        customerId,
        customerName,
        installationId,
        installationRef,
        systemCapacity,
        applicationDate,
        subsidyScheme,
        discomName,
        consumerNumber,
        expectedSubsidyAmount,
        remarks,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit subsidy application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Track Solar Subsidy Application</h3>
              <p className="text-xs text-slate-500">PM Surya Ghar Muft Bijli Yojana & State DISCOM schemes.</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Customer (M01) <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Choose customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Linked Installation (M05)</label>
              <select
                value={installationId}
                onChange={(e) => {
                  setInstallationId(e.target.value);
                  const inst = installations.find((i) => i.id === e.target.value);
                  if (inst) {
                    setInstallationRef(inst.installationId);
                    setSystemCapacity(inst.systemCapacity || '3 kW');
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Select project --</option>
                {installations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.installationId} ({i.systemCapacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">System Capacity</label>
              <input
                type="text"
                value={systemCapacity}
                onChange={(e) => setSystemCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Subsidy Scheme Name</label>
            <input
              type="text"
              value={subsidyScheme}
              onChange={(e) => setSubsidyScheme(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">DISCOM Utility Name</label>
              <input
                type="text"
                value={discomName}
                onChange={(e) => setDiscomName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">DISCOM Consumer Account #</label>
              <input
                type="text"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                placeholder="BES-IND-991203"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Subsidy (₹)</label>
              <input
                type="number"
                min={0}
                value={expectedSubsidyAmount}
                onChange={(e) => setExpectedSubsidyAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Application Date</label>
              <input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Remarks / Application Reference Notes</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Portal acknowledgement number, inspection slot, or remarks..."
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
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Registering...' : 'Register Subsidy Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

