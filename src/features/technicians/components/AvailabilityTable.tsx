/**
 * AvailabilityTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Real-time availability management grid and weekly schedule tracker.
 * Allows quick status updates and leave period inspection.
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import type { TechnicianAvailabilitySummary } from '../types/availability.types';
import type { AvailabilityStatus } from '../types/technician.types';
import {
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_STATUS_COLORS,
} from '../types/technician.types';

interface AvailabilityTableProps {
  summaries: TechnicianAvailabilitySummary[];
  onUpdateStatus: (technicianId: string, newStatus: AvailabilityStatus) => Promise<void>;
  canManage?: boolean;
}

export function AvailabilityTable({
  summaries,
  onUpdateStatus,
  canManage = true,
}: AvailabilityTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusSelect = async (techId: string, status: AvailabilityStatus) => {
    if (!canManage) return;
    try {
      setUpdatingId(techId);
      await onUpdateStatus(techId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Real-time Crew Availability & 7-Day Dispatch Forecast
          </h3>
          <p className="text-xs text-slate-500">
            Live availability status, active customer deployments, and upcoming scheduled free slots
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {summaries.filter((s) => s.status === 'available').length} Available for Dispatch
          </span>
        </div>
      </div>

      {/* Availability Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="py-2.5 px-3 min-w-[160px]">Technician</th>
              <th className="py-2.5 px-3 min-w-[130px]">Team</th>
              <th className="py-2.5 px-3 text-center min-w-[120px]">Live Status</th>
              <th className="py-2.5 px-3 min-w-[200px]">Current Engagement</th>
              <th className="py-2.5 px-3 text-center min-w-[100px]">Next Free Date</th>
              <th className="py-2.5 px-3 min-w-[220px]">7-Day Forecast</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((sum) => (
              <tr key={sum.technicianId} className="hover:bg-slate-50/75 transition-colors">
                {/* Technician Name */}
                <td className="py-3 px-3 font-semibold text-slate-900">
                  {sum.technicianName}
                </td>

                {/* Team */}
                <td className="py-3 px-3 text-slate-600">
                  {sum.teamName || <span className="text-slate-400 italic">Unassigned</span>}
                </td>

                {/* Status Dropdown / Badge */}
                <td className="py-3 px-3 text-center">
                  {canManage ? (
                    <select
                      value={sum.status}
                      disabled={updatingId === sum.technicianId}
                      onChange={(e) =>
                        handleStatusSelect(sum.technicianId, e.target.value as AvailabilityStatus)
                      }
                      className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 cursor-pointer bg-white ${
                        AVAILABILITY_STATUS_COLORS[sum.status]
                      }`}
                    >
                      {(Object.keys(AVAILABILITY_STATUS_LABELS) as AvailabilityStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {AVAILABILITY_STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        AVAILABILITY_STATUS_COLORS[sum.status]
                      }`}
                    >
                      {AVAILABILITY_STATUS_LABELS[sum.status]}
                    </span>
                  )}
                </td>

                {/* Current Engagement */}
                <td className="py-3 px-3">
                  {sum.currentAssignmentSummary ? (
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{sum.currentAssignmentSummary}</span>
                    </div>
                  ) : sum.leaves.length > 0 ? (
                    <div className="flex items-center gap-1 text-purple-700 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>On {sum.leaves[0].leaveType} leave ({sum.leaves[0].startDate} to {sum.leaves[0].endDate})</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No active deployment</span>
                  )}
                </td>

                {/* Next Free Date */}
                <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                  {sum.nextAvailableDate}
                </td>

                {/* 7-Day Forecast Pills */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    {sum.upcomingDays.map((slot) => {
                      const dayLetter = new Date(slot.date).toLocaleDateString([], { weekday: 'narrow' });
                      const isFree = slot.status === 'available';
                      const isBusy = slot.status === 'busy' || slot.status === 'assigned';
                      const isLeave = slot.status === 'on_leave';

                      return (
                        <div
                          key={slot.date}
                          className={`w-5 h-6 rounded flex flex-col items-center justify-center text-[9px] font-bold ${
                            isFree
                              ? 'bg-emerald-100 text-emerald-800'
                              : isBusy
                              ? 'bg-blue-200 text-blue-900'
                              : isLeave
                              ? 'bg-purple-200 text-purple-900'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                          title={`${slot.date}: ${AVAILABILITY_STATUS_LABELS[slot.status]}${slot.assignmentTitle ? ` - ${slot.assignmentTitle}` : ''}`}
                        >
                          <span>{dayLetter}</span>
                          <span className="text-[7px] opacity-75">{isFree ? '✓' : '•'}</span>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend footnote */}
      <div className="p-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 bg-slate-50/50">
        <span className="font-semibold text-slate-700">Forecast Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Free / Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Assigned / On-site
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Approved Leave
        </span>
        <span className="ml-auto text-slate-400 italic">
          Advisor checks enabled. Conflict verification runs on assignment creation.
        </span>
      </div>
    </div>
  );
}
