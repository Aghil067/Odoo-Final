/**
 * WarrantyDetails.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete dossier component for Equipment Warranties in M07.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import type { WarrantyRecord } from '../types/warranty.types';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { WarrantyStatusBadge } from './WarrantyStatusBadge';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { WarrantyTimeline } from './WarrantyTimeline';
import { formatRemainingCoverage } from './WarrantyTable';

interface WarrantyDetailsProps {
  warranty: WarrantyRecord;
  claims: WarrantyClaim[];
  onActivate?: () => Promise<void>;
  onSuspend?: (reason: string) => Promise<void>;
  onResume?: () => Promise<void>;
  userRole?: string;
}

export const WarrantyDetails: React.FC<WarrantyDetailsProps> = ({
  warranty,
  claims,
  onActivate,
  onSuspend,
  onResume,
  userRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'coverage' | 'claims' | 'documents' | 'timeline'>('overview');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const coverageInfo = formatRemainingCoverage(warranty.warrantyExpiryDate, warranty.status);
  const canManage = userRole === 'admin' || userRole === 'service_manager';

  const handleActivateClick = async () => {
    if (!onActivate) return;
    setIsProcessing(true);
    try {
      await onActivate();
      setActionMessage('Warranty successfully activated.');
    } catch (err: any) {
      setActionMessage(err?.message || 'Activation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspendConfirm = async () => {
    if (!onSuspend || !suspendReason.trim()) return;
    setIsProcessing(true);
    try {
      await onSuspend(suspendReason);
      setShowSuspendModal(false);
      setSuspendReason('');
      setActionMessage('Warranty status set to Suspended.');
    } catch (err: any) {
      setActionMessage(err?.message || 'Failed to suspend warranty.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeClick = async () => {
    if (!onResume) return;
    setIsProcessing(true);
    try {
      await onResume();
      setActionMessage('Warranty coverage reinstated to Active.');
    } catch (err: any) {
      setActionMessage(err?.message || 'Failed to resume warranty.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded border border-green-200">
                {warranty.warrantyId}
              </span>
              <WarrantyStatusBadge status={warranty.status} />
              <span className="text-xs text-slate-500 capitalize">
                {warranty.coverageType} Warranty
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{warranty.productName}</h1>
            <p className="text-xs text-slate-500 font-mono">
              Serial Number: <span className="font-semibold text-slate-800">{warranty.serialNumber || 'Non-serialized Unit'}</span> • Customer: <span className="font-semibold text-slate-800">{warranty.customerName}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (warranty.status === 'pending_activation' || warranty.status === 'draft') && (
              <button
                type="button"
                onClick={handleActivateClick}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing ? 'Activating...' : 'Activate Warranty'}
              </button>
            )}

            {canManage && warranty.status === 'active' && (
              <button
                type="button"
                onClick={() => setShowSuspendModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-medium rounded-lg transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                Suspend Coverage
              </button>
            )}

            {canManage && warranty.status === 'suspended' && (
              <button
                type="button"
                onClick={handleResumeClick}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Reactivate / Resume
              </button>
            )}

            <Link
              to={`/warranty/claims/new?warrantyId=${warranty.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              File Warranty Claim
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex items-center justify-between">
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-green-600 font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Remaining Period</span>
            <span className={`font-bold mt-0.5 block ${coverageInfo.isExpired ? 'text-rose-600' : coverageInfo.isUrgent ? 'text-orange-600' : 'text-slate-800'}`}>
              {coverageInfo.text}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Start Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
              {warranty.warrantyStartDate || 'Pending Activation'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Expiry Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
              {warranty.warrantyExpiryDate || 'Pending Activation'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Total Claims Filed</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {claims.length} claim{claims.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        {(
          [
            { id: 'overview', label: 'Warranty Overview' },
            { id: 'coverage', label: 'Policy Coverage & Terms' },
            { id: 'claims', label: `Claims History (${claims.length})` },
            { id: 'documents', label: `Documents (${warranty.documents.length})` },
            { id: 'timeline', label: 'Activity Timeline' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 relative transition-colors ${
              activeTab === t.id
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Details Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-600" />
              Equipment Information
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Equipment Name:</span>
                <span className="font-medium text-slate-900">{warranty.productName}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Serial Number:</span>
                <span className="font-mono font-bold text-green-700">{warranty.serialNumber || 'N/A'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="capitalize font-medium text-slate-800">{warranty.productCategory.replace('_', ' ')}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Manufacturer:</span>
                <span className="font-medium text-slate-800">{warranty.manufacturer}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Model Number:</span>
                <span className="font-medium text-slate-800">{warranty.modelNumber || 'N/A'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">SKU Code:</span>
                <span className="font-mono text-slate-600">{warranty.sku}</span>
              </div>
            </div>
          </div>

          {/* Customer & Installation Link Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Customer & Installation Site
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-900">{warranty.customerName}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-mono text-slate-800">{warranty.customerPhone}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="text-slate-800">{warranty.customerEmail}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-slate-500">Installation Work Order:</span>
                <span className="font-mono text-green-700 font-semibold">{warranty.installationRef || 'Over-the-counter'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Installation Site:</span>
                <span className="text-right text-slate-700 max-w-[220px]">
                  {warranty.siteAddress ? `${warranty.siteAddress}, ${warranty.siteCity || ''}` : 'Direct Customer Handover'}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Delivery Reference:</span>
                <span className="font-mono text-slate-600">{warranty.deliveryRef || 'Standard Delivery'}</span>
              </div>
            </div>
          </div>

          {/* Activation Eligibility Status */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Activation Evidence & Validation
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Activation Basis:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {warranty.activationBasis.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Eligibility Verdict:</span>
                <span
                  className={`font-semibold ${
                    warranty.activationEligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {warranty.activationEligibility.isEligible ? 'Fully Eligible' : 'Requires Evidence'}
                </span>
              </div>
              {warranty.activationEligibility.missingEvidence.length > 0 && (
                <div className="pt-1">
                  <span className="text-amber-800 font-medium">Missing Evidence:</span>
                  <ul className="list-disc pl-5 text-amber-700 mt-0.5 space-y-0.5">
                    {warranty.activationEligibility.missingEvidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warranty.activatedAt && (
                <p className="text-slate-500 pt-1">
                  Activated by <span className="font-medium text-slate-700">{warranty.activatedBy}</span> on{' '}
                  {new Date(warranty.activatedAt).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Policy Coverage & Terms */}
      {activeTab === 'coverage' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-mono text-green-600 font-semibold">{warranty.policyRef}</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{warranty.policyName}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Duration</span>
              <span className="font-bold text-slate-800 text-sm">
                {warranty.durationValue} {warranty.durationUnit}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Coverage Classification</span>
              <span className="font-bold text-slate-800 capitalize">
                {warranty.coverageType} Warranty
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Activation Basis</span>
              <span className="font-bold text-slate-800">
                {warranty.activationBasis.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <span className="font-bold text-slate-800 block mb-1">Coverage Scope:</span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {warranty.coverageDescription || 'Full defect coverage under OEM manufacturer warranty specifications.'}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Exclusions & Void Scenarios:</span>
              <p className="text-slate-600 bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                {warranty.exclusions || 'Excludes direct ungrounded lightning discharge, physical external impact, unauthorized chassis modification.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Claims History */}
      {activeTab === 'claims' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Warranty Claims History</h3>
            <Link
              to={`/warranty/claims/new?warrantyId=${warranty.id}`}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              + Submit New Claim
            </Link>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No claims have been filed against this warranty.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {claims.map((clm) => (
                <div key={clm.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{clm.claimId}</span>
                      <ClaimStatusBadge status={clm.status} />
                      <span className="text-[11px] text-slate-400 font-mono">Date: {clm.claimDate}</span>
                    </div>
                    <p className="font-medium text-slate-800">{clm.issueTitle}</p>
                    <p className="text-[11px] text-slate-500">
                      Category: {clm.issueCategory.replace('_', ' ')} • Reviewer: {clm.assignedReviewerName || 'Unassigned'}
                    </p>
                  </div>

                  <Link
                    to={`/warranty/claims/${clm.id}`}
                    className="inline-flex items-center gap-1 text-green-700 font-medium hover:underline text-xs"
                  >
                    View Review & Outcome <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Supporting Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Attached Handover & Purchase Proofs</h3>
          {warranty.documents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No documents attached.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {warranty.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-[200px]">{doc.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{doc.documentType.replace('_', ' ')} • {doc.fileSize || '1 MB'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Warranty Activity & Audit History</h3>
          <WarrantyTimeline activities={warranty.activityTimeline} />
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-purple-700">
              <PauseCircle className="w-5 h-5" />
              Suspend Warranty Coverage
            </h3>
            <p className="text-xs text-slate-600">
              Suspending coverage temporarily freezes warranty claim eligibility during an active tampering investigation or payment dispute.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mandatory Suspension Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="State the technical or contractual justification for suspension..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!suspendReason.trim() || isProcessing}
                onClick={handleSuspendConfirm}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isProcessing ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
