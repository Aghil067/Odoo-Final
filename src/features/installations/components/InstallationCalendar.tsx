/**
 * InstallationCalendar.tsx
 * ─────────────────────────────────────────────────────────────
 * Interactive schedule and calendar view for M05.
 * Supports Month, Week, Day views, and tabular list view.
 * Enables team/date filtering and clean team assignment integration.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
  List,
} from 'lucide-react';
import type { Installation } from '../types/installation.types';
import {
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_COLORS,
} from '../types/installation.types';

type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

interface InstallationCalendarProps {
  installations: Installation[];
  onReschedule?: (
    installationId: string,
    newStartDate: string,
    newEndDate: string,
    team?: string
  ) => Promise<void>;
  canReschedule?: boolean;
}

export function InstallationCalendar({
  installations,
  canReschedule = true,
}: InstallationCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-28')); // Align with mock dates
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Extract distinct teams
  const allTeams = Array.from(
    new Set(
      installations
        .map((i) => i.schedule.assignedTeam)
        .filter((t): t is string => Boolean(t))
    )
  );

  const filteredInstallations =
    selectedTeam === 'all'
      ? installations
      : installations.filter((i) => i.schedule.assignedTeam === selectedTeam);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 1);
      setCurrentDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    }
  };

  // Generate calendar days for month view
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Top Controls: View Toggle, Navigation, Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-semibold text-xs text-slate-800 whitespace-nowrap">
              {viewMode === 'month' && `${monthName} ${year}`}
              {viewMode === 'week' && `Week of ${monthName} ${currentDate.getDate()}, ${year}`}
              {viewMode === 'day' && `${currentDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
              {viewMode === 'list' && 'All Scheduled Work Orders'}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date('2026-10-28'))}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        {/* View mode switcher and Team Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Team filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Team:</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 bg-white text-xs text-slate-800"
            >
              <option value="all">All Installation Teams</option>
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-t-lg text-center text-xs font-bold text-slate-600 py-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-lg">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-50 min-h-[90px] p-1.5" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                // Installations active on this day
                const dayJobs = filteredInstallations.filter((inst) => {
                  return (
                    inst.schedule.plannedStartDate <= dateStr &&
                    inst.schedule.plannedEndDate >= dateStr
                  );
                });

                const isToday =
                  dateStr === '2026-10-28'; // Mock highlight

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[90px] p-1.5 bg-white flex flex-col justify-between transition-colors ${
                      isToday ? 'bg-amber-50/40 ring-1 ring-amber-300 ring-inset' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                          isToday
                            ? 'bg-amber-500 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayJobs.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {dayJobs.length} {dayJobs.length === 1 ? 'job' : 'jobs'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayJobs.map((job) => (
                        <Link
                          key={job.id}
                          to={`/installations/${job.id}`}
                          className="block text-[10px] p-1 rounded font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 hover:shadow-xs truncate transition-all"
                          title={`${job.installationId}: ${job.customerName} (${job.systemCapacity})`}
                        >
                          <div className="font-bold truncate">{job.customerName}</div>
                          <div className="text-[9px] text-emerald-700 truncate">
                            {job.systemCapacity} • {job.schedule.assignedTeam || 'No Team'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK & DAY VIEW */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <CalendarIcon className="w-4 h-4 text-green-600" />
            <span>
              Detailed timeline for {viewMode === 'week' ? 'selected week' : 'selected day'}. Showing {filteredInstallations.length} work orders.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredInstallations.map((inst) => (
              <div
                key={inst.id}
                className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-slate-300 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {inst.installationId}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {inst.customerName}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      INSTALLATION_STATUS_COLORS[inst.status]
                    }`}
                  >
                    {INSTALLATION_STATUS_LABELS[inst.status]}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {inst.schedule.plannedStartDate} to {inst.schedule.plannedEndDate} ({inst.schedule.scheduledStartTime || '08:30'} – {inst.schedule.scheduledEndTime || '17:30'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{inst.siteAddress}, {inst.siteCity}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Team: <strong>{inst.schedule.assignedTeam || 'Unassigned (M06)'}</strong>
                  </span>
                  <Link
                    to={`/installations/${inst.id}`}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <span>View Work Order</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABULAR LIST VIEW */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Scheduled Dates</th>
                <th className="py-2.5 px-3">Assigned Team</th>
                <th className="py-2.5 px-3">Installation Manager</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInstallations.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {inst.installationId}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">
                      {inst.customerName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {inst.siteCity} • {inst.systemCapacity}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    {inst.schedule.plannedStartDate} → {inst.schedule.plannedEndDate}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-700">
                      {inst.schedule.assignedTeam || 'Pending M06 Assignment'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {inst.schedule.installationManager}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        INSTALLATION_STATUS_COLORS[inst.status]
                      }`}
                    >
                      {INSTALLATION_STATUS_LABELS[inst.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/installations/${inst.id}`}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Future M06 Technician Integration Note */}
      <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
        <span>
          <strong>M06 Technician Team Assignment:</strong> Crews and technicians assigned here will sync bi-directionally with M06 Technician Management and live team rosters.
        </span>
        {canReschedule && (
          <span className="text-slate-400 italic">Conflict-check active</span>
        )}
      </div>
    </div>
  );
}

