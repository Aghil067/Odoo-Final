/**
 * WarrantyRegistrationForm.tsx
 * ─────────────────────────────────────────────────────────────
 * 7-Step Warranty Registration Wizard for M07.
 * Fully integrates with M01 Customers, M04 Serials, M05 Installations.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Wrench,
  Cpu,
  Shield,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import type {
  WarrantyRegistrationFormData,
} from '../types/warranty.types';
import type { WarrantyPolicy } from '../types/warrantyPolicy.types';
import { warrantyPolicyService } from '../services/warrantyPolicyService';
import { customerService } from '../../crm/services/customerService';
import { installationService } from '../../installations/services/installationService';
import { serialNumberService } from '../../inventory/services/serialNumberService';
import { productService } from '../../inventory/services/productService';
import { WarrantyDocumentUpload } from './WarrantyDocumentUpload';

interface WarrantyRegistrationFormProps {
  onSubmit: (data: WarrantyRegistrationFormData) => Promise<void>;
}

export const WarrantyRegistrationForm: React.FC<WarrantyRegistrationFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // External data options
  const [customers, setCustomers] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [policies, setPolicies] = useState<WarrantyPolicy[]>([]);

  // Form State
  const [formData, setFormData] = useState<WarrantyRegistrationFormData>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',

    installationId: '',
    installationRef: '',
    siteAddress: '',
    siteCity: '',
    siteState: '',
    deliveryRef: '',
    deliveryDate: '',
    installationDate: '',

    productId: '',
    productName: '',
    sku: '',
    productCategory: 'inverter',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    serialNumberId: '',

    policyId: '',
    policyRef: '',
    policyName: '',
    coverageType: 'manufacturer',
    durationValue: 2,
    durationUnit: 'years',
    activationBasis: 'installation_date',

    warrantyStartDate: new Date().toISOString().split('T')[0],
    warrantyExpiryDate: '',
    isDateOverridden: false,
    overrideRemarks: '',

    documents: [],
    remarks: '',
    saveAsDraft: false,
  });

  // Load external data for selectors
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, instRes, serRes, prodRes, polRes] = await Promise.all([
          customerService.list(),
          installationService.list(),
          serialNumberService.list(),
          productService.list(),
          warrantyPolicyService.list({ status: 'active' }),
        ]);

        setCustomers(custRes.data || []);
        setInstallations(Array.isArray(instRes) ? instRes : (instRes as any).data || []);
        setSerialNumbers(serRes.data || []);
        setProducts(prodRes.data || []);
        setPolicies(polRes.data || []);
      } catch (err) {
        console.error('Failed to load form prerequisites', err);
      }
    }
    loadData();
  }, []);

  // Recalculate expiry date whenever start date or policy duration changes
  useEffect(() => {
    if (formData.warrantyStartDate && formData.durationValue) {
      if (!formData.isDateOverridden) {
        const start = new Date(formData.warrantyStartDate);
        if (!isNaN(start.getTime())) {
          const exp = new Date(start);
          if (formData.durationUnit === 'years') {
            exp.setFullYear(exp.getFullYear() + formData.durationValue);
          } else {
            exp.setMonth(exp.getMonth() + formData.durationValue);
          }
          setFormData((prev) => ({
            ...prev,
            warrantyExpiryDate: exp.toISOString().split('T')[0],
          }));
        }
      }
    }
  }, [formData.warrantyStartDate, formData.durationValue, formData.durationUnit, formData.isDateOverridden]);

  // Handle Step 1: Customer Selection
  const handleSelectCustomer = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    }));
  };

  // Handle Step 2: Installation Selection
  const handleSelectInstallation = (inst: any) => {
    const defaultDate = inst.status === 'completed' ? '2026-10-27' : '';
    setFormData((prev) => ({
      ...prev,
      installationId: inst.id,
      installationRef: inst.installationId,
      siteAddress: inst.siteAddress,
      siteCity: inst.siteCity,
      siteState: inst.siteState,
      installationDate: defaultDate,
      warrantyStartDate: defaultDate || prev.warrantyStartDate,
    }));
  };

  // Handle Step 3: Equipment & Serial selection
  const handleSelectSerial = (serial: any) => {
    setFormData((prev) => ({
      ...prev,
      productId: serial.productId,
      productName: serial.productName,
      sku: serial.sku,
      productCategory: serial.category,
      manufacturer: serial.manufacturer,
      modelNumber: serial.modelNumber,
      serialNumber: serial.serialNumber,
      serialNumberId: serial.id,
    }));
  };

  // Handle Step 4: Policy Selection
  const handleSelectPolicy = (policy: WarrantyPolicy) => {
    setFormData((prev) => ({
      ...prev,
      policyId: policy.id,
      policyRef: policy.policyId,
      policyName: policy.policyName,
      coverageType: policy.coverageType,
      durationValue: policy.durationValue,
      durationUnit: policy.durationUnit,
      activationBasis: policy.activationBasis,
    }));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && !formData.customerId) {
      setError('Please select an existing customer from the customer directory.');
      return;
    }
    if (currentStep === 3 && !formData.productId) {
      setError('Please select equipment or a serial number to register warranty for.');
      return;
    }
    if (currentStep === 4 && !formData.policyId) {
      setError('Please select an active warranty policy.');
      return;
    }
    if (currentStep === 5 && !formData.warrantyExpiryDate) {
      setError('Warranty Expiry Date is required.');
      return;
    }
    if (currentStep === 5 && formData.isDateOverridden && !formData.overrideRemarks?.trim()) {
      setError('Please provide an explanation for overriding the calculated expiry date.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (saveAsDraft = false) => {
    setError(null);
    try {
      setIsSubmitting(true);
      await onSubmit({ ...formData, saveAsDraft });
      navigate('/warranty/records');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete warranty registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Customer', icon: User },
    { num: 2, label: 'Installation Ref', icon: Wrench },
    { num: 3, label: 'Equipment & Serial', icon: Cpu },
    { num: 4, label: 'Warranty Policy', icon: Shield },
    { num: 5, label: 'Coverage Dates', icon: Calendar },
    { num: 6, label: 'Supporting Proof', icon: FileText },
    { num: 7, label: 'Review & Register', icon: CheckCircle },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Equipment Warranty Registration</h2>
          <p className="text-xs text-slate-500">
            Link equipment serials to customers, installation sign-offs, and factory warranty policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/warranty/records')}
          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      {/* 7-Step Progress Stepper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[640px]">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted || s.num < currentStep) setCurrentStep(s.num);
                  }}
                  className={`flex flex-col items-center gap-1 group text-center transition-opacity ${
                    isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">{s.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > s.num ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[380px]">
        {/* ── STEP 1: SELECT CUSTOMER (M01) ──────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 1: Select Customer</h3>
              <p className="text-xs text-slate-500">
                Choose an existing customer from M01. Records are reused directly without duplication.
              </p>
            </div>

            {formData.customerId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-green-700 uppercase">Selected Customer</span>
                  <p className="text-sm font-bold text-slate-900">{formData.customerName}</p>
                  <p className="text-xs text-slate-600 font-mono">
                    {formData.customerPhone} • {formData.customerEmail}
                  </p>
                </div>
                <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full">
                  Confirmed
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Available Customers:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {customers.map((c) => {
                  const isSelected = formData.customerId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{c.customerId || c.id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {c.phone} • {c.email}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: SELECT INSTALLATION OR DELIVERY (M05) ────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 2: Select Installation or Delivery Reference</h3>
              <p className="text-xs text-slate-500">
                Link to M05 Installation Work Order to pull site address and verified completion date.
              </p>
            </div>

            {formData.installationRef && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-green-700 uppercase">Linked Installation</span>
                  <p className="text-sm font-bold text-slate-900">{formData.installationRef}</p>
                  <p className="text-xs text-slate-600">
                    {formData.siteAddress}, {formData.siteCity}
                  </p>
                </div>
                <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full">
                  Linked
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Matching Installations for Customer:</label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {installations
                  .filter((inst) => !formData.customerId || inst.customerId === formData.customerId || inst.customerName.toLowerCase().includes(formData.customerName.toLowerCase()))
                  .map((inst) => {
                    const isSelected = formData.installationRef === inst.installationId;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => handleSelectInstallation(inst)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900 font-mono">
                            {inst.installationId} • {inst.title}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                              inst.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Status: {inst.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Site: {inst.siteAddress}, {inst.siteCity} ({inst.sitePincode})
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Optional: You may proceed without an installation reference if registering standalone over-the-counter equipment.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: SELECT EQUIPMENT & SERIAL (M04) ─────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 3: Select Equipment & Serial Number</h3>
              <p className="text-xs text-slate-500">
                Equipment and serial numbers are pulled directly from M04 inventory tracking.
              </p>
            </div>

            {formData.serialNumber && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-green-700 uppercase">Selected Serial Unit</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{formData.serialNumber}</p>
                  <p className="text-xs text-slate-600">
                    {formData.productName} ({formData.manufacturer} {formData.modelNumber})
                  </p>
                </div>
                <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full">
                  Verified Serial
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Available Tracked Serial Units (M04):</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {serialNumbers.map((s) => {
                  const isSelected = formData.serialNumber === s.serialNumber;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSerial(s)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 font-mono text-green-700">
                          {s.serialNumber}
                        </span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded capitalize font-medium text-slate-600">
                          {s.category}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-1 truncate">{s.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.manufacturer} • Model: {s.modelNumber}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fallback product selection for batch/unserialized */}
              <div className="pt-2">
                <span className="text-xs font-medium text-slate-700 block mb-1">
                  Or select non-serialized product (Batch registration):
                </span>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      setFormData((prev) => ({
                        ...prev,
                        productId: prod.id,
                        productName: prod.name,
                        sku: prod.sku,
                        productCategory: prod.category,
                        manufacturer: prod.manufacturer,
                        modelNumber: prod.modelNumber || '',
                        serialNumber: '',
                        serialNumberId: '',
                      }));
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">-- Choose Product directly --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - {p.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: SELECT WARRANTY POLICY ──────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 4: Select Active Warranty Policy</h3>
              <p className="text-xs text-slate-500">
                Choose the applicable coverage policy for category: <span className="capitalize font-semibold text-slate-800">{formData.productCategory.replace('_', ' ')}</span>
              </p>
            </div>

            {formData.policyRef && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-green-700 uppercase">Selected Policy</span>
                  <p className="text-sm font-bold text-slate-900">{formData.policyName}</p>
                  <p className="text-xs text-slate-600">
                    Duration: {formData.durationValue} {formData.durationUnit} • Basis: {formData.activationBasis.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full">
                  Policy Attached
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto">
                {policies
                  .filter((p) => !formData.productCategory || p.productCategory === formData.productCategory || p.productCategory === 'inverter')
                  .map((pol) => {
                    const isSelected = formData.policyId === pol.id;
                    return (
                      <div
                        key={pol.id}
                        onClick={() => handleSelectPolicy(pol)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{pol.policyName}</span>
                          <span className="text-xs font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {pol.durationValue} {pol.durationUnit}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{pol.description}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">Type: {pol.coverageType}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Activation: {pol.activationBasis.replace('_', ' ')}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Mfr: {pol.manufacturer}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: WARRANTY DATES & OVERRIDES ───────────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 5: Warranty Coverage Dates</h3>
              <p className="text-xs text-slate-500">
                Calculates expiry date from start date and policy duration ({formData.durationValue} {formData.durationUnit}).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Warranty Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.warrantyStartDate}
                  onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Based on: {formData.activationBasis.replace('_', ' ')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Policy Duration</label>
                <input
                  type="text"
                  disabled
                  value={`${formData.durationValue} ${formData.durationUnit}`}
                  className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Calculated Expiry Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={!formData.isDateOverridden}
                  value={formData.warrantyExpiryDate}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiryDate: e.target.value })}
                  className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 ${
                    formData.isDateOverridden ? 'bg-amber-50 border-amber-300' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Date Override Option */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDateOverridden}
                  onChange={(e) => setFormData({ ...formData, isDateOverridden: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Override Calculated Expiry Date (Special Commercial Authorization)
                </span>
              </label>

              {formData.isDateOverridden && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mandatory Override Explanation <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.overrideRemarks || ''}
                    onChange={(e) => setFormData({ ...formData, overrideRemarks: e.target.value })}
                    placeholder="State reason for manual date adjustment (e.g. promotional grace period or replacement credit)..."
                    className="w-full text-xs px-3 py-2 border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 6: SUPPORTING PROOF & DOCUMENTS ────────────────────────── */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 6: Supporting Information & Evidence</h3>
              <p className="text-xs text-slate-500">
                Upload installation handover sheets, delivery slips, or invoices required for activation.
              </p>
            </div>

            <WarrantyDocumentUpload
              documents={formData.documents}
              onChange={(docs) => setFormData({ ...formData, documents: docs })}
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">General Registration Remarks</label>
              <textarea
                rows={2}
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Any technician remarks, physical condition notes, or customer handover remarks..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {/* ── STEP 7: REVIEW AND REGISTER ─────────────────────────────────── */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Step 7: Review & Finalize Registration</h3>
              <p className="text-xs text-slate-500">
                Confirm all warranty parameters before saving draft or submitting for supervisor activation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer & Site */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Customer & Installation
                </span>
                <p className="font-bold text-slate-900 text-sm">{formData.customerName}</p>
                <p className="text-slate-600">{formData.customerPhone}</p>
                <p className="text-slate-600">{formData.customerEmail}</p>
                <p className="text-slate-700 font-medium pt-1">
                  Installation: {formData.installationRef || 'Standalone Equipment'}
                </p>
                {formData.siteAddress && (
                  <p className="text-slate-500 text-[11px]">{formData.siteAddress}, {formData.siteCity}</p>
                )}
              </div>

              {/* Equipment & Serial */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Equipment Details
                </span>
                <p className="font-bold text-slate-900 text-sm">{formData.productName}</p>
                <p className="text-green-700 font-mono font-semibold">
                  Serial: {formData.serialNumber || 'Non-serialized Batch'}
                </p>
                <p className="text-slate-600">Manufacturer: {formData.manufacturer}</p>
                <p className="text-slate-600">Model: {formData.modelNumber || 'N/A'}</p>
              </div>

              {/* Policy & Coverage */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Policy & Duration
                </span>
                <p className="font-bold text-slate-900 text-sm">{formData.policyName}</p>
                <p className="text-slate-600 capitalize">Type: {formData.coverageType} Warranty</p>
                <p className="text-slate-600">
                  Duration: {formData.durationValue} {formData.durationUnit}
                </p>
                <p className="text-slate-600">
                  Activation Basis: {formData.activationBasis.replace('_', ' ')}
                </p>
              </div>

              {/* Coverage Dates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Coverage Dates
                </span>
                <p className="text-slate-700">
                  Start Date: <span className="font-mono font-bold text-slate-900">{formData.warrantyStartDate}</span>
                </p>
                <p className="text-slate-700">
                  Expiry Date: <span className="font-mono font-bold text-slate-900">{formData.warrantyExpiryDate}</span>
                </p>
                {formData.isDateOverridden && (
                  <p className="text-amber-700 font-medium text-[11px]">
                    * Date manually overridden: {formData.overrideRemarks}
                  </p>
                )}
                <p className="text-slate-500 text-[11px]">
                  Attached Documents: {formData.documents.length} files
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1 || isSubmitting}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Step
        </button>

        <div className="flex items-center gap-2">
          {currentStep === 7 ? (
            <>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Registering...' : 'Register Warranty'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Continue to Step {currentStep + 1}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
