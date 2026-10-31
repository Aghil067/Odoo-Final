/**
 * InstallationDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Executive and Operational dashboard for Module M05: Installation Management.
 * Displays real-time operational metric cards, upcoming schedule, delay alerts,
 * material readiness indicators, and pending completion reviews.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  PackageCheck,
  FileCheck2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { Installation } from '../types/installation.types';
import type { InstallationDashboardStats } from '../services/installationService';
import { installationService } from '../services/installationService';
import {
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_COLORS,
  MATERIAL_READINESS_LABELS,
  MATERIAL_READINESS_COLORS,
} from '../types/installation.types';
import { Button } from '../../../components/ui/Button';

export function InstallationDashboardPage() {
  const [stats, setStats] = useState<InstallationDashboardStats | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [dashStats, allInst] = await Promise.all([
          installationService.getDashboardStats(),
          installationService.list(),
        ]);
        setStats(dashStats);
        setInstallations(allInst);
      } catch (err) {
        console.error('Failed to load installation dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Slices for operational widgets
  const upcomingJobs = installations
    .filter((i) => i.status === 'scheduled' || i.status === 'ready_for_scheduling')
    .slice(0, 4);

  const inProgressJobs = installations
    .filter((i) => i.status === 'in_progress')
    .slice(0, 4);

  const pendingCompletions = installations
    .filter((i) => i.status === 'completion_submitted')
    .slice(0, 3);

  const delayedJobs = installations
    .filter((i) => {
      const isClosed = ['completed', 'completion_submitted', 'verified', 'cancelled'].includes(i.status);
      return !isClosed && i.schedule.plannedEndDate < '2026-10-31';
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-green-600" />
            <span>Installation Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Work order execution, material readiness, site crews, and customer commissioning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/installations/schedule">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Calendar Schedule
            </Button>
          </Link>
          <Link to="/installations/new">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              New Installation
            </Button>
          </Link>
        </div>
      </div>

      {/* Demonstration Data Watermark */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Demonstration Environment • Rooftop Solar Field Operations</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Integrated with M01 CRM • M02 Survey • M03 Config • M04 Inventory
        </span>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Orders</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '—' : stats?.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span>Active pipeline</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Draft / Material</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {isLoading ? '—' : (stats?.draft || 0) + (stats?.awaitingMaterial || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pre-planning stage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {isLoading ? '—' : (stats?.scheduled || 0) + (stats?.readyForScheduling || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for crew</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">In Progress</div>
          <div className="text-2xl font-bold text-cyan-600 mt-1">
            {isLoading ? '—' : stats?.inProgress}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Live at customer sites</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Completed</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {isLoading ? '—' : (stats?.completed || 0) + (stats?.verified || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Executed & verified</div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs bg-rose-50/20">
          <div className="text-xs font-semibold text-rose-700">Delayed / Hold</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {isLoading ? '—' : (stats?.delayed || 0) + (stats?.onHold || 0)}
          </div>
          <div className="text-[11px] text-rose-500 mt-1">Requires attention</div>
        </div>
      </div>

      {/* Two Column Grid for Key Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Field Execution In Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-cyan-600" />
              <span>Active Field Installations</span>
            </h3>
            <Link
              to="/installations?status=in_progress"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              View all
            </Link>
          </div>

          {inProgressJobs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No installations currently in progress.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inProgressJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {job.installationId}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {job.customerName}
                      </span>
                      <span className="text-[11px] px-2 py-0.2 bg-cyan-50 text-cyan-800 rounded font-bold border border-cyan-200">
                        {job.systemCapacity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Crew: <strong>{job.schedule.assignedTeam || 'Crew Alpha'}</strong></span>
                      <span>•</span>
                      <span>{job.siteCity}</span>
                    </div>
                  </div>

                  <Link
                    to={`/installations/${job.id}/execution`}
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

        {/* Widget 2: Pending Manager Completion Sign-offs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>Pending Handover Approvals</span>
            </h3>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {pendingCompletions.length} Pending
            </span>
          </div>

          {pendingCompletions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No completion dossiers awaiting manager verification.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingCompletions.map((job) => (
                <div
                  key={job.id}
                  className="border border-purple-100 bg-purple-50/20 rounded-lg p-3 hover:bg-purple-50/40 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-800">
                        {job.installationId}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {job.customerName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Tested: <strong>Passed</strong> • Customer Sign-off: <strong>Confirmed</strong>
                    </div>
                  </div>

                  <Link
                    to={`/installations/${job.id}/completion`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                  >
                    <span>Verify Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 3: Upcoming Scheduled Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Scheduled Deployments</span>
            </h3>
            <Link
              to="/installations/schedule"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              Full Calendar
            </Link>
          </div>

          {upcomingJobs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No deployments scheduled for next 7 days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">
                        {job.customerName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${
                          INSTALLATION_STATUS_COLORS[job.status]
                        }`}
                      >
                        {INSTALLATION_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{job.schedule.plannedStartDate} → {job.schedule.plannedEndDate}</span>
                      <span>•</span>
                      <span>{job.schedule.assignedTeam || 'Pending Team'}</span>
                    </div>
                  </div>

                  <Link
                    to={`/installations/${job.id}`}
                    className="text-slate-400 hover:text-slate-800"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 4: Material Readiness Overview & Delay Watch */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Material Readiness Watchlist</span>
            </h3>
            <Link
              to="/inventory/stock"
              className="text-xs text-green-700 hover:underline font-semibold"
            >
              M04 Inventory
            </Link>
          </div>

          <div className="space-y-2.5">
            {installations.slice(0, 4).map((job) => (
              <div
                key={job.id}
                className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {job.installationId} • {job.customerName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {job.systemCapacity} {job.systemType.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                      MATERIAL_READINESS_COLORS[job.overallMaterialReadiness]
                    }`}
                  >
                    {MATERIAL_READINESS_LABELS[job.overallMaterialReadiness]}
                  </span>
                  <Link
                    to={`/installations/${job.id}`}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Delayed Jobs Notification Banner if any */}
          {delayedJobs.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{delayedJobs.length} job(s)</strong> have reached planned completion date.
                </span>
              </div>
              <Link
                to="/installations?status=on_hold"
                className="font-bold underline text-amber-900 hover:text-amber-950"
              >
                Review Delays
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Looking for all work order archives or searching by serial number?
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/installations"
            className="font-semibold text-green-700 hover:underline"
          >
            All Work Orders
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/inventory/serial-numbers"
            className="font-semibold text-green-700 hover:underline"
          >
            Serial Number Ledger (M04)
          </Link>
        </div>
      </div>
    </div>
  );
}

