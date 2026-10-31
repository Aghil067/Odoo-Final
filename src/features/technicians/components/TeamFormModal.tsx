/**
 * TeamFormModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal dialog for creating and updating field crew teams.
 */

import { useState } from 'react';
import { X, Users } from 'lucide-react';
import type { TechnicianTeam, TeamFormData } from '../types/team.types';
import type { Technician } from '../types/technician.types';
import { Button } from '../../../components/ui/Button';

interface TeamFormModalProps {
  initialTeam?: TechnicianTeam;
  allTechnicians: Technician[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamFormData) => Promise<void>;
}

export function TeamFormModal({
  initialTeam,
  allTechnicians,
  isOpen,
  onClose,
  onSubmit,
}: TeamFormModalProps) {
  const [name, setName] = useState(initialTeam?.name || '');
  const [code, setCode] = useState(initialTeam?.code || '');
  const [description, setDescription] = useState(initialTeam?.description || '');
  const [operatingRegion, setOperatingRegion] = useState(
    initialTeam?.operatingRegion || 'Bengaluru Urban'
  );
  const [speciality, setSpeciality] = useState(
    initialTeam?.speciality || 'Residential Rooftop Solar'
  );
  const [leaderId, setLeaderId] = useState(
    initialTeam?.leaderId || allTechnicians[0]?.id || ''
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialTeam?.memberIds || []
  );
  const [status, setStatus] = useState<'active' | 'inactive'>(
    initialTeam?.status || 'active'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleMember = (techId: string) => {
    if (selectedMemberIds.includes(techId)) {
      if (techId === leaderId) {
        setError('Team Leader cannot be removed from members list.');
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== techId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, techId]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Team name and team code are required.');
      return;
    }
    if (!leaderId) {
      setError('Please select a team leader.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name,
        code,
        description,
        operatingRegion,
        speciality,
        leaderId,
        memberIds: Array.from(new Set([leaderId, ...selectedMemberIds])),
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="text-base font-semibold text-slate-900">
              {initialTeam ? 'Edit Crew Team' : 'Create Field Crew Team'}
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

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Gamma Solar Crew"
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Team Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="e.g. GAMMA-SOUTH"
                className="w-full border border-slate-300 rounded p-2 uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High-efficiency rooftop and battery retrofit unit..."
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operating Region
              </label>
              <input
                type="text"
                value={operatingRegion}
                onChange={(e) => setOperatingRegion(e.target.value)}
                placeholder="e.g. Bengaluru South & Electronic City"
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Technical Speciality
              </label>
              <input
                type="text"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                placeholder="e.g. Microinverters & Hybrid Battery"
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Team Leader *
              </label>
              <select
                value={leaderId}
                onChange={(e) => {
                  setLeaderId(e.target.value);
                  if (!selectedMemberIds.includes(e.target.value)) {
                    setSelectedMemberIds([...selectedMemberIds, e.target.value]);
                  }
                }}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                {allTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.technicianId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Technicians selection list */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Crew Members ({selectedMemberIds.length} Selected)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2 space-y-1 bg-slate-50">
              {allTechnicians.map((tech) => {
                const isSelected = selectedMemberIds.includes(tech.id) || tech.id === leaderId;
                const isLeader = tech.id === leaderId;

                return (
                  <label
                    key={tech.id}
                    className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLeader}
                        onChange={() => toggleMember(tech.id)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium text-slate-800">
                        {tech.fullName}
                      </span>
                      {isLeader && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          LEADER
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {tech.teamName || 'Unassigned'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {initialTeam ? 'Save Changes' : 'Create Team'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
