/**
 * WarrantyClaimReview.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive Claim Review Interface for Admin & Service Manager in M07.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  User,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';
import type {
  WarrantyClaim,
  ClaimEligibilityChecklist,
  EligibilityOutcome,
} from '../types/warrantyClaim.types';
import { ISSUE_CATEGORY_LABELS } from '../types/warrantyClaim.types';
import { ClaimStatusBadge, ClaimPriorityBadge } from './ClaimStatusBadge';
import { WarrantyEligibilityPanel } from './WarrantyEligibilityPanel';
import { WarrantyResolutionForm } from './WarrantyResolutionForm';

interface WarrantyClaimReviewProps {
  claim: WarrantyClaim;
  onReviewSubmit: (reviewData: {
    decision: 'approved' | 'rejected' | 'ineligible' | 'info_requested';
    reviewerId: string;
    reviewerName: string;
    reasonOrRemarks: string;
    checklist: ClaimEligibilityChecklist;
    outcome: EligibilityOutcome;
  }) => Promise<void>;
  onResolutionSave: (resolution: any) => Promise<void>;
  userRole?: string;
}

export const WarrantyClaimReview: React.FC<WarrantyClaimReviewProps> = ({
  claim,
  onReviewSubmit,
  onResolutionSave,
  userRole = 'admin',
}) => {
  const navigate = useNavigate();
  const canReview = userRole === 'admin' || userRole === 'service_manager';

  const [checklist, setChecklist] = useState<ClaimEligibilityChecklist>(claim.eligibility.checklist);
  const [outcome, setOutcome] = useState<EligibilityOutcome>(claim.eligibility.outcome);
  const [reason, setReason] = useState(claim.reviewDecision?.reasonOrRemarks || '');
  const [decisionModal, setDecisionModal] = useState<'approved' | 'rejected' | 'ineligible' | 'info_requested' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleDecisionConfirm = async () => {
    if (!decisionModal) return;
    if ((decisionModal === 'rejected' || decisionModal === 'ineligible') && !reason.trim()) {
      alert('A justification reason is mandatory for rejection or ineligibility.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onReviewSubmit({
        decision: decisionModal,
        reviewerId: 'usr-service-mgr',
        reviewerName: userRole === 'admin' ? 'Admin User' : 'Service Manager',
        reasonOrRemarks: reason.trim() || `Claim marked ${decisionModal} by ${userRole}.`,
        checklist,
        outcome,
      });
      setNotification(`Claim successfully updated with decision: ${decisionModal.toUpperCase()}`);
      setDecisionModal(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
          <Link
            to={`/warranty/${claim.warrantyId}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-green-600" />
            View Parent Warranty
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex items-center justify-between">
          <span>{notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="font-bold text-green-700 ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Top Claim Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {claim.claimId}
              </span>
              <ClaimStatusBadge status={claim.status} />
              <ClaimPriorityBadge priority={claim.priority} />
              <span className="text-xs text-slate-400 font-mono">Date: {claim.claimDate}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{claim.issueTitle}</h1>
            <p className="text-xs text-slate-500">
              Category: <span className="font-semibold text-slate-800">{ISSUE_CATEGORY_LABELS[claim.issueCategory] || claim.issueCategory}</span> • Customer: <span className="font-semibold text-slate-800">{claim.customerName}</span>
            </p>
          </div>

          {/* Supervisor Decision Trigger Buttons */}
          {canReview && claim.status !== 'resolved' && claim.status !== 'closed' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDecisionModal('approved')}
                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Claim
              </button>
              <button
                type="button"
                onClick={() => setDecisionModal('rejected')}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Claim
              </button>
              <button
                type="button"
                onClick={() => setDecisionModal('info_requested')}
                className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Request Info
              </button>
              <button
                type="button"
                onClick={() => setDecisionModal('ineligible')}
                className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
              >
                Mark Ineligible
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Defect Dossier & Customer/Equipment Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Customer & Equipment Specs */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Customer Details
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-900">{claim.customerName}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-800">{claim.customerPhone}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{claim.customerEmail}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-600" />
              Equipment & Warranty
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-medium text-slate-900 text-right">{claim.productName}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Serial Number:</span>
                <span className="font-mono font-bold text-green-700">{claim.serialNumber || 'N/A'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Warranty ID:</span>
                <span className="font-mono text-slate-800 font-semibold">{claim.warrantyRef}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Installation Ref:</span>
                <span className="font-mono text-slate-800">{claim.installationRef || 'Over-the-counter'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Failure Dossier & Photographs */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Reported Malfunction & Diagnostic Symptoms
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Detailed Description:</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                  {claim.detailedDescription}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Error Code / Indicator</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {claim.errorCode || 'No specific error code shown'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Observed Symptoms</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {claim.failureSymptoms || 'Standard tripping behavior'}
                  </span>
                </div>
              </div>

              {claim.equipmentCondition && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Physical Condition on Inspection:</span>
                  <p className="text-slate-600">{claim.equipmentCondition}</p>
                </div>
              )}
            </div>

            {/* Photos */}
            {claim.supportingPhotos && claim.supportingPhotos.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Attached Photographic Proof ({claim.supportingPhotos.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {claim.supportingPhotos.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={img} alt={`Claim evidence ${idx + 1}`} className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Point Eligibility Verification Matrix */}
      <WarrantyEligibilityPanel
        checklist={checklist}
        outcome={outcome}
        notes={claim.eligibility.notes}
        isEditable={canReview && claim.status !== 'resolved'}
        onChecklistChange={setChecklist}
        onOutcomeChange={setOutcome}
      />

      {/* Decision Summary Card (if already made) */}
      {claim.reviewDecision && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide">
            Official Review Decision: <span className="text-green-700">{claim.reviewDecision.decision.toUpperCase()}</span>
          </h4>
          <p className="text-slate-600">
            Recorded by <span className="font-medium text-slate-800">{claim.reviewDecision.reviewerName}</span> on{' '}
            {new Date(claim.reviewDecision.decisionDate).toLocaleDateString('en-IN')}:
          </p>
          <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 italic">
            "{claim.reviewDecision.reasonOrRemarks}"
          </p>
        </div>
      )}

      {/* Resolution & Repair/Replacement Section */}
      <WarrantyResolutionForm
        initialResolution={claim.resolution}
        onSave={onResolutionSave}
        productId={claim.productId}
        isReadOnly={!canReview || claim.status === 'resolved'}
      />

      {/* Supervisor Decision Dialog Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Confirm Decision: <span className="uppercase text-green-700">{decisionModal}</span>
            </h3>
            <p className="text-xs text-slate-600">
              Please enter your justification notes, technician findings, or customer communication details.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Decision Remarks {(decisionModal === 'rejected' || decisionModal === 'ineligible') && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                required={decisionModal === 'rejected' || decisionModal === 'ineligible'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State technical basis or policy clause for this decision..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDecisionConfirm}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                {isSubmitting ? 'Recording...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
