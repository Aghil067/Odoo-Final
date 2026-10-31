/**
 * ServiceTaskFormModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal to create or edit a Service Task for a ticket in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ServiceTaskFormData } from '../types/serviceTask.types';
import type { ServicePriority } from '../types/serviceTicket.types';
import type { Technician, TechnicianSkill } from '../../technicians/types/technician.types';
import { TECHNICIAN_SKILL_LABELS } from '../../technicians/types/technician.types';
import { technicianService } from '../../technicians/services/technicianService';

interface ServiceTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketRef: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  siteCity?: string;
  productName: string;
  serialNumber?: string;
  priority?: ServicePriority;
  onSubmit: (data: ServiceTaskFormData) => Promise<void>;
}

export const ServiceTaskFormModal: React.FC<ServiceTaskFormModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketRef,
  customerId,
  customerName,
  customerPhone,
  siteAddress,
  siteCity,
  productName,
  serialNumber,
  priority = 'high',
  onSubmit,
}) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [workInstructions, setWorkInstructions] = useState('');
  const [taskPriority, setTaskPriority] = useState<ServicePriority>(priority);
  const [requiredSkills, setRequiredSkills] = useState<TechnicianSkill[]>([
    'troubleshooting',
    'electrical_wiring',
  ]);
  const [assignedTechId, setAssignedTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('10:00 - 13:00');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTechs() {
      try {
        const res = await technicianService.list();
        setTechnicians(Array.isArray(res) ? res : (res as any).data || []);
      } catch (err) {
        console.error('Failed to load techs', err);
      }
    }
    if (isOpen) {
      loadTechs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSkill = (skill: TechnicianSkill) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!taskDescription.trim()) {
      setError('Task Description is required.');
      return;
    }

    const tech = technicians.find((t) => t.id === assignedTechId);

    try {
      setIsSubmitting(true);
      await onSubmit({
        ticketId,
        ticketRef,
        customerId,
        customerName,
        customerPhone,
        siteAddress,
        siteCity,
        productName,
        serialNumber,
        requiredSkills,
        taskDescription,
        workInstructions,
        priority: taskPriority,
        assignedTechnicianId: tech?.id,
        assignedTechnicianName: tech?.fullName,
        assignedTeamId: tech?.teamId,
        assignedTeamName: tech?.teamName,
        scheduledDate,
        scheduledTimeSlot,
        expectedCompletionDate: scheduledDate,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSkills: TechnicianSkill[] = [
    'troubleshooting',
    'electrical_wiring',
    'electrical_testing',
    'inverter_installation',
    'battery_installation',
    'solar_panel_installation',
    'repair',
    'maintenance',
    'dc_wiring',
    'ac_wiring',
    'earthing',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-mono text-green-700 font-bold uppercase">{ticketRef}</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Create Service Task</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Task Work Scope / Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="e.g. Inspect inverter Error 04 overvoltage trip, measure AC line voltage, recalibrate voltage ceiling..."
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Technician Field Instructions
            </label>
            <input
              type="text"
              value={workInstructions}
              onChange={(e) => setWorkInstructions(e.target.value)}
              placeholder="e.g. Carry certified earth resistance clamp and digital multi-tester"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Required Skills Selection */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Required Technical Competencies (M06)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {allSkills.map((sk) => {
                const isSelected = requiredSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-green-50 border-green-500 text-green-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{TECHNICIAN_SKILL_LABELS[sk] || sk}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as ServicePriority)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assign Technician (Optional)</label>
              <select
                value={assignedTechId}
                onChange={(e) => setAssignedTechId(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Assign Later --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.availabilityStatus})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Time Slot</label>
              <select
                value={scheduledTimeSlot}
                onChange={(e) => setScheduledTimeSlot(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="09:00 - 12:00">09:00 - 12:00 (Morning)</option>
                <option value="12:00 - 15:00">12:00 - 15:00 (Noon Solar Peak)</option>
                <option value="15:00 - 18:00">15:00 - 18:00 (Evening)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
