/**
 * InstallationProgress.tsx
 * ─────────────────────────────────────────────────────────────
 * Visual progress stepper and workflow transition controller for M05.
 * Strictly adheres to allowed workflow transitions:
 * Draft -> Awaiting Material -> Ready for Scheduling -> Scheduled -> In Progress -> Completed -> Completion Submitted -> Verified
 */

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CheckCheck,
  ShieldCheck,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import type { InstallationStatus } from '../types/installation.types';
import {
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_COLORS,
} from '../types/installation.types';
import { Button } from '../../../components/ui/Button';

interface InstallationProgressProps {
  currentStatus: InstallationStatus;
  canManage: boolean;
  onStatusChange?: (newStatus: InstallationStatus, notes?: string) => Promise<void>;
}

const PRIMARY_STEPS: { key: InstallationStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'awaiting_material', label: 'Material' },
  { key: 'ready_for_scheduling', label: 'Ready' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'completion_submitted', label: 'Submitted' },
  { key: 'verified', label: 'Verified' },
];

export function InstallationProgress({
  currentStatus,
  canManage,
  onStatusChange,
}: InstallationProgressProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState<InstallationStatus | null>(null);
  const [notes, setNotes] = useState('');

  const currentStepIndex = PRIMARY_STEPS.findIndex((s) => s.key === currentStatus);
  const isSpecialState = currentStatus === 'on_hold' || currentStatus === 'cancelled';

  // Determine allowed next transitions
  const getAllowedTransitions = (): { status: InstallationStatus; label: string; variant?: 'primary' | 'danger' | 'outline' }[] => {
    switch (currentStatus) {
      case 'draft':
        return [
          { status: 'awaiting_material', label: 'Request Materials', variant: 'primary' },
          { status: 'cancelled', label: 'Cancel Order', variant: 'danger' },
        ];
      case 'awaiting_material':
        return [
          { status: 'ready_for_scheduling', label: 'Mark Materials Ready', variant: 'primary' },
          { status: 'on_hold', label: 'Put On Hold', variant: 'outline' },
        ];
      case 'ready_for_scheduling':
        return [
          { status: 'scheduled', label: 'Mark as Scheduled', variant: 'primary' },
          { status: 'on_hold', label: 'Put On Hold', variant: 'outline' },
        ];
      case 'scheduled':
        return [
          { status: 'in_progress', label: 'Start Field Execution', variant: 'primary' },
          { status: 'on_hold', label: 'Put On Hold', variant: 'outline' },
          { status: 'cancelled', label: 'Cancel Schedule', variant: 'danger' },
        ];
      case 'in_progress':
        return [
          { status: 'completed', label: 'Mark Work Completed', variant: 'primary' },
          { status: 'on_hold', label: 'Pause / On Hold', variant: 'outline' },
        ];
      case 'completed':
        return [
          { status: 'completion_submitted', label: 'Submit Sign-off Dossier', variant: 'primary' },
        ];
      case 'completion_submitted':
        return [
          { status: 'verified', label: 'Verify & Approve Installation', variant: 'primary' },
          { status: 'in_progress', label: 'Reject / Return for Revision', variant: 'danger' },
        ];
      case 'on_hold':
        return [
          { status: 'scheduled', label: 'Resume to Scheduled', variant: 'primary' },
          { status: 'in_progress', label: 'Resume Execution Directly', variant: 'primary' },
          { status: 'cancelled', label: 'Cancel Order', variant: 'danger' },
        ];
      case 'verified':
      case 'cancelled':
      default:
        return [];
    }
  };

  const allowedTransitions = getAllowedTransitions();

  const handleTransitionClick = async (targetStatus: InstallationStatus) => {
    if (targetStatus === 'on_hold' || targetStatus === 'cancelled' || targetStatus === 'in_progress') {
      setShowNotesModal(targetStatus);
      return;
    }

    if (!onStatusChange) return;
    try {
      setIsUpdating(true);
      await onStatusChange(targetStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmWithNotes = async () => {
    if (!showNotesModal || !onStatusChange) return;
    try {
      setIsUpdating(true);
      await onStatusChange(showNotesModal, notes);
      setShowNotesModal(null);
      setNotes('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header and current state banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Workflow Status
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                INSTALLATION_STATUS_COLORS[currentStatus]
              }`}
            >
              {INSTALLATION_STATUS_LABELS[currentStatus]}
            </span>
            {currentStatus === 'verified' && (
              <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ready for M07 Warranty Activation
              </span>
            )}
          </div>
        </div>

        {/* Action buttons for authorized managers */}
        {canManage && allowedTransitions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {allowedTransitions.map((tr) => (
              <Button
                key={tr.status}
                size="sm"
                variant={tr.variant || 'outline'}
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => handleTransitionClick(tr.status)}
              >
                {tr.status === 'in_progress' && <PlayCircle className="w-3.5 h-3.5" />}
                {tr.status === 'on_hold' && <PauseCircle className="w-3.5 h-3.5" />}
                {tr.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {tr.status === 'verified' && <CheckCheck className="w-3.5 h-3.5" />}
                {tr.status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                {tr.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Special State Alerts */}
      {isSpecialState && (
        <div
          className={`p-3 rounded-lg flex items-start gap-3 text-sm ${
            currentStatus === 'on_hold'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">
              {currentStatus === 'on_hold'
                ? 'Installation On Hold'
                : 'Installation Cancelled'}
            </div>
            <p className="text-xs mt-0.5 opacity-90">
              {currentStatus === 'on_hold'
                ? 'Execution is temporarily paused. Authorized managers can resume scheduling or cancel this job.'
                : 'This work order has been marked as cancelled. No further work or material dispatches are allowed.'}
            </p>
          </div>
        </div>
      )}

      {/* Primary Linear Stepper (Hidden on cancelled, or greyed out) */}
      <div className="relative pt-2">
        <div className="hidden md:flex items-center justify-between">
          {PRIMARY_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {/* Connecting bar */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-1 -z-0 transition-colors ${
                      currentStepIndex >= idx ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Node icon circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                      ? 'bg-white border-green-600 text-green-700 ring-4 ring-green-100 shadow-sm'
                      : 'bg-slate-50 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`text-[11px] font-medium mt-2 text-center leading-tight ${
                    isCurrent
                      ? 'text-green-700 font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper Compact Display */}
        <div className="flex md:hidden items-center justify-between bg-slate-50 p-2.5 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-green-600" />
            <span>
              Step {currentStepIndex >= 0 ? currentStepIndex + 1 : 1} of {PRIMARY_STEPS.length}:
            </span>
            <strong className="text-slate-800">
              {PRIMARY_STEPS[currentStepIndex]?.label || currentStatus}
            </strong>
          </div>
          {currentStepIndex < PRIMARY_STEPS.length - 1 && (
            <div className="flex items-center gap-1 text-slate-400">
              <span>Next: {PRIMARY_STEPS[currentStepIndex + 1]?.label}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation with notes modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Confirm Status Change: {INSTALLATION_STATUS_LABELS[showNotesModal]}
            </h3>
            <p className="text-xs text-slate-500">
              Please provide context or reasons for this status update. This will be logged in the permanent activity timeline.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Roof masonry pending, monsoon rain delay, customer reschedule request..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNotesModal(null);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={showNotesModal === 'cancelled' ? 'danger' : 'primary'}
                onClick={handleConfirmWithNotes}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

