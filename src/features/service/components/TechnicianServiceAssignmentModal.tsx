/**
 * TechnicianServiceAssignmentModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal for assigning M06 Technicians to Service Tasks.
 * Includes advisory skill-match and availability checks.
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ServiceTask } from '../types/serviceTask.types';
import type { Technician } from '../../technicians/types/technician.types';
import { technicianService } from '../../technicians/services/technicianService';

interface TechnicianServiceAssignmentModalProps {
  task: ServiceTask;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: {
    technicianId: string;
    technicianName: string;
    teamId?: string;
    teamName?: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
  }) => Promise<void>;
}

export const TechnicianServiceAssignmentModal: React.FC<TechnicianServiceAssignmentModalProps> = ({
  task,
  isOpen,
  onClose,
  onAssign,
}) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState(task.assignedTechnicianId || '');
  const [scheduledDate, setScheduledDate] = useState(
    task.scheduledDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(task.scheduledTimeSlot || '10:00 - 13:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTechs() {
      try {
        const res = await technicianService.list();
        setTechnicians(Array.isArray(res) ? res : (res as any).data || []);
      } catch (err) {
        console.error('Failed to load technicians', err);
      }
    }
    if (isOpen) {
      loadTechs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedTech = technicians.find((t) => t.id === selectedTechId);

  // Advisory Skill Matching
  const missingSkills = selectedTech
    ? task.requiredSkills.filter((req) => !selectedTech.skills.includes(req))
    : [];

  const isTechUnavailable = selectedTech && selectedTech.availabilityStatus !== 'available' && selectedTech.availabilityStatus !== 'assigned';

  const handleConfirm = async () => {
    if (!selectedTech) {
      setError('Please select a technician.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAssign({
        technicianId: selectedTech.id,
        technicianName: selectedTech.fullName,
        teamId: selectedTech.teamId,
        teamName: selectedTech.teamName,
        scheduledDate,
        scheduledTimeSlot: timeSlot,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Assignment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-mono text-green-700 font-bold uppercase">{task.taskId}</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Assign Field Service Technician</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p><span className="font-semibold text-slate-800">Task:</span> {task.taskDescription}</p>
          <p><span className="font-semibold text-slate-800">Required Skills:</span> {task.requiredSkills.map((s) => s.replace('_', ' ')).join(', ')}</p>
        </div>

        {/* Technician Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Select Solar Technician (M06) <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">-- Choose technician from roster --</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.qualification?.qualification || 'Certified Tech'}) — Status: {t.availabilityStatus} — Team: {t.teamName || 'Independent'}
              </option>
            ))}
          </select>
        </div>

        {/* Advisory Warnings */}
        {selectedTech && (
          <div className="space-y-2">
            {missingSkills.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Advisory Skill Gap:</span> Technician is missing certified skills: {missingSkills.map((s) => s.replace('_', ' ')).join(', ')}.
                </div>
              </div>
            )}

            {isTechUnavailable && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Availability Conflict:</span> Technician is currently marked as <span className="uppercase font-bold">{selectedTech.availabilityStatus}</span>.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Date & Time Slot */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Scheduled Service Date</label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Time Slot Window</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="09:00 - 12:00">09:00 - 12:00 (Morning)</option>
              <option value="12:00 - 15:00">12:00 - 15:00 (Noon Solar Peak)</option>
              <option value="15:00 - 18:00">15:00 - 18:00 (Evening)</option>
              <option value="Full Day">Full Day Maintenance</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedTechId || isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};
