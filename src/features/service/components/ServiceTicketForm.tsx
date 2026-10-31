/**
 * ServiceTicketForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Structured Service Request Form for Module M08.
 * Integrates with M01 Customers, M04 Serials, M05 Installations, M07 Warranties.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Wrench,
  Cpu,
  AlertTriangle,
  Camera,
  Save,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import type {
  ServiceTicketFormData,
  ServiceIssueCategory,
  ServicePriority,
  ServiceWarrantyIndicator,
} from '../types/serviceTicket.types';
import { customerService } from '../../crm/services/customerService';
import { installationService } from '../../installations/services/installationService';
import { serialNumberService } from '../../inventory/services/serialNumberService';
import { warrantyService } from '../../warranty/services/warrantyService';
import { WarrantyInfoPanel } from './WarrantyInfoPanel';

interface ServiceTicketFormProps {
  onSubmit: (data: ServiceTicketFormData) => Promise<void>;
}

export const ServiceTicketForm: React.FC<ServiceTicketFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoInput, setPhotoInput] = useState('');

  const [formData, setFormData] = useState<ServiceTicketFormData>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',

    installationId: '',
    installationRef: '',
    siteAddress: '',
    siteCity: '',
    systemType: '',
    systemCapacity: '',

    productId: '',
    productName: '',
    productCategory: 'inverter',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    equipmentLocation: '',

    warrantyId: '',
    warrantyRef: '',
    warrantyStatus: '',
    warrantyStartDate: '',
    warrantyExpiryDate: '',
    warrantyCoverageType: '',
    warrantyIndicator: 'unavailable',

    issueCategory: 'inverter_failure',
    issueTitle: '',
    detailedDescription: '',
    reportedDate: new Date().toISOString().split('T')[0],
    issueOccurrenceDate: '',
    priority: 'high',
    customerObservations: '',
    errorCode: '',

    supportingPhotos: [],
    remarks: '',
    saveAsDraft: false,
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [cRes, iRes, sRes, wRes] = await Promise.all([
          customerService.list(),
          installationService.list(),
          serialNumberService.list(),
          warrantyService.list(),
        ]);

        setCustomers(cRes.data || []);
        setInstallations(Array.isArray(iRes) ? iRes : (iRes as any).data || []);
        setSerialNumbers(sRes.data || []);
        setWarranties(wRes.data || []);
      } catch (err) {
        console.error('Failed to load prerequisite options', err);
      }
    }
    loadOptions();
  }, []);

  // When customer is selected, optionally populate contact info
  const handleSelectCustomer = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address || '',
    }));
  };

  // When installation is selected
  const handleSelectInstallation = (inst: any) => {
    setFormData((prev) => ({
      ...prev,
      installationId: inst.id,
      installationRef: inst.installationId,
      siteAddress: inst.siteAddress,
      siteCity: inst.siteCity,
      systemType: inst.systemType || 'Rooftop Solar',
      systemCapacity: inst.systemCapacity || '',
    }));
  };

  // When serial number is selected, auto-check M07 warranty
  const handleSelectSerial = (serial: any) => {
    // Look up warranty for this serial in M07
    const matchedWarranty = warranties.find(
      (w) => w.serialNumber === serial.serialNumber || (w.productId === serial.productId && w.customerId === formData.customerId)
    );

    let indicator: ServiceWarrantyIndicator = 'none';
    if (matchedWarranty) {
      if (matchedWarranty.status === 'active') indicator = 'active';
      else if (matchedWarranty.status === 'expired') indicator = 'expired';
      else if (matchedWarranty.status === 'pending_activation') indicator = 'pending_activation';
    }

    setFormData((prev) => ({
      ...prev,
      productId: serial.productId,
      productName: serial.productName,
      productCategory: serial.category,
      manufacturer: serial.manufacturer,
      modelNumber: serial.modelNumber,
      serialNumber: serial.serialNumber,

      warrantyId: matchedWarranty?.id,
      warrantyRef: matchedWarranty?.warrantyId,
      warrantyStatus: matchedWarranty?.status,
      warrantyStartDate: matchedWarranty?.warrantyStartDate,
      warrantyExpiryDate: matchedWarranty?.warrantyExpiryDate,
      warrantyCoverageType: matchedWarranty?.coverageType,
      warrantyIndicator: indicator,
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

    if (!formData.customerId) {
      setError('Please select an existing customer from M01.');
      return;
    }

    if (!formData.productName.trim()) {
      setError('Please select or enter the equipment being serviced.');
      return;
    }

    if (!formData.issueTitle.trim()) {
      setError('Please enter a descriptive issue title.');
      return;
    }

    if (!formData.detailedDescription.trim()) {
      setError('Detailed description of the fault is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ ...formData, saveAsDraft: isDraft });
      navigate('/service/tickets');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit service ticket.');
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
          onClick={() => navigate('/service/tickets')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets List
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/service/tickets')}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Service Ticket'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Section A: Customer Information (M01) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Customer Information (M01 CRM)
          </h3>
          <p className="text-xs text-slate-500">
            Select an existing customer. New customers must be registered via the CRM pipeline.
          </p>
        </div>

        {formData.customerId ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] font-medium text-green-700 uppercase">Selected Customer</span>
              <p className="font-bold text-slate-900 text-sm">{formData.customerName}</p>
              <p className="text-slate-600 font-mono">
                {formData.customerPhone} • {formData.customerEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, customerId: '', customerName: '' }))}
              className="text-xs text-slate-500 hover:text-rose-600 underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => {
                const c = customers.find((cust) => cust.id === e.target.value);
                if (c) handleSelectCustomer(c);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.city || 'Indiranagar'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Section B: Installation Link (M05) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-600" />
            Installation Work Order Reference (M05)
          </h3>
          <p className="text-xs text-slate-500">
            Link to the customer's solar installation project to pull rooftop site details.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Linked Solar Installation
          </label>
          <select
            value={formData.installationId}
            onChange={(e) => {
              const inst = installations.find((i) => i.id === e.target.value || i.installationId === e.target.value);
              if (inst) handleSelectInstallation(inst);
            }}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">-- Select Installation (or Standalone Service) --</option>
            {installations.map((i) => (
              <option key={i.id} value={i.id}>
                {i.installationId} • {i.title} ({i.customerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section C: Equipment & Serial Number (M04) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-green-600" />
            Affected Equipment & Serial Scan (M04)
          </h3>
          <p className="text-xs text-slate-500">
            Select the specific hardware unit or barcode serial number requiring service.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Serial-Tracked Unit (M04)
            </label>
            <select
              value={formData.serialNumber}
              onChange={(e) => {
                const s = serialNumbers.find((sn) => sn.serialNumber === e.target.value);
                if (s) handleSelectSerial(s);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">-- Choose verified serial number --</option>
              {serialNumbers.map((s) => (
                <option key={s.id} value={s.serialNumber}>
                  {s.serialNumber} — {s.productName} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Name / Model <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g. Solis 5kW 3-Phase On-grid Inverter"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Location at Site
            </label>
            <input
              type="text"
              value={formData.equipmentLocation || ''}
              onChange={(e) => setFormData({ ...formData, equipmentLocation: e.target.value })}
              placeholder="e.g. Rooftop Terrace rack 2, South exterior wall"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Serial Number (Manual Entry if non-tracked)
            </label>
            <input
              type="text"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="e.g. SOLIS-5K-2026-00118"
              className="w-full text-xs px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Section D: Warranty Coverage Preview (M07) */}
      <WarrantyInfoPanel
        indicator={formData.warrantyIndicator}
        warrantyId={formData.warrantyId}
        warrantyRef={formData.warrantyRef}
        warrantyStatus={formData.warrantyStatus}
        warrantyStartDate={formData.warrantyStartDate}
        warrantyExpiryDate={formData.warrantyExpiryDate}
        warrantyCoverageType={formData.warrantyCoverageType}
      />

      {/* Section E: Issue Details */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Service Issue & Defect Details
          </h3>
          <p className="text-xs text-slate-500">Document fault symptoms, error codes, and customer remarks.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.issueCategory}
              onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value as ServiceIssueCategory })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="inverter_failure">Inverter Failure / Tripping</option>
              <option value="battery_problem">Battery Storage Drain</option>
              <option value="solar_panel_damage">Solar Panel Damage</option>
              <option value="low_power_generation">Low Power Generation</option>
              <option value="charge_controller_failure">Charge Controller Failure</option>
              <option value="electrical_fault">Electrical Short / Breaker Trip</option>
              <option value="wiring_problem">Wiring & Conduit Issue</option>
              <option value="earthing_problem">Earthing Resistance Problem</option>
              <option value="physical_damage">Physical / Storm Damage</option>
              <option value="general_maintenance">General Routine Maintenance</option>
              <option value="other">Other Hardware Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Priority Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as ServicePriority })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="critical">Critical (Complete System Shutdown)</option>
              <option value="high">High (Daily Tripping / Generation Loss)</option>
              <option value="medium">Medium (Partial Output Loss)</option>
              <option value="low">Low (Minor Telemetry / Cable Clip)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fault Error Code (if shown on LCD)
            </label>
            <input
              type="text"
              value={formData.errorCode || ''}
              onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
              placeholder="e.g. Err 04, F22, E01"
              className="w-full text-xs px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Title / Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.issueTitle}
              onChange={(e) => setFormData({ ...formData, issueTitle: e.target.value })}
              placeholder="e.g. Inverter tripping daily at noon with Err 04 Grid Voltage Overload"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.detailedDescription}
              onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
              placeholder="Describe what occurred, how long the issue has persisted, customer observations, and technician instructions..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Section F: Photographs & Evidence */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-600" />
            Supporting Photographs & Error Screen Evidence
          </h3>
          <p className="text-xs text-slate-500">Attach photos of the physical damage, LCD error message, or site condition.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste photo image URL or reference..."
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
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
