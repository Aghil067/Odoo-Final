/**
 * TechnicianTeamsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Technician team management page: organize field crews into regional divisions,
 * appoint leaders, add/remove members, and manage team states.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, HardHat, Calendar } from 'lucide-react';
import type { TechnicianTeam, TeamFormData } from '../types/team.types';
import type { Technician } from '../types/technician.types';
import { teamService } from '../services/teamService';
import { technicianService } from '../services/technicianService';
import { TeamTable } from '../components/TeamTable';
import { TeamFormModal } from '../components/TeamFormModal';
import { Button } from '../../../components/ui/Button';

export function TechnicianTeamsPage() {
  const [teams, setTeams] = useState<TechnicianTeam[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TechnicianTeam | undefined>(undefined);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [teamsData, techsData] = await Promise.all([
        teamService.list(),
        technicianService.list(),
      ]);
      setTeams(teamsData);
      setTechnicians(techsData);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = () => {
    setEditingTeam(undefined);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: TechnicianTeam) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (teamId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await teamService.update(teamId, { status: newStatus });
    await loadData();
  };

  const handleFormSubmit = async (formData: TeamFormData) => {
    if (editingTeam) {
      await teamService.update(editingTeam.id, formData);
    } else {
      await teamService.create(formData);
    }
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            <span>Technician Teams & Field Crews</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure regional installation units, assign crew leaders, and organize field personnel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/technicians">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<HardHat className="w-4 h-4" />}
            >
              All Technicians
            </Button>
          </Link>
          <Link to="/technicians/availability">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Availability Roster
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading field crew divisions...
        </div>
      ) : (
        <TeamTable
          teams={teams}
          canManage={true}
          onCreateTeam={handleCreateTeam}
          onEditTeam={handleEditTeam}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal */}
      <TeamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTeam={editingTeam}
        allTechnicians={technicians}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
