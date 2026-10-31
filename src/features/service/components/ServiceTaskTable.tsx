/**
 * ServiceTaskTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Interactive tabular view for Service Tasks in Module M08.
 */

import React, { useState } from 'react';
import { Search, Wrench, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceTask } from '../types/serviceTask.types';
import { TaskStatusBadge } from './ServiceStatusBadge';

interface ServiceTaskTableProps {
  tasks: ServiceTask[];
  onOpenCreate?: () => void;
  isLoading?: boolean;
}

export const ServiceTaskTable: React.FC<ServiceTaskTableProps> = ({
  tasks,
  onOpenCreate,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = tasks.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search service tasks by task ID, ticket ref, customer, tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Task Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_parts">Awaiting Parts</option>
            <option value="completed">Completed</option>
          </select>

          {onOpenCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Service Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Task ID & Ticket</th>
                <th className="px-4 py-3">Customer & Location</th>
                <th className="px-4 py-3">Task Description</th>
                <th className="px-4 py-3">Assigned Technician</th>
                <th className="px-4 py-3">Scheduled Date</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading service tasks...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No service tasks found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">{t.taskId}</div>
                      <div className="text-[11px] text-green-700 font-mono mt-0.5">
                        Ref: {t.ticketRef}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.customerName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {t.siteAddress}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 line-clamp-2 max-w-[220px]" title={t.taskDescription}>
                        {t.taskDescription}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.requiredSkills.map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded capitalize">
                            {s.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {t.assignedTechnicianName || (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </div>
                      {t.assignedTeamName && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.assignedTeamName}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {t.scheduledDate || 'Not Scheduled'}
                      {t.scheduledTimeSlot && (
                        <div className="text-[10px] text-slate-400">{t.scheduledTimeSlot}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1 w-24">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span>{t.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.progressPercent === 100
                                ? 'bg-emerald-500'
                                : t.progressPercent > 40
                                ? 'bg-purple-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${t.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <TaskStatusBadge status={t.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/service/tasks/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Execute
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
