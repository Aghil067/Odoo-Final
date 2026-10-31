/**
 * ServiceInspectionForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Field-friendly Inspection & Repair recording interface for technicians in M08.
 */

import React, { useState } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  Camera,
  FileCheck,
} from 'lucide-react';
import type {
  ServiceTask,
  ServiceInspectionRecord,
  ServiceRepairRecord,
  RepairOutcome,
  ServicePhoto,
  ServicePhotoType,
  ServiceCustomerConfirmation,
} from '../types/serviceTask.types';

interface ServiceInspectionFormProps {
  task: ServiceTask;
  onSaveInspection: (inspection: ServiceInspectionRecord) => Promise<void>;
  onSaveRepair: (repair: ServiceRepairRecord) => Promise<void>;
  onAddPhoto: (photo: ServicePhoto) => Promise<void>;
  onSaveConfirmation: (confirmation: ServiceCustomerConfirmation) => Promise<void>;
}

export const ServiceInspectionForm: React.FC<ServiceInspectionFormProps> = ({
  task,
  onSaveInspection,
  onSaveRepair,
  onAddPhoto,
  onSaveConfirmation,
}) => {
  // Inspection state
  const [inspection, setInspection] = useState<ServiceInspectionRecord>({
    inspectionDate: task.inspection?.inspectionDate || new Date().toISOString().split('T')[0],
    inspectionTime: task.inspection?.inspectionTime || '11:00 AM',
    equipmentCondition: task.inspection?.equipmentCondition || '',
    observedProblem: task.inspection?.observedProblem || '',
    errorCodes: task.inspection?.errorCodes || '',
    possibleRootCause: task.inspection?.possibleRootCause || '',
    inspectionRemarks: task.inspection?.inspectionRemarks || '',
    faultCategory: task.inspection?.faultCategory || 'Inverter Hardware',
    faultDescription: task.inspection?.faultDescription || '',
    recommendedAction: task.inspection?.recommendedAction || 'Component replacement',
  });

  // Repair state
  const [repair, setRepair] = useState<ServiceRepairRecord>({
    repairRequired: task.repair?.repairRequired ?? true,
    repairDescription: task.repair?.repairDescription || '',
    actionTaken: task.repair?.actionTaken || '',
    repairStartDate: task.repair?.repairStartDate || new Date().toISOString().split('T')[0],
    repairCompletionDate: task.repair?.repairCompletionDate || '',
    outcome: task.repair?.outcome || 'successfully_repaired',
    additionalRemarks: task.repair?.additionalRemarks || '',
  });

  // Customer confirmation state
  const [customerConf, setCustomerConf] = useState<ServiceCustomerConfirmation>({
    customerName: task.customerConfirmation?.customerName || task.customerName,
    confirmed: task.customerConfirmation?.confirmed ?? true,
    remarks: task.customerConfirmation?.remarks || 'Satisfactory on-site rectification confirmed.',
    signaturePlaceholder: task.customerConfirmation?.signaturePlaceholder || `Customer Sign-off (${task.customerName})`,
  });

  const [photoType, setPhotoType] = useState<ServicePhotoType>('during_repair');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveInspectionClick = async () => {
    setIsSaving(true);
    try {
      await onSaveInspection(inspection);
      setSavedNotice('Inspection details saved successfully.');
    } catch (err: any) {
      alert('Failed to save inspection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRepairClick = async () => {
    setIsSaving(true);
    try {
      await onSaveRepair(repair);
      setSavedNotice('Repair details and outcome saved successfully.');
    } catch (err: any) {
      alert('Failed to save repair.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhotoClick = async () => {
    if (!photoUrl.trim()) return;
    try {
      const newPhoto: ServicePhoto = {
        id: `pho-${Date.now()}`,
        photoType,
        url: photoUrl.trim(),
        caption: `${photoType.replace('_', ' ')} image`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: task.assignedTechnicianName || 'Technician',
      };
      await onAddPhoto(newPhoto);
      setPhotoUrl('');
    } catch (err) {
      alert('Failed to add photo.');
    }
  };

  const handleSaveConfirmationClick = async () => {
    setIsSaving(true);
    try {
      await onSaveConfirmation(customerConf);
      setSavedNotice('Customer walkthrough confirmation recorded. Task marked completed!');
    } catch (err) {
      alert('Failed to save customer confirmation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {savedNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex items-center justify-between">
          <span>{savedNotice}</span>
          <button type="button" onClick={() => setSavedNotice(null)} className="font-bold text-green-700 ml-2">
            &times;
          </button>
        </div>
      )}

      {/* 1. On-Site Inspection & Diagnostics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-600" />
            1. Field Inspection & Diagnostics
          </h3>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveInspectionClick}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Save Inspection Findings
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Inspection Date</label>
            <input
              type="date"
              value={inspection.inspectionDate}
              onChange={(e) => setInspection({ ...inspection, inspectionDate: e.target.value })}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Inspection Time</label>
            <input
              type="text"
              value={inspection.inspectionTime}
              onChange={(e) => setInspection({ ...inspection, inspectionTime: e.target.value })}
              placeholder="e.g. 11:30 AM"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Error Code Verified</label>
            <input
              type="text"
              value={inspection.errorCodes || ''}
              onChange={(e) => setInspection({ ...inspection, errorCodes: e.target.value })}
              placeholder="e.g. Err 04, F22"
              className="w-full text-xs px-3 py-1.5 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">Physical Equipment Condition</label>
            <input
              type="text"
              value={inspection.equipmentCondition}
              onChange={(e) => setInspection({ ...inspection, equipmentCondition: e.target.value })}
              placeholder="e.g. Inverter enclosure clean, intact seals, heat sink operating at 42°C"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">Observed Problem on Site</label>
            <textarea
              rows={2}
              value={inspection.observedProblem}
              onChange={(e) => setInspection({ ...inspection, observedProblem: e.target.value })}
              placeholder="Technical observation recorded using clamp meter / multimeter..."
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">Diagnosed Root Cause</label>
            <input
              type="text"
              value={inspection.possibleRootCause}
              onChange={(e) => setInspection({ ...inspection, possibleRootCause: e.target.value })}
              placeholder="e.g. Grid voltage fluctuation exceeding cutoff threshold"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Recommended Action</label>
            <input
              type="text"
              value={inspection.recommendedAction}
              onChange={(e) => setInspection({ ...inspection, recommendedAction: e.target.value })}
              placeholder="e.g. Recalibrate grid trip limit"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Repair Details & Outcome */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-600" />
            2. Repair Execution & Outcome
          </h3>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveRepairClick}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Save Repair Outcome
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Repair Outcome Verdict</label>
            <select
              value={repair.outcome}
              onChange={(e) => setRepair({ ...repair, outcome: e.target.value as RepairOutcome })}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="successfully_repaired">Successfully Repaired on Site</option>
              <option value="temporary_fix">Temporary Operational Fix</option>
              <option value="replacement_required">Replacement Unit Required</option>
              <option value="further_inspection_required">Further Bench Inspection Required</option>
              <option value="unable_to_resolve">Unable to Resolve on Site</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Repair Start Date</label>
            <input
              type="date"
              value={repair.repairStartDate || ''}
              onChange={(e) => setRepair({ ...repair, repairStartDate: e.target.value })}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Repair Completion Date</label>
            <input
              type="date"
              value={repair.repairCompletionDate || ''}
              onChange={(e) => setRepair({ ...repair, repairCompletionDate: e.target.value })}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">Action Taken & Work Performed</label>
            <textarea
              rows={2}
              value={repair.actionTaken}
              onChange={(e) => setRepair({ ...repair, actionTaken: e.target.value })}
              placeholder="e.g. Recalibrated inverter overvoltage parameter to 258V; measured line current; verified generation restored to 5.1kW..."
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Photographs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-600" />
            3. Site Photographic Evidence ({task.photos.length})
          </h3>
          <p className="text-xs text-slate-500">Record before, during, and after repair conditions.</p>
        </div>

        <div className="flex gap-2">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value as ServicePhotoType)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="before_repair">Before Repair</option>
            <option value="during_repair">During Work</option>
            <option value="after_repair">After Repair</option>
            <option value="equipment_condition">Equipment Condition</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Paste image link..."
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
          />
          <button
            type="button"
            onClick={handleAddPhotoClick}
            disabled={!photoUrl.trim()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg disabled:opacity-40"
          >
            Attach Photo
          </button>
        </div>

        {task.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {task.photos.map((p) => (
              <div key={p.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1 space-y-1">
                <img src={p.url} alt={p.caption} className="w-full h-24 object-cover rounded" />
                <span className="text-[10px] font-medium text-slate-600 capitalize block truncate">
                  {p.photoType.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Customer Confirmation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            4. Customer Walkthrough & Handover Sign-off
          </h3>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveConfirmationClick}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Service Task Completion
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Confirming Customer / Representative</label>
            <input
              type="text"
              value={customerConf.customerName}
              onChange={(e) => setCustomerConf({ ...customerConf, customerName: e.target.value })}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Remarks</label>
            <input
              type="text"
              value={customerConf.remarks || ''}
              onChange={(e) => setCustomerConf({ ...customerConf, remarks: e.target.value })}
              placeholder="e.g. Inverter generation restored to 5kW, system working smoothly."
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Electronic Signature Sign-off (Frontend Placeholder)
            </span>
            <p className="text-xs font-mono font-bold text-slate-800">
              {customerConf.signaturePlaceholder || 'Digitally Signed by Customer'}
            </p>
            <p className="text-[10px] text-slate-400">
              Signed on site via technician mobile tablet on {new Date().toLocaleDateString('en-IN')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
