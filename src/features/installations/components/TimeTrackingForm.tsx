/**
 * TimeTrackingForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Captures technician on-site working hours and duration logs.
 * Supports manual log entry and automatic duration calculation.
 */

import { useState } from 'react';
import { Clock, Plus, UserCheck } from 'lucide-react';
import type { InstallationTimeRecord } from '../types/execution.types';
import { Button } from '../../../components/ui/Button';

interface TimeTrackingFormProps {
  records: InstallationTimeRecord[];
  onAddTimeRecord: (record: Omit<InstallationTimeRecord, 'id'>) => Promise<void>;
  currentTechnicianName?: string;
  readOnly?: boolean;
}

export function TimeTrackingForm({
  records,
  onAddTimeRecord,
  currentTechnicianName = 'Ramesh Patel',
  readOnly = false,
}: TimeTrackingFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('08:30');
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState('17:00');
  const [technicianName, setTechnicianName] = useState(currentTechnicianName);
  const [role, setRole] = useState('Lead Solar Technician');
  const [remarks, setRemarks] = useState('');

  // Calculate total minutes across all records
  const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !startTime) return;

    try {
      setIsSubmitting(true);
      // Calculate duration
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      const diffMs = Math.max(0, endDateTime.getTime() - startDateTime.getTime());
      const durationMinutes = Math.round(diffMs / (1000 * 60));

      await onAddTimeRecord({
        workStartDate: startDate,
        workStartTime: startTime,
        workEndDate: endDate,
        workEndTime: endTime,
        durationMinutes,
        technicianName,
        technicianRole: role,
        remarks,
      });

      setShowForm(false);
      setRemarks('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              On-site Work Time Tracking
            </h3>
            <p className="text-xs text-slate-500">
              Record physical hours worked on site by installation crew members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500">Total Logged Time: </span>
            <span className="text-sm font-bold text-slate-800">{totalHours} hrs</span>
          </div>
          {!readOnly && !showForm && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowForm(true)}
            >
              Log Work Shift
            </Button>
          )}
        </div>
      </div>

      {/* New Time Entry Form Modal/Accordion */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-4 space-y-3"
        >
          <div className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Add Work Time Record</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Technician Name
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Start Date & Time
              </label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-2/3 border border-slate-300 rounded px-2 py-1.5 bg-white"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-1/3 border border-slate-300 rounded px-2 py-1.5 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                End Date & Time
              </label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-2/3 border border-slate-300 rounded px-2 py-1.5 bg-white"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-1/3 border border-slate-300 rounded px-2 py-1.5 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1 text-xs">
              Work Remarks / Task Summary
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Structure assembly completed, wiring terminated in utility room..."
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Save Time Log
            </Button>
          </div>
        </form>
      )}

      {/* Records Listing */}
      {records.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          No time records logged for this installation order yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Technician / Crew</th>
                <th className="py-2 px-3 text-center">Hours</th>
                <th className="py-2 px-3">Shift Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                    <span className="font-semibold">{rec.workStartDate}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {rec.workStartTime} – {rec.workEndTime || 'Ongoing'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800">
                      {rec.technicianName}
                    </div>
                    {rec.technicianRole && (
                      <div className="text-[11px] text-slate-400">
                        {rec.technicianRole}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-indigo-700 whitespace-nowrap">
                    {rec.durationMinutes
                      ? `${(rec.durationMinutes / 60).toFixed(1)} hrs`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {rec.remarks || <span className="italic text-slate-400">Standard execution shift</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

