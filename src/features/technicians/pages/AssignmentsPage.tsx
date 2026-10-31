/**
 * AssignmentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master assignment management page: allocates field crews and technicians
 * to M05 Installation Work Orders and future M08 Service Tasks.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, HardHat, Calendar, Plus } from 'lucide-react';
import type { TechnicianAssignment, AssignmentStatus, AssignmentFormData } from '../types/assignment.types';
import type { TechnicianTeam } from '../types/team.types';
import type { Technician } from '../types/technician.types';
import type { Installation } from '../../installations/types/installation.types';
import { assignmentService } from '../services/assignmentService';
import { teamService } from '../services/teamService';
import { technicianService } from '../services/technicianService';
import { installationService } from '../../installations/services/installationService';
import { AssignmentTable } from '../components/AssignmentTable';
import { AssignmentFormModal } from '../components/AssignmentFormModal';
import { Button } from '../../../components/ui/Button';

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);
  const [teams, setTeams] = useState<TechnicianTeam[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TechnicianAssignment | undefined>(undefined);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [asnData, teamData, techData, instData] = await Promise.all([
        assignmentService.list(),
        teamService.list(),
        technicianService.list(),
        installationService.list(),
      ]);
      setAssignments(asnData);
      setTeams(teamData);
      setTechnicians(techData);
      setInstallations(instData);
    } catch (err) {
      console.error('Failed to load assignments data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNewAssignment = () => {
    setSelectedAssignment(undefined);
    setIsModalOpen(true);
  };

  const handleReassign = (assignment: TechnicianAssignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (assignmentId: string, status: AssignmentStatus, notes?: string) => {
    await assignmentService.updateStatus(assignmentId, status, notes, 'Installation Manager');
    await loadData();
  };

  const handleFormSubmit = async (formData: AssignmentFormData) => {
    if (selectedAssignment) {
      await assignmentService.reassign(
        selectedAssignment.id,
        formData.assignedTeamId,
        formData.technicianIds,
        'Installation Manager'
      );
    } else {
      await assignmentService.create(formData, 'Installation Manager');
    }
    await loadData();
  };

  // Map M05 installations to eligible options
  const eligibleInstallations = installations.map((inst) => ({
    id: inst.id,
    installationId: inst.installationId,
    customerName: inst.customerName,
    customerPhone: inst.customerPhone,
    siteCity: inst.siteCity,
    siteAddress: inst.siteAddress,
    systemCapacity: inst.systemCapacity,
    systemType: inst.systemType,
    plannedStartDate: inst.schedule.plannedStartDate,
    plannedEndDate: inst.schedule.plannedEndDate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-green-600" />
            <span>Technician & Crew Assignment Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch installation crews to M05 work orders and allocate technicians based on skill matching and real-time availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/technicians/my-assignments">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<HardHat className="w-4 h-4" />}
            >
              My Assignments View
            </Button>
          </Link>
          <Link to="/technicians/availability">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Check Availability
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleNewAssignment}
          >
            Dispatch Crew
          </Button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading assignment ledger...
        </div>
      ) : (
        <AssignmentTable
          assignments={assignments}
          canManage={true}
          onNewAssignment={handleNewAssignment}
          onUpdateStatus={handleUpdateStatus}
          onReassign={handleReassign}
        />
      )}

      {/* Modal */}
      <AssignmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        teams={teams}
        technicians={technicians}
        initialAssignment={selectedAssignment}
        eligibleInstallations={eligibleInstallations}
      />
    </div>
  );
}
