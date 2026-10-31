/**
 * TeamTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master listing and team management table for field crew divisions.
 */

import { Users, Phone, MapPin, CheckCircle2, XCircle, Plus, Edit } from 'lucide-react';
import type { TechnicianTeam } from '../types/team.types';
import { Button } from '../../../components/ui/Button';

interface TeamTableProps {
  teams: TechnicianTeam[];
  canManage?: boolean;
  onEditTeam: (team: TechnicianTeam) => void;
  onCreateTeam: () => void;
  onToggleStatus: (teamId: string, currentStatus: 'active' | 'inactive') => Promise<void>;
}

export function TeamTable({
  teams,
  canManage = true,
  onEditTeam,
  onCreateTeam,
  onToggleStatus,
}: TeamTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Table Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Technician Field Crews & Divisions
          </h3>
          <p className="text-xs text-slate-500">
            Organize technicians into dedicated solar installation and service units
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onCreateTeam}
          >
            Create New Crew
          </Button>
        )}
      </div>

      {/* Grid or Table Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3 transition-all"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {team.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        team.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 mt-1.5">
                    {team.name}
                  </h4>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => onEditTeam(team)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                    title="Edit Team"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {team.description}
              </p>

              {/* Leader info */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">Team Leader:</span>
                  <strong className="text-slate-900">{team.leaderName}</strong>
                </div>
                {team.leaderPhone && (
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone:
                    </span>
                    <span>{team.leaderPhone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Region:
                  </span>
                  <span className="truncate max-w-[160px]">{team.operatingRegion}</span>
                </div>
              </div>

              {/* Members listing preview */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span className="font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Crew Members ({team.memberCount})</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {team.currentActiveJobsCount} Active Job{team.currentActiveJobsCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium"
                      >
                        {m.name} {m.id === team.leaderId && '★'}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No members assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Toggle Status */}
            {canManage && (
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 text-[11px]">Speciality: {team.speciality}</span>
                <button
                  type="button"
                  onClick={() => onToggleStatus(team.id, team.status)}
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    team.status === 'active'
                      ? 'text-rose-600 hover:text-rose-700'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {team.status === 'active' ? (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
