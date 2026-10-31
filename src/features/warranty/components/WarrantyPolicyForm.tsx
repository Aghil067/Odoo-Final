/**
 * WarrantyPolicyForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Form for defining or editing a Warranty Policy in M07.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Info, ArrowLeft, Save } from 'lucide-react';
import type {
  WarrantyPolicyFormData,
  WarrantyCoverageType,
  WarrantyActivationBasis,
  DurationUnit,
  WarrantyProductCategory,
  PolicyStatus,
} from '../types/warrantyPolicy.types';

interface WarrantyPolicyFormProps {
  initialData?: Partial<WarrantyPolicyFormData>;
  onSubmit: (data: WarrantyPolicyFormData) => Promise<void>;
  isEdit?: boolean;
}

export const WarrantyPolicyForm: React.FC<WarrantyPolicyFormProps> = ({
  initialData,
  onSubmit,
  isEdit = false,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<WarrantyPolicyFormData>({
    policyCode: initialData?.policyCode || 'POL-PV-10Y',
    policyName: initialData?.policyName || '',
    description: initialData?.description || '',
    productCategory: initialData?.productCategory || 'solar_panels',
    applicableProductName: initialData?.applicableProductName || '',
    manufacturer: initialData?.manufacturer || 'Waaree Energies Ltd',
    modelNumber: initialData?.modelNumber || '',
    durationValue: initialData?.durationValue || 10,
    durationUnit: initialData?.durationUnit || 'years',
    coverageType: initialData?.coverageType || 'manufacturer',
    activationBasis: initialData?.activationBasis || 'installation_date',
    coverageDescription: initialData?.coverageDescription || '',
    exclusions: initialData?.exclusions || '',
    termsAndConditions: initialData?.termsAndConditions || '',
    isTransferable: initialData?.isTransferable ?? true,
    isProofOfPurchaseRequired: initialData?.isProofOfPurchaseRequired ?? true,
    isSerialNumberMandatory: initialData?.isSerialNumberMandatory ?? true,
    isInstallationProofRequired: initialData?.isInstallationProofRequired ?? true,
    coversReplacement: initialData?.coversReplacement ?? true,
    coversRepair: initialData?.coversRepair ?? false,
    status: initialData?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.policyName.trim()) {
      setError('Policy Name is required.');
      return;
    }

    if (!formData.policyCode.trim()) {
      setError('Policy Code is required.');
      return;
    }

    if (formData.durationValue <= 0) {
      setError('Duration must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      navigate('/warranty/policies');
    } catch (err: any) {
      setError(err?.message || 'Failed to save warranty policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/warranty/policies')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Policies Catalogue
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/warranty/policies')}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Advisory Demo Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Demonstration Policy Parameters:</span> Standard durations (e.g., Solar panels: 20 years, Inverters: 2 years, Batteries: 2 years) are initial demonstration examples. Warranty duration and terms are fully configurable per manufacturer and OEM warranty certificate.
        </div>
      </div>

      {/* Section 1: Basic Policy Details */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            Basic Policy Information
          </h3>
          <p className="text-xs text-slate-500">Core identification and applicable product category.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Policy Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.policyName}
              onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
              placeholder="e.g. Solis String Inverter 2-Year Comprehensive Warranty"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Policy Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.policyCode}
              onChange={(e) => setFormData({ ...formData, policyCode: e.target.value.toUpperCase() })}
              placeholder="e.g. POL-INV-2Y"
              className="w-full text-xs px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">Policy Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of policy coverage rules and eligible scenarios"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product Category</label>
            <select
              value={formData.productCategory}
              onChange={(e) => setFormData({ ...formData, productCategory: e.target.value as WarrantyProductCategory })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="solar_panels">Solar Panels</option>
              <option value="inverter">Inverter</option>
              <option value="battery">Battery Storage</option>
              <option value="charge_controller">Charge Controller</option>
              <option value="mounting_hardware">Mounting Hardware</option>
              <option value="electrical_accessories">Electrical Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g. Ginlong Solis, Growatt, Waaree"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Model Number / Series</label>
            <input
              type="text"
              value={formData.modelNumber || ''}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              placeholder="e.g. Solis-3P5K-4G or All Models"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Coverage & Duration */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900">Coverage Duration & Activation</h3>
          <p className="text-xs text-slate-500">Configure time limits and event triggering coverage start.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Warranty Duration <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={formData.durationValue}
              onChange={(e) => setFormData({ ...formData, durationValue: parseInt(e.target.value) || 1 })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Duration Unit</label>
            <select
              value={formData.durationUnit}
              onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as DurationUnit })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="years">Years</option>
              <option value="months">Months</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Coverage Type</label>
            <select
              value={formData.coverageType}
              onChange={(e) => setFormData({ ...formData, coverageType: e.target.value as WarrantyCoverageType })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="manufacturer">Manufacturer Warranty</option>
              <option value="company">Company Warranty</option>
              <option value="extended">Extended Warranty</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Activation Basis</label>
            <select
              value={formData.activationBasis}
              onChange={(e) => setFormData({ ...formData, activationBasis: e.target.value as WarrantyActivationBasis })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="installation_date">Installation Completion Date</option>
              <option value="delivery_date">Goods Delivery Date</option>
              <option value="other_approved_date">Other Approved Date</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Coverage Inclusions Description</label>
            <textarea
              rows={3}
              value={formData.coverageDescription}
              onChange={(e) => setFormData({ ...formData, coverageDescription: e.target.value })}
              placeholder="e.g. Full replacement of failed IGBT units, DSP controller, and internal fan assemblies."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Exclusions & Void Scenarios</label>
            <textarea
              rows={3}
              value={formData.exclusions}
              onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
              placeholder="e.g. Third-party physical damage, lightning strike without type-2 SPD, water immersion."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Policy Enforcement Rules */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900">Policy Rules & Validation Checks</h3>
          <p className="text-xs text-slate-500">Configure prerequisite conditions required for activation and claim eligibility.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.isTransferable}
              onChange={(e) => setFormData({ ...formData, isTransferable: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Warranty is Transferable</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.isProofOfPurchaseRequired}
              onChange={(e) => setFormData({ ...formData, isProofOfPurchaseRequired: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Purchase Proof Mandatory</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.isSerialNumberMandatory}
              onChange={(e) => setFormData({ ...formData, isSerialNumberMandatory: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Serial Number Mandatory</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.isInstallationProofRequired}
              onChange={(e) => setFormData({ ...formData, isInstallationProofRequired: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Installation Signoff Required</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.coversReplacement}
              onChange={(e) => setFormData({ ...formData, coversReplacement: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Covers Hardware Replacement</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.coversRepair}
              onChange={(e) => setFormData({ ...formData, coversRepair: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-xs font-medium text-slate-700">Covers Technician Repair</span>
          </label>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Policy Status</label>
          <div className="flex gap-4">
            {(['active', 'draft', 'inactive'] as PolicyStatus[]).map((st) => (
              <label key={st} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="policyStatus"
                  value={st}
                  checked={formData.status === st}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PolicyStatus })}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="capitalize">{st}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

