/**
 * AssignmentFormModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal for assigning or reassigning technicians and teams to installations.
 * Performs live advisory conflict checks and skill matching warnings.
 */

import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { TechnicianTeam } from '../types/team.types';
import type { Technician, TechnicianSkill } from '../types/technician.types';
import { TECHNICIAN_SKILL_LABELS } from '../types/technician.types';
import type {
  AssignmentFormData,
  AssignmentPriority,
  AssignmentType,
  TechnicianAssignment,
} from '../types/assignment.types';
import { availabilityService } from '../services/availabilityService';
import { Button } from '../../../components/ui/Button';

interface EligibleInstallationOption {
  id: string;
  installationId: string;
  customerName: string;
  customerPhone: string;
  siteCity: string;
  siteAddress: string;
  systemCapacity: string;
  systemType: string;
  plannedStartDate: string;
  plannedEndDate: string;
}

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  teams: TechnicianTeam[];
  technicians: Technician[];
  initialAssignment?: TechnicianAssignment;
  eligibleInstallations?: EligibleInstallationOption[];
}

export function AssignmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  teams,
  technicians,
  initialAssignment,
  eligibleInstallations = [],
}: AssignmentFormModalProps) {
  const type: AssignmentType = initialAssignment?.type || 'installation';
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialAssignment?.referenceId || eligibleInstallations[0]?.installationId || 'INS-2026-003'
  );

  const [customerName, setCustomerName] = useState(initialAssignment?.customerName || 'Amit Verma');
  const [customerPhone, setCustomerPhone] = useState(initialAssignment?.customerPhone || '+91 98450 23456');
  const [siteAddress, setSiteAddress] = useState(initialAssignment?.siteAddress || 'Farmhouse 4, Kanakapura Road');
  const [siteCity, setSiteCity] = useState(initialAssignment?.siteCity || 'Bengaluru Rural');
  const [systemCapacity, setSystemCapacity] = useState(initialAssignment?.systemCapacity || '3 kW');
  const [systemType, setSystemType] = useState(initialAssignment?.systemType || 'off_grid');

  const [startDate, setStartDate] = useState(
    initialAssignment?.scheduledStartDate || '2026-11-03'
  );
  const [endDate, setEndDate] = useState(
    initialAssignment?.scheduledEndDate || '2026-11-06'
  );
  const [priority, setPriority] = useState<AssignmentPriority>(
    initialAssignment?.priority || 'medium'
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    initialAssignment?.assignedTeamId || teams[0]?.id || ''
  );
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(
    initialAssignment?.assignedTechnicians.map((t) => t.technicianId) || []
  );

  const requiredSkills: TechnicianSkill[] = [
    'solar_panel_installation',
    'inverter_installation',
  ];
  const [instructions, setInstructions] = useState(initialAssignment?.workInstructions || '');

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When installation selection changes, auto-fill details
  const handleInstallationChange = (instId: string) => {
    setSelectedInstId(instId);
    const found = eligibleInstallations.find((i) => i.installationId === instId);
    if (found) {
      setCustomerName(found.customerName);
      setCustomerPhone(found.customerPhone);
      setSiteAddress(found.siteAddress);
      setSiteCity(found.siteCity);
      setSystemCapacity(found.systemCapacity);
      setSystemType(found.systemType);
      setStartDate(found.plannedStartDate);
      setEndDate(found.plannedEndDate);
    }
  };

  // When team selection changes, prefill member IDs
  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const team = teams.find((tm) => tm.id === teamId);
    if (team) {
      setSelectedTechIds(team.memberIds);
    }
  };

  // Run advisory conflict check when technicians or dates change
  useEffect(() => {
    async function checkAdvisoryConflicts() {
      if (selectedTechIds.length === 0 || !startDate || !endDate) {
        setConflictWarning(null);
        return;
      }

      try {
        const warnings: string[] = [];

        for (const tid of selectedTechIds) {
          const res = await availabilityService.checkConflicts(tid, startDate, endDate);
          if (res.hasConflict && res.reason) {
            warnings.push(res.reason);
          }

          // Check required skills match
          const tech = technicians.find((t) => t.id === tid);
          if (tech) {
            const missingSkills = requiredSkills.filter((sk) => !tech.skills.includes(sk));
            if (missingSkills.length > 0) {
              warnings.push(`${tech.fullName} lacks skill: ${missingSkills.map((s) => TECHNICIAN_SKILL_LABELS[s]).join(', ')}`);
            }
          }
        }

        if (warnings.length > 0) {
          setConflictWarning(warnings.join(' • '));
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error(err);
      }
    }

    checkAdvisoryConflicts();
  }, [selectedTechIds, startDate, endDate, requiredSkills, technicians]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTechIds.length === 0) {
      alert('Please assign at least one technician.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        referenceId: selectedInstId,
        referenceTitle: `${customerName} ${systemCapacity} Solar Installation`,
        customerId: 'cust-demo',
        customerName,
        customerPhone,
        siteAddress,
        siteCity,
        systemCapacity,
        systemType,
        requiredSkills,
        scheduledStartDate: startDate,
        scheduledEndDate: endDate,
        assignedTeamId: selectedTeamId || undefined,
        technicianIds: selectedTechIds,
        priority,
        workInstructions: instructions,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="text-base font-semibold text-slate-900">
              {initialAssignment ? 'Reassign Work Order Crew' : 'Assign Crew to Work Order'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Warning Alert */}
        {conflictWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Scheduling Advisory Notice:</span>
              <p className="mt-0.5 opacity-90">{conflictWarning}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Work Order Selection */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Target Work Order (from M05 Installations) *
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedInstId}
              </span>
            </div>

            {eligibleInstallations.length > 0 ? (
              <select
                value={selectedInstId}
                onChange={(e) => handleInstallationChange(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                {eligibleInstallations.map((inst) => (
                  <option key={inst.id} value={inst.installationId}>
                    {inst.installationId}: {inst.customerName} ({inst.systemCapacity}) – {inst.siteCity}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white font-mono"
              />
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div>Customer: <strong>{customerName}</strong></div>
              <div>Location: <strong>{siteCity}</strong></div>
              <div>System: <strong>{systemCapacity} {systemType}</strong></div>
              <div>Phone: <strong>{customerPhone}</strong></div>
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scheduled Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded p-2 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scheduled End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded p-2 bg-white"
              />
            </div>
          </div>

          {/* Team and Technicians */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assign Crew Team (Optional)
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="">Direct Individual Allocation</option>
                {teams.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name} ({tm.memberCount} members)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Individual Technicians Checklist */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Crew Technicians ({selectedTechIds.length} Assigned) *
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2 space-y-1 bg-slate-50">
              {technicians.map((t) => {
                const isSelected = selectedTechIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedTechIds(selectedTechIds.filter((id) => id !== t.id));
                          } else {
                            setSelectedTechIds([...selectedTechIds, t.id]);
                          }
                        }}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium text-slate-800">{t.fullName}</span>
                      <span className="text-[10px] text-slate-400">({t.technicianId})</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        t.availabilityStatus === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.availabilityStatus.toUpperCase()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Work Instructions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Work Instructions & Site Guidance
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Ground floor ladder access, gate code 4092, check inverter wall clearance..."
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting || selectedTechIds.length === 0}
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              {initialAssignment ? 'Confirm Reassignment' : 'Dispatch & Confirm Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
