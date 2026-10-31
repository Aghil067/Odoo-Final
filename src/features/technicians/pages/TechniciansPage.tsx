/**
 * TechniciansPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master listing page for solar technicians and field crew members.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Users, Calendar, LayoutDashboard } from 'lucide-react';
import type { Technician } from '../types/technician.types';
import type { TechnicianTeam } from '../types/team.types';
import { technicianService } from '../services/technicianService';
import { teamService } from '../services/teamService';
import { TechnicianTable } from '../components/TechnicianTable';
import { Button } from '../../../components/ui/Button';

export function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [teams, setTeams] = useState<TechnicianTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [techData, teamData] = await Promise.all([
          technicianService.list(),
          teamService.list(),
        ]);
        setTechnicians(techData);
        setTeams(teamData);
      } catch (err) {
        console.error('Failed to load technicians', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-green-600" />
            <span>Technicians & Field Engineers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain technician profiles, skills, qualifications, employment records, and regional crew assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/technicians/dashboard">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </Link>
          <Link to="/technicians/teams">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Users className="w-4 h-4" />}
            >
              Crews & Teams
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
          Loading technician roster...
        </div>
      ) : (
        <TechnicianTable
          technicians={technicians}
          teams={teams}
          canManage={true}
        />
      )}
    </div>
  );
}
