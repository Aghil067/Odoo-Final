/**
 * MyAssignmentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Technician field view: displays only work orders assigned to the logged-in technician.
 * Provides quick actions to Accept Assignment, Start Work, and launch the M05 execution interface.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  PlayCircle,
  Wrench,
} from 'lucide-react';
import type { TechnicianAssignment, AssignmentStatus } from '../types/assignment.types';
import type { Technician } from '../types/technician.types';
import { assignmentService } from '../services/assignmentService';
import { technicianService } from '../services/technicianService';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '../types/assignment.types';
import { Button } from '../../../components/ui/Button';

export function MyAssignmentsPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  // Simulated logged-in technician: default to Ramesh Patel (tech-001)
  const [currentTechId, setCurrentTechId] = useState<string>('tech-001');
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);

  // Load technicians list to allow persona switching during demo
  useEffect(() => {
    async function init() {
      try {
        const list = await technicianService.list();
        setTechnicians(list);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const loadAssignments = async (techId: string) => {
    try {
      const data = await assignmentService.getMyAssignments(techId);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load technician personal assignments', err);
    }
  };

  useEffect(() => {
    loadAssignments(currentTechId);
  }, [currentTechId]);

  const currentTechnician = technicians.find((t) => t.id === currentTechId);

  // Groupings
  const inProgressJobs = assignments.filter((a) => a.status === 'in_progress');
  const upcomingJobs = assignments.filter((a) => a.status === 'assigned' || a.status === 'accepted');
  const completedJobs = assignments.filter((a) => a.status === 'completed');

  const handleUpdateStatus = async (assignmentId: string, newStatus: AssignmentStatus) => {
    await assignmentService.updateStatus(
      assignmentId,
      newStatus,
      `Updated by ${currentTechnician?.fullName || 'Technician'} from My Assignments`,
      currentTechnician?.fullName || 'Technician'
    );
    await loadAssignments(currentTechId);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Persona Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                My Field Assignments
              </h1>
              <p className="text-xs text-slate-500">
                Personal task list and work order dispatches assigned to you
              </p>
            </div>
          </div>
        </div>

        {/* Demo Persona Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Logged-in Tech:</span>
          <select
            value={currentTechId}
            onChange={(e) => setCurrentTechId(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 bg-white font-semibold text-slate-800"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.teamName || 'Floater'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Technician Badge & Quick Status */}
      {currentTechnician && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
              {currentTechnician.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {currentTechnician.fullName} ({currentTechnician.technicianId})
              </div>
              <div className="text-slate-500 text-[11px]">
                Crew: <strong>{currentTechnician.teamName || 'Direct Crew'}</strong> • Supervisor: {currentTechnician.supervisorName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {inProgressJobs.length} In Progress
            </span>
            <span className="px-3 py-1 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {upcomingJobs.length} Upcoming
            </span>
          </div>
        </div>
      )}

      {/* SECTION 1: IN PROGRESS / ACTIVE ASSIGNMENTS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-cyan-600" />
          <span>Active Installations in Progress ({inProgressJobs.length})</span>
        </h2>

        {inProgressJobs.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No work orders currently in progress.
          </div>
        ) : (
          <div className="space-y-4">
            {inProgressJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border-2 border-cyan-300 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {job.referenceId}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {job.customerName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-cyan-100 text-cyan-800">
                        IN PROGRESS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {job.referenceTitle}
                    </p>
                  </div>

                  {job.type === 'installation' && (
                    <Link to={`/installations/${job.referenceId.toLowerCase()}/execution`}>
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Wrench className="w-4 h-4" />}
                      >
                        Launch Field Execution Screen
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Site Location:</span>
                    <div className="font-medium text-slate-800 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{job.siteAddress}, {job.siteCity}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Customer Contact:</span>
                    <div className="font-mono text-slate-800 font-semibold flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${job.customerPhone}`} className="hover:underline text-emerald-700">
                        {job.customerPhone}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Scheduled Period:</span>
                    <div className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.scheduledStartDate} → {job.scheduledEndDate}</span>
                    </div>
                  </div>
                </div>

                {job.workInstructions && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                    <strong>Instructions:</strong> {job.workInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: UPCOMING ASSIGNMENTS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Upcoming Dispatches ({upcomingJobs.length})</span>
        </h2>

        {upcomingJobs.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No upcoming assignments scheduled for your crew.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {job.referenceId}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {job.customerName}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                          ASSIGNMENT_STATUS_COLORS[job.status]
                        }`}
                      >
                        {ASSIGNMENT_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {job.referenceTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.status === 'assigned' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(job.id, 'accepted')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Accept Work Order
                      </Button>
                    )}

                    {job.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                        leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                      >
                        Start Field Work
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div>Site: <strong>{job.siteCity}</strong></div>
                  <div>Planned: <strong>{job.scheduledStartDate} to {job.scheduledEndDate}</strong></div>
                  <div>Phone: <strong className="font-mono">{job.customerPhone}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: COMPLETED ASSIGNMENTS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Completed Installations ({completedJobs.length})</span>
        </h2>

        {completedJobs.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No completed assignments in the current active log.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {completedJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">
                      {job.referenceId}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {job.customerName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Completed on {job.actualEndDate || job.scheduledEndDate} • {job.siteCity}
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                  COMPLETED
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
