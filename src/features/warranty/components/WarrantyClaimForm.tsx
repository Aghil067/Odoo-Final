/**
 * WarrantyClaimForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Form for filing a new Warranty Claim in M07.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Save, Trash2, Camera } from 'lucide-react';
import type {
  WarrantyClaimFormData,
  ClaimIssueCategory,
  ClaimPriority,
} from '../types/warrantyClaim.types';
import type { WarrantyRecord } from '../types/warranty.types';
import { warrantyService } from '../services/warrantyService';

interface WarrantyClaimFormProps {
  onSubmit: (data: WarrantyClaimFormData) => Promise<void>;
}

export const WarrantyClaimForm: React.FC<WarrantyClaimFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedWarrantyId = searchParams.get('warrantyId');

  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoInput, setPhotoInput] = useState('');

  const [formData, setFormData] = useState<WarrantyClaimFormData>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',

    warrantyId: '',
    warrantyRef: '',
    productId: '',
    productName: '',
    serialNumber: '',
    installationRef: '',

    issueCategory: 'inverter_failure',
    issueTitle: '',
    detailedDescription: '',
    issueDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    failureSymptoms: '',
    equipmentCondition: '',
    errorCode: '',

    supportingPhotos: [],
    remarks: '',
    saveAsDraft: false,
  });

  // Load customer and warranties
  useEffect(() => {
    async function loadData() {
      try {
        const wRes = await warrantyService.list();
        setWarranties(wRes.data || []);

        if (preselectedWarrantyId) {
          const matched = (wRes.data || []).find(
            (w: WarrantyRecord) => w.id === preselectedWarrantyId || w.warrantyId === preselectedWarrantyId
          );
          if (matched) {
            selectWarranty(matched);
          }
        }
      } catch (err) {
        console.error('Failed loading claim form options', err);
      }
    }
    loadData();
  }, [preselectedWarrantyId]);

  const selectWarranty = (w: WarrantyRecord) => {
    setFormData((prev) => ({
      ...prev,
      customerId: w.customerId,
      customerName: w.customerName,
      customerPhone: w.customerPhone,
      customerEmail: w.customerEmail,

      warrantyId: w.id,
      warrantyRef: w.warrantyId,
      productId: w.productId,
      productName: w.productName,
      serialNumber: w.serialNumber || '',
      installationRef: w.installationRef || '',
    }));
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      supportingPhotos: [...prev.supportingPhotos, photoInput.trim()],
    }));
    setPhotoInput('');
  };

  const handleRemovePhoto = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      supportingPhotos: prev.supportingPhotos.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setError(null);

    if (!formData.warrantyId) {
      setError('Please select an active or registered warranty record.');
      return;
    }

    if (!formData.issueTitle.trim()) {
      setError('Issue Title is required.');
      return;
    }

    if (!formData.detailedDescription.trim()) {
      setError('Detailed Description is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ ...formData, saveAsDraft: isDraft });
      navigate('/warranty/claims');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit warranty claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/warranty/claims')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims List
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/warranty/claims')}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Section 1: Customer & Equipment Warranty Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Warranty Record & Equipment Identification
          </h3>
          <p className="text-xs text-slate-500">
            Select the active warranty contract against which the hardware failure is being reported.
          </p>
        </div>

        {/* Selected Warranty Summary Card */}
        {formData.warrantyId ? (
          <div className="p-4 bg-green-50/70 border border-green-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                {formData.warrantyRef}
              </span>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, warrantyId: '', warrantyRef: '' }))}
                className="text-xs text-slate-500 hover:text-rose-600 underline"
              >
                Change Warranty
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer:</span>
                <span className="font-semibold text-slate-900">{formData.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Product:</span>
                <span className="font-semibold text-slate-900">{formData.productName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Serial Number:</span>
                <span className="font-mono font-bold text-green-700">{formData.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Installation Ref:</span>
                <span className="font-mono text-slate-800">{formData.installationRef || 'Over-the-counter'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Covered Equipment Warranty <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {warranties.map((w) => (
                <div
                  key={w.id}
                  onClick={() => selectWarranty(w)}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-green-700 mr-2">{w.warrantyId}</span>
                    <span className="font-semibold text-slate-900">{w.customerName}</span> •{' '}
                    <span className="text-slate-600">{w.productName}</span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SN: {w.serialNumber || 'N/A'} • Exp: {w.warrantyExpiryDate} • Status: {w.status}
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                    Select
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Defect & Issue Details */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900">Failure & Malfunction Details</h3>
          <p className="text-xs text-slate-500">Document the observed symptoms, error code, and urgency level.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.issueCategory}
              onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value as ClaimIssueCategory })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="inverter_failure">Inverter Failure / Error Trip</option>
              <option value="battery_failure">Battery Degradation / Fault</option>
              <option value="solar_panel_damage">Solar Panel Physical / Output Damage</option>
              <option value="charge_controller_failure">Charge Controller Malfunction</option>
              <option value="electrical_issue">Electrical Cabling & Breakers</option>
              <option value="performance_issue">Generation Underperformance</option>
              <option value="other">Other Hardware Malfunction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Occurred Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Claim Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as ClaimPriority })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="critical">Critical (Complete Power Outage)</option>
              <option value="high">High (Daily Tripping / Generation Loss)</option>
              <option value="medium">Medium (Partial Output Loss / Alert)</option>
              <option value="low">Low (Minor Sensor / Communication Issue)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Title / Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inverter displaying Error 04 Grid Voltage Overload and tripping at noon"
              value={formData.issueTitle}
              onChange={(e) => setFormData({ ...formData, issueTitle: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description of the failure event, sequence of occurrences, customer observations, and technician initial remarks..."
              value={formData.detailedDescription}
              onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Error Code / Fault Indicator
            </label>
            <input
              type="text"
              placeholder="e.g. Err 04, F22, E01"
              value={formData.errorCode || ''}
              onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
              className="w-full text-xs px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observable Failure Symptoms
            </label>
            <input
              type="text"
              placeholder="e.g. Red LED flashing, buzzing sound, burnt odor"
              value={formData.failureSymptoms || ''}
              onChange={(e) => setFormData({ ...formData, failureSymptoms: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Physical Condition
            </label>
            <input
              type="text"
              placeholder="e.g. Clean enclosure, no external impact marks"
              value={formData.equipmentCondition || ''}
              onChange={(e) => setFormData({ ...formData, equipmentCondition: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Supporting Photographs & Evidence */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-600" />
            Supporting Photographs & Visual Evidence
          </h3>
          <p className="text-xs text-slate-500">
            Attach photo proof of display error screen, damaged components, or serial barcode plate.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste image URL (e.g. https://... or local path) or photo reference"
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleAddPhoto}
            disabled={!photoInput.trim()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-40"
          >
            Add Photo Link
          </button>
        </div>

        {formData.supportingPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {formData.supportingPhotos.map((url, idx) => (
              <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1">
                <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};
