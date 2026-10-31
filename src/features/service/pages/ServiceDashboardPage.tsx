/**
 * ServiceDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Executive Service Management Dashboard for Module M08.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Wrench,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import type { ServiceTicket, ServiceDashboardMetrics } from '../types/serviceTicket.types';
import type { ServiceTask } from '../types/serviceTask.types';
import { serviceTicketService } from '../services/serviceTicketService';
import { serviceTaskService } from '../services/serviceTaskService';
import { TicketStatusBadge, PriorityBadge } from '../components/ServiceStatusBadge';

export const ServiceDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceDashboardMetrics | null>(null);
  const [highPriorityTickets, setHighPriorityTickets] = useState<ServiceTicket[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<ServiceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [mRes, tRes, taskRes] = await Promise.all([
          serviceTicketService.getDashboardMetrics(),
          serviceTicketService.list(),
          serviceTaskService.list(),
        ]);

        setMetrics(mRes);
        const tickets = tRes.data || [];
        setHighPriorityTickets(
          tickets.filter((t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'closed')
        );
        setUpcomingTasks(
          (taskRes.data || []).filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
        );
      } catch (err) {
        console.error('Failed to load service dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        Loading customer service operations dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">After-Sales Service Operations Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time management of customer complaints, diagnostic service tickets, on-site repairs, and parts replacement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/service/my-tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 text-xs font-semibold rounded-lg transition-colors"
          >
            <Wrench className="w-4 h-4" />
            My Service Tasks
          </Link>
          <Link
            to="/service/history"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            Service History
          </Link>
          <Link
            to="/service/tickets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Service Request
          </Link>
        </div>
      </div>

      {/* Advisory notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Demonstration Dataset:</span> Service request telemetry, field repair logs, and technician assignments represent simulated rooftop operations for SunPower Solutions.
        </p>
      </div>

      {/* 7 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Total Tickets
          </span>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalTickets || 0}</div>
          <div className="text-[10px] text-slate-400">All recorded</div>
        </div>

        {/* New */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-1 bg-blue-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 block">
            New Requests
          </span>
          <div className="text-2xl font-bold text-blue-700">{metrics?.newTickets || 0}</div>
          <div className="text-[10px] text-blue-600 font-medium">Unreviewed</div>
        </div>

        {/* Open */}
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm space-y-1 bg-indigo-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 block">
            Open / Active
          </span>
          <div className="text-2xl font-bold text-indigo-700">{metrics?.openTickets || 0}</div>
          <div className="text-[10px] text-indigo-600 font-medium">Under triage</div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm space-y-1 bg-purple-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 block">
            In Progress
          </span>
          <div className="text-2xl font-bold text-purple-700">{metrics?.inProgressTickets || 0}</div>
          <div className="text-[10px] text-purple-600 font-medium">Field work</div>
        </div>

        {/* Pending Response */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
            Pending Customer
          </span>
          <div className="text-2xl font-bold text-amber-700">{metrics?.pendingCustomerResponse || 0}</div>
          <div className="text-[10px] text-amber-600 font-medium">Site access / info</div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
            Resolved
          </span>
          <div className="text-2xl font-bold text-emerald-700">{metrics?.resolvedTickets || 0}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Rectified</div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm space-y-1 bg-rose-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">
            Overdue Tasks
          </span>
          <div className="text-2xl font-bold text-rose-700">{metrics?.overdueTickets || 0}</div>
          <div className="text-[10px] text-rose-500 font-medium">SLA breach risk</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): High-Priority Incidents & Upcoming Visits */}
        <div className="lg:col-span-2 space-y-6">
          {/* High Priority Tickets */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Urgent & Critical Service Incidents
                </h3>
                <p className="text-xs text-slate-500">High impact inverter tripping or power outages.</p>
              </div>
              <Link
                to="/service/tickets"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                View Tickets <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {highPriorityTickets.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No high-priority service incidents currently open.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {highPriorityTickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{t.ticketId}</span>
                        <TicketStatusBadge status={t.status} size="sm" />
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{t.issueTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.customerName} • {t.productName} (SN: {t.serialNumber || 'N/A'})
                      </p>
                    </div>

                    <Link
                      to={`/service/tickets/${t.id}`}
                      className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors shrink-0"
                    >
                      Triage
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Service Tasks & Visits */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Scheduled Field Service Visits
                </h3>
                <p className="text-xs text-slate-500">On-site inspections and component replacement schedules.</p>
              </div>
              <Link
                to="/service/tasks"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                View Tasks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No field visits scheduled.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{task.taskId}</span>
                        <span className="font-mono text-slate-400">Ref: {task.ticketRef}</span>
                        <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Visit: {task.scheduledDate || 'TBD'}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800">{task.taskDescription}</p>
                      <p className="text-[11px] text-slate-500">
                        Technician: <span className="font-semibold text-slate-700">{task.assignedTechnicianName || 'Unassigned'}</span> • {task.siteAddress}
                      </p>
                    </div>

                    <Link
                      to={`/service/tasks/${task.id}`}
                      className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 font-medium"
                    >
                      Execute
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Categories Breakdown & Shortcuts */}
        <div className="space-y-6">
          {/* Issue Categories Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-green-600" />
              Service Tickets by Issue Category
            </h3>

            <div className="space-y-2.5">
              {(metrics?.categoryDistribution || []).map((cat) => (
                <div key={cat.category} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="capitalize text-slate-800">{cat.category.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-900">{cat.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${metrics?.totalTickets ? (cat.count / metrics.totalTickets) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Service Management Portals
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/service/tickets"
                className="p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">All Service Tickets</p>
                  <p className="text-[11px] text-slate-500">Search customer complaint records</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/service/tasks"
                className="p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">Service Tasks Roster</p>
                  <p className="text-[11px] text-slate-500">Track field technician dispatches</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/service/my-tasks"
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">My Field Tasks</p>
                  <p className="text-[11px] text-slate-500">Field inspection & repair view</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
