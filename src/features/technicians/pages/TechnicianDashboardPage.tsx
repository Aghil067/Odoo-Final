/**
 * TechnicianDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Executive and Operational dashboard for Module M06: Technician Management.
 * Real-time overview of workforce availability, team workloads, active dispatches,
 * and pending unassigned installations.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  PlayCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import type { Technician } from '../types/technician.types';
import type { TechnicianTeam } from '../types/team.types';
import type { TechnicianAssignment } from '../types/assignment.types';
import type { TechnicianDashboardStats } from '../services/technicianService';
import { technicianService } from '../services/technicianService';
import { teamService } from '../services/teamService';
import { assignmentService } from '../services/assignmentService';
import {
  AVAILABILITY_STATUS_COLORS,
} from '../types/technician.types';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '../types/assignment.types';
import { Button } from '../../../components/ui/Button';

export function TechnicianDashboardPage() {
  const [stats, setStats] = useState<TechnicianDashboardStats | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [teams, setTeams] = useState<TechnicianTeam[]>([]);
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [techStats, allTech, allTeams, allAsn] = await Promise.all([
          technicianService.getDashboardStats(),
          technicianService.list(),
          teamService.list(),
          assignmentService.list(),
        ]);
        setStats(techStats);
        setTechnicians(allTech);
        setTeams(allTeams);
        setAssignments(allAsn);
      } catch (err) {
        console.error('Failed to load technician dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeAssignments = assignments.filter((a) => a.status === 'in_progress');
  const upcomingAssignments = assignments.filter((a) => a.status === 'assigned');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-green-600" />
            <span>Technician Workforce & Dispatch Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Workforce tracking, field team assignments, availability monitoring, and M05 installation dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/technicians/assignments">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Briefcase className="w-4 h-4" />}
            >
              Assignments
            </Button>
          </Link>
          <Link to="/technicians/new">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Technician
            </Button>
          </Link>
        </div>
      </div>

      {/* Demonstration Data Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Demonstration Environment • Field Workforce Operations</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Syncs with M05 Installation Work Orders and live field schedules
        </span>
      </div>

      {/* Summary Cards Row (6 Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Technicians</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '—' : stats?.totalTechnicians}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Full-time & contract</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Available Now</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {isLoading ? '—' : stats?.availableTechnicians}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for dispatch</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Assigned / Busy</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {isLoading ? '—' : (stats?.assignedTechnicians || 0) + (stats?.busyTechnicians || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active on field sites</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">On Leave</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {isLoading ? '—' : stats?.techniciansOnLeave}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Approved time off</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Active Crews</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {isLoading ? '—' : teams.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Regional divisions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Completed Jobs</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {isLoading ? '—' : stats?.completedAssignments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Historical verified</div>
        </div>
      </div>

      {/* Two Column Grid for Key Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Currently Deployed Technicians (In Progress) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-cyan-600" />
              <span>Active Field Deployments ({activeAssignments.length})</span>
            </h3>
            <Link
              to="/technicians/assignments?status=in_progress"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              View all
            </Link>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No technicians currently deployed on active jobs.
            </div>
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {job.referenceId}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {job.customerName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                          ASSIGNMENT_STATUS_COLORS[job.status]
                        }`}
                      >
                        {ASSIGNMENT_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Crew: <strong>{job.assignedTeamName || 'Direct Crew'}</strong> ({job.assignedTechnicians.map((t) => t.name).join(', ')})
                    </div>
                  </div>

                  <Link
                    to={job.type === 'installation' ? `/installations/${job.referenceId.toLowerCase()}/execution` : `/technicians/assignments`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                  >
                    <span>Field App</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 2: Upcoming Scheduled Assignments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Scheduled Dispatches ({upcomingAssignments.length})</span>
            </h3>
            <Link
              to="/technicians/assignments"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              All Assignments
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No upcoming assignments awaiting execution.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">
                        {job.customerName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {job.referenceId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{job.scheduledStartDate} → {job.scheduledEndDate}</span>
                      <span>•</span>
                      <span>{job.assignedTeamName}</span>
                    </div>
                  </div>

                  <Link
                    to="/technicians/assignments"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 3: Live Technician Availability Watch */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Available Technicians Roster</span>
            </h3>
            <Link
              to="/technicians/availability"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              Full Schedule
            </Link>
          </div>

          <div className="space-y-2">
            {technicians
              .filter((t) => t.availabilityStatus === 'available')
              .slice(0, 5)
              .map((tech) => (
                <div
                  key={tech.id}
                  className="border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{tech.fullName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {tech.teamName || 'Floater'} • {tech.qualification.yearsOfExperience} yrs exp
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      AVAILABILITY_STATUS_COLORS[tech.availabilityStatus]
                    }`}
                  >
                    READY
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Widget 4: Regional Team Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Field Crews & Regional Divisions</span>
            </h3>
            <Link
              to="/technicians/teams"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              Manage Teams
            </Link>
          </div>

          <div className="space-y-2">
            {teams.slice(0, 4).map((tm) => (
              <div
                key={tm.id}
                className="border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{tm.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Leader: {tm.leaderName} • {tm.operatingRegion}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700">{tm.memberCount}</span> members
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {tm.currentActiveJobsCount} active job
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
