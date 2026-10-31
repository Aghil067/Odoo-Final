/**
 * WarrantyResolutionForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Resolution & Repair/Replacement outcome recorder for M07.
 * Prepares handoff to M08 Service Management & links M04 inventory serials.
 */

import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle } from 'lucide-react';
import type {
  WarrantyClaimResolution,
  ResolutionType,
} from '../types/warrantyClaim.types';
import { serialNumberService } from '../../inventory/services/serialNumberService';

interface WarrantyResolutionFormProps {
  initialResolution?: WarrantyClaimResolution;
  onSave: (resolution: WarrantyClaimResolution) => Promise<void>;
  productId?: string;
  isReadOnly?: boolean;
}

export const WarrantyResolutionForm: React.FC<WarrantyResolutionFormProps> = ({
  initialResolution,
  onSave,
  productId,
  isReadOnly = false,
}) => {
  const [resolutionType, setResolutionType] = useState<ResolutionType>(
    initialResolution?.resolutionType || 'replacement'
  );
  const [resolutionDate, setResolutionDate] = useState(
    initialResolution?.resolutionDate || new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(initialResolution?.resolutionDescription || '');
  const [replacementSerial, setReplacementSerial] = useState(
    initialResolution?.replacementSerialNumber || ''
  );
  const [serviceRef, setServiceRef] = useState(
    initialResolution?.technicianOrServiceRef || 'SRV-TKT-102'
  );
  const [customerConfirmed, setCustomerConfirmed] = useState(
    initialResolution?.customerConfirmed ?? true
  );

  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available serial numbers from M04 inventory for replacement
  useEffect(() => {
    async function loadInventorySerials() {
      try {
        const res = await serialNumberService.list({ status: 'available' });
        setAvailableSerials(res.data || []);
      } catch (err) {
        console.error('Failed to load M04 replacement serials', err);
      }
    }
    loadInventorySerials();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please provide a description of the resolution action.');
      return;
    }

    if (resolutionType === 'replacement' && !replacementSerial) {
      setError('Replacement hardware requires selecting an available serial number from M04 inventory.');
      return;
    }

    try {
      setIsSaving(true);
      const resData: WarrantyClaimResolution = {
        resolutionType,
        resolutionDate,
        resolutionDescription: description,
        replacementSerialNumber: resolutionType === 'replacement' ? replacementSerial : undefined,
        replacementProductName: resolutionType === 'replacement' ? 'Factory Replacement Unit' : undefined,
        technicianOrServiceRef: serviceRef,
        customerConfirmed,
        customerConfirmationDate: customerConfirmed ? new Date().toISOString() : undefined,
        resolvedBy: 'Service Manager',
      };
      await onSave(resData);
    } catch (err: any) {
      setError(err?.message || 'Failed to save resolution details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-green-600" />
            Warranty Claim Resolution & Equipment Exchange
          </h3>
          <p className="text-xs text-slate-500">
            Record repair outcome, allocate replacement serial unit from M04 inventory, and link M08 service ticket.
          </p>
        </div>

        {initialResolution && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Resolution Recorded
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Resolution Classification <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={isReadOnly}
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="replacement">Hardware Replacement (New Serial Unit)</option>
              <option value="repair">Component Field / Bench Repair</option>
              <option value="manufacturer_referral">Manufacturer Factory RMA Referral</option>
              <option value="other_resolution">Special Engineering Resolution</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Resolution Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              M08 Service Task / Ticket Ref
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={serviceRef}
              onChange={(e) => setServiceRef(e.target.value)}
              placeholder="e.g. SRV-TKT-102"
              className="w-full text-xs px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Replacement Serial Selector (from M04 inventory) */}
          {resolutionType === 'replacement' && (
            <div className="sm:col-span-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-emerald-900">
                Select Replacement Serial Unit from M04 Warehouse Stock: <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={replacementSerial}
                onChange={(e) => setReplacementSerial(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-emerald-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              >
                <option value="">-- Choose verified serial number from warehouse --</option>
                {availableSerials.map((s) => (
                  <option key={s.id} value={s.serialNumber}>
                    {s.serialNumber} — {s.productName} ({s.currentWarehouseName || 'Central Warehouse'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-700">
                Note: In accordance with M04 inventory integrity, replacement serial numbers must come from available warehouse stock.
              </p>
            </div>
          )}

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Resolution Description & Work Carried Out <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of repair carried out, technician tests performed, replacement serial dispatched, and telemetry confirmed..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={customerConfirmed}
                onChange={(e) => setCustomerConfirmed(e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Customer Walkthrough & Satisfaction Confirmation Received
              </span>
            </label>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Saving Resolution...' : 'Save Resolution & Update Claim'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
