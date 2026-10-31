/**
 * WarrantyEligibilityPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * 6-Point Warranty Eligibility Checklist & Verdict Panel in M07.
 */

import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import type {
  ClaimEligibilityChecklist,
  EligibilityOutcome,
} from '../types/warrantyClaim.types';

interface WarrantyEligibilityPanelProps {
  checklist: ClaimEligibilityChecklist;
  outcome: EligibilityOutcome;
  notes?: string;
  isEditable?: boolean;
  onChecklistChange?: (updated: ClaimEligibilityChecklist) => void;
  onOutcomeChange?: (updated: EligibilityOutcome) => void;
}

export const WarrantyEligibilityPanel: React.FC<WarrantyEligibilityPanelProps> = ({
  checklist,
  outcome,
  notes,
  isEditable = false,
  onChecklistChange,
  onOutcomeChange,
}) => {
  const handleToggle = (key: keyof ClaimEligibilityChecklist) => {
    if (!isEditable || !onChecklistChange) return;
    const updated = { ...checklist, [key]: !checklist[key] };
    onChecklistChange(updated);

    // Auto-calculate suggested outcome if all checks pass
    if (onOutcomeChange) {
      const allPassed = Object.values(updated).every(Boolean);
      if (allPassed) {
        onOutcomeChange('eligible');
      } else if (!updated.warrantyRecordExists || !updated.serialNumberMatches || !updated.claimFallsWithinCoveragePeriod) {
        onOutcomeChange('ineligible');
      } else {
        onOutcomeChange('requires_further_review');
      }
    }
  };

  const checks: { key: keyof ClaimEligibilityChecklist; label: string; desc: string }[] = [
    { key: 'warrantyRecordExists', label: 'Warranty Record Exists', desc: 'Valid registered warranty found in system catalogue' },
    { key: 'warrantyIsActive', label: 'Warranty Is Active', desc: 'Status is Active (not expired, cancelled, or suspended)' },
    { key: 'serialNumberMatches', label: 'Serial Number Matches', desc: 'Equipment barcode matches original dispatch & installation scan' },
    { key: 'claimFallsWithinCoveragePeriod', label: 'Within Coverage Window', desc: 'Incident date occurred between start and expiry dates' },
    { key: 'productMatchesWarranty', label: 'Product Model Matches', desc: 'Hardware model corresponds to approved policy specifications' },
    { key: 'requiredEvidenceAvailable', label: 'Required Proof Attached', desc: 'Sufficient photographic and commissioning evidence provided' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Warranty Eligibility Verification Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Authoritative 6-point verification check to assess policy compliance and warranty liability.
          </p>
        </div>

        {/* Outcome Verdict Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Preliminary Verdict:</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
              outcome === 'eligible'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : outcome === 'ineligible'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {outcome === 'eligible'
              ? 'Eligible for Claim'
              : outcome === 'ineligible'
              ? 'Ineligible / Out of Warranty'
              : 'Requires Further Review'}
          </span>
        </div>
      </div>

      {/* 6-Point Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checks.map((c) => {
          const isPassed = checklist[c.key];
          return (
            <div
              key={c.key}
              onClick={() => handleToggle(c.key)}
              className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                isEditable ? 'cursor-pointer' : 'cursor-default'
              } ${isPassed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block">{c.label}</span>
                <span className="text-[11px] text-slate-500">{c.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {notes && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="font-semibold text-slate-700">Review Notes: </span>
          <span className="text-slate-600">{notes}</span>
        </div>
      )}

      <div className="text-[11px] text-slate-400 italic">
        Important: The frontend displays preliminary eligibility based on system records. The Service Manager must make the authoritative contractual decision.
      </div>
    </div>
  );
};
