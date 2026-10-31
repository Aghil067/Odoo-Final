/**
 * ExecutionChecklist.tsx
 * ─────────────────────────────────────────────────────────────
 * Mobile and tablet optimized execution checklist for field technicians.
 * Supports status toggles (Pending, In Progress, Completed, N/A) and item remarks.
 */

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Slash,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  ExecutionChecklistItem,
  ChecklistItemStatus,
} from '../types/execution.types';

interface ExecutionChecklistProps {
  items: ExecutionChecklistItem[];
  onUpdateItem: (
    itemId: string,
    status: ChecklistItemStatus,
    remarks?: string
  ) => Promise<void>;
  readOnly?: boolean;
}

export function ExecutionChecklist({
  items,
  onUpdateItem,
  readOnly = false,
}: ExecutionChecklistProps) {
  const [activeRemarkId, setActiveRemarkId] = useState<string | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Calculate completion percentage (excluding N/A)
  const applicableItems = items.filter((i) => i.status !== 'not_applicable');
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const progressPercent =
    applicableItems.length > 0
      ? Math.round((completedCount / applicableItems.length) * 100)
      : 0;

  const handleStatusClick = async (item: ExecutionChecklistItem, newStatus: ChecklistItemStatus) => {
    if (readOnly || item.status === newStatus) return;
    try {
      setLoadingItemId(item.id);
      await onUpdateItem(item.id, newStatus);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleSaveRemark = async (item: ExecutionChecklistItem) => {
    if (readOnly) return;
    try {
      setLoadingItemId(item.id);
      await onUpdateItem(item.id, item.status, remarkInput);
      setActiveRemarkId(null);
      setRemarkInput('');
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header and Progress Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Field Execution Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step physical installation procedure and inspection milestones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-600">
              {completedCount} of {applicableItems.length} Completed
            </div>
            <div className="text-sm font-bold text-emerald-700">
              {progressPercent}%
            </div>
          </div>
          <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items list */}
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const isPending = item.status === 'pending';
          const isInProgress = item.status === 'in_progress';
          const isCompleted = item.status === 'completed';
          const isNA = item.status === 'not_applicable';
          const isBusy = loadingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`border rounded-lg p-3.5 transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : isInProgress
                  ? 'border-sky-300 bg-sky-50/40'
                  : isNA
                  ? 'border-slate-200 bg-slate-50/70 opacity-60'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Item title and badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-sky-600 text-white animate-pulse'
                        : isNA
                        ? 'bg-slate-300 text-slate-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className={isNA ? 'line-through text-slate-400' : ''}>
                        {item.title}
                      </span>
                      {item.required && !isNA && (
                        <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                      )}
                    </div>
                    {item.completedAt && (
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Completed at {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {item.completedBy && ` by ${item.completedBy}`}
                      </div>
                    )}
                    {item.remarks && (
                      <div className="text-xs text-slate-600 mt-1 bg-white/70 p-1.5 rounded border border-slate-200 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                {!readOnly && (
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusClick(item, 'pending')}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                        isPending
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      Pending
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusClick(item, 'in_progress')}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                        isInProgress
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <PlayCircle className="w-3 h-3 inline mr-1" />
                      In Progress
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusClick(item, 'completed')}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      Done
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusClick(item, 'not_applicable')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        isNA
                          ? 'bg-slate-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="Mark as Not Applicable"
                    >
                      <Slash className="w-3 h-3 inline" />
                      N/A
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeRemarkId === item.id) {
                          setActiveRemarkId(null);
                        } else {
                          setActiveRemarkId(item.id);
                          setRemarkInput(item.remarks || '');
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded ml-1"
                      title="Add or edit remark"
                    >
                      {activeRemarkId === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Remark Box */}
              {activeRemarkId === item.id && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={remarkInput}
                    onChange={(e) => setRemarkInput(e.target.value)}
                    placeholder="Enter technician remark or measurement observation..."
                    className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRemark(item)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRemarkId(null)}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

