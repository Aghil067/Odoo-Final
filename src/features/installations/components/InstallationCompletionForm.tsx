/**
 * InstallationCompletionForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete installation sign-off and review interface.
 * Captures testing results, electrical parameters, customer confirmation,
 * touch signature pad placeholder, and manager approval controls.
 */

import { useState, useRef } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type {
  InstallationCompletion,
  TestingResult,
} from '../types/execution.types';
import { Button } from '../../../components/ui/Button';

interface InstallationCompletionFormProps {
  existingCompletion?: InstallationCompletion;
  onSubmitCompletion: (
    data: Omit<InstallationCompletion, 'submittedDate' | 'reviewStatus'>
  ) => Promise<void>;
  onReviewCompletion?: (
    decision: 'approved' | 'rejected',
    remarks: string
  ) => Promise<void>;
  defaultCustomerName?: string;
  currentUserName?: string;
  isManager?: boolean;
  canSubmit?: boolean;
}

export function InstallationCompletionForm({
  existingCompletion,
  onSubmitCompletion,
  onReviewCompletion,
  defaultCustomerName = '',
  currentUserName = 'Ramesh Patel',
  isManager = false,
  canSubmit = true,
}: InstallationCompletionFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [completionDate, setCompletionDate] = useState(
    existingCompletion?.actualCompletionDate || today
  );
  const [remarks, setRemarks] = useState(
    existingCompletion?.workCompletionRemarks || ''
  );
  const [testingResult, setTestingResult] = useState<TestingResult>(
    existingCompletion?.testingResult || 'passed'
  );
  const [gridSync, setGridSync] = useState(
    existingCompletion?.gridSyncVerified ?? true
  );
  const [voc, setVoc] = useState(
    existingCompletion?.vocMeasuredVolts?.toString() || '415'
  );
  const [isc, setIsc] = useState(
    existingCompletion?.iscMeasuredAmps?.toString() || '12.6'
  );
  const [genKw, setGenKw] = useState(
    existingCompletion?.inverterGenerationKw?.toString() || '3.2'
  );
  const [customerName, setCustomerName] = useState(
    existingCompletion?.customerName || defaultCustomerName
  );
  const [confirmed, setConfirmed] = useState(
    existingCompletion?.customerConfirmation ?? false
  );
  const [signaturePlaceholder, setSignaturePlaceholder] = useState<string>(
    existingCompletion?.customerSignatureData || ''
  );
  const [feedback, setFeedback] = useState(
    existingCompletion?.customerFeedbackRemarks || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerRemarks, setManagerRemarks] = useState(
    existingCompletion?.reviewRemarks || ''
  );

  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setSignaturePlaceholder(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignaturePlaceholder('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      alert('Customer confirmation checkbox must be ticked before submission.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitCompletion({
        actualCompletionDate: completionDate,
        workCompletionRemarks: remarks,
        testingResult,
        gridSyncVerified: gridSync,
        vocMeasuredVolts: parseFloat(voc) || undefined,
        iscMeasuredAmps: parseFloat(isc) || undefined,
        inverterGenerationKw: parseFloat(genKw) || undefined,
        customerName,
        customerConfirmation: confirmed,
        customerSignatureData: signaturePlaceholder || 'signed_digitally_by_customer',
        customerFeedbackRemarks: feedback,
        submittedBy: currentUserName,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerDecision = async (decision: 'approved' | 'rejected') => {
    if (!onReviewCompletion) return;
    try {
      setIsSubmitting(true);
      await onReviewCompletion(decision, managerRemarks);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitted = !!existingCompletion;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Installation Completion & Customer Sign-off
            </h3>
            <p className="text-xs text-slate-500">
              Technical commissioning report, field testing verification, and client handover
            </p>
          </div>
        </div>

        {isSubmitted && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                existingCompletion.reviewStatus === 'approved'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : existingCompletion.reviewStatus === 'rejected'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Manager Review: {existingCompletion.reviewStatus.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Testing & Commissioning */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>1. System Testing & Commissioning Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                System Testing Result *
              </label>
              <select
                value={testingResult}
                disabled={isSubmitted}
                onChange={(e) => setTestingResult(e.target.value as TestingResult)}
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              >
                <option value="passed">Passed (All Parameters Nominal)</option>
                <option value="requires_inspection">Requires Further Inspection</option>
                <option value="failed">Failed (Defects Detected)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Actual Completion Date *
              </label>
              <input
                type="date"
                value={completionDate}
                disabled={isSubmitted}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridSync}
                  disabled={isSubmitted}
                  onChange={(e) => setGridSync(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span>Grid Synchronisation Verified</span>
              </label>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Measured Voc (Volts DC)
              </label>
              <input
                type="number"
                step="0.1"
                value={voc}
                disabled={isSubmitted}
                onChange={(e) => setVoc(e.target.value)}
                placeholder="e.g. 415"
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Measured Isc (Amps DC)
              </label>
              <input
                type="number"
                step="0.1"
                value={isc}
                disabled={isSubmitted}
                onChange={(e) => setIsc(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Inverter Active Generation (kW)
              </label>
              <input
                type="number"
                step="0.01"
                value={genKw}
                disabled={isSubmitted}
                onChange={(e) => setGenKw(e.target.value)}
                placeholder="e.g. 3.2"
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Technician Handover & Testing Remarks *
            </label>
            <textarea
              rows={2}
              value={remarks}
              disabled={isSubmitted}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Record testing notes, grid voltages, inverter firmware version, and client briefing..."
              required
              className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
            />
          </div>
        </div>

        {/* Section 2: Customer Confirmation & Signature */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>2. Customer Handover & Confirmation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                disabled={isSubmitted}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Feedback / Comments
              </label>
              <input
                type="text"
                value={feedback}
                disabled={isSubmitted}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Satisfied with installation, app working smoothly"
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
              />
            </div>
          </div>

          {/* Customer Confirmation Checkbox */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-md">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={isSubmitted}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-900 leading-relaxed font-medium">
                I hereby confirm that the solar rooftop system installation has been completed at my premises, verified in operating condition, and that system operation and emergency shutdown procedures have been explained to me.
              </span>
            </label>
          </div>

          {/* Signature Capture Area Placeholder */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Signature Capture (On-Screen Touch Pad)</span>
              </label>
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Pad
                </button>
              )}
            </div>

            <div className="border border-slate-300 rounded-lg p-1 bg-white inline-block w-full">
              {isSubmitted && existingCompletion?.customerSignatureData ? (
                <div className="h-28 bg-slate-50 rounded flex items-center justify-center text-xs font-mono text-slate-600">
                  <span className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded text-emerald-800 font-semibold">
                    ✓ Verified Customer Digital Sign-off: {existingCompletion.customerName}
                  </span>
                </div>
              ) : (
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-28 bg-slate-50 rounded cursor-crosshair border border-dashed border-slate-200"
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Notice: Captured on field device as a frontend sign-off confirmation. Final legal warranty execution is administered in Module M07.
            </p>
          </div>
        </div>

        {/* Action Buttons for Technician Submission */}
        {!isSubmitted && canSubmit && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={isSubmitting || !confirmed}
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Submit Completion Dossier
            </Button>
          </div>
        )}
      </form>

      {/* Section 3: Manager Review Controls */}
      {isSubmitted && isManager && (
        <div className="border-t-2 border-slate-200 pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-semibold text-slate-900">
              Installation Manager Dossier Verification
            </h4>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>Submitted By: <strong>{existingCompletion.submittedBy}</strong></div>
            <div>Submitted On: <strong>{new Date(existingCompletion.submittedDate).toLocaleString()}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Manager Verification Remarks
            </label>
            <textarea
              rows={2}
              value={managerRemarks}
              onChange={(e) => setManagerRemarks(e.target.value)}
              placeholder="e.g. Electrical readings cross-checked. Structure warranty checklist complete. Approved for commissioning."
              className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleManagerDecision('rejected')}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Return for Revision
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleManagerDecision('approved')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve & Verify Installation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
