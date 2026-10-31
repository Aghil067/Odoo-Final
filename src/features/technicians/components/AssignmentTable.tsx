/**
 * AssignmentTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master listing table for installation and service task crew assignments.
 * Displays assigned teams, technicians, schedule periods, and status controls.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  ExternalLink,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import type {
  TechnicianAssignment,
  AssignmentStatus,
  AssignmentType,
} from '../types/assignment.types';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '../types/assignment.types';
import { Button } from '../../../components/ui/Button';

interface AssignmentTableProps {
  assignments: TechnicianAssignment[];
  canManage?: boolean;
  onNewAssignment: () => void;
  onUpdateStatus: (assignmentId: string, status: AssignmentStatus, notes?: string) => Promise<void>;
  onReassign: (assignment: TechnicianAssignment) => void;
}

const ITEMS_PER_PAGE = 8;

export function AssignmentTable({
  assignments,
  canManage = true,
  onNewAssignment,
  onUpdateStatus,
  onReassign,
}: AssignmentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AssignmentType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered dataset
  const filtered = useMemo(() => {
    return assignments.filter((item) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesId = item.assignmentId.toLowerCase().includes(q);
        const matchesRef = item.referenceId.toLowerCase().includes(q);
        const matchesCust = item.customerName.toLowerCase().includes(q);
        const matchesCity = item.siteCity.toLowerCase().includes(q);
        const matchesTech = item.assignedTechnicians.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesId && !matchesRef && !matchesCust && !matchesCity && !matchesTech) return false;
      }

      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      return true;
    });
  }, [assignments, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Top Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by assignment ID, customer, reference ID, or technician..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AssignmentStatus | 'all');
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
            >
              <option value="all">All Assignment Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reassigned">Reassigned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as AssignmentType | 'all');
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Work Types</option>
            <option value="installation">Installation Orders (M05)</option>
            <option value="service_task">Service Tasks (M08)</option>
          </select>

          {canManage && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={onNewAssignment}
            >
              Dispatch Crew / Technicians
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          No assignments found matching the filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Assignment ID</th>
                <th className="py-2.5 px-3">Linked Work Order</th>
                <th className="py-2.5 px-3">Customer & Site</th>
                <th className="py-2.5 px-3">Assigned Crew / Team</th>
                <th className="py-2.5 px-3">Scheduled Period</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((asn) => (
                <tr key={asn.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Assignment ID */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-emerald-700">
                      {asn.assignmentId}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {asn.type.replace('_', ' ')} • {asn.priority}
                    </span>
                  </td>

                  {/* Linked Reference */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {asn.type === 'installation' ? (
                        <Link
                          to={`/installations/${asn.referenceId.toLowerCase()}`}
                          className="hover:underline text-green-700 font-mono"
                        >
                          {asn.referenceId}
                        </Link>
                      ) : (
                        <span className="font-mono text-purple-700">{asn.referenceId}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {asn.referenceTitle}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {asn.customerName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {asn.siteCity} {asn.systemCapacity && `• ${asn.systemCapacity}`}
                    </div>
                  </td>

                  {/* Crew / Team */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asn.assignedTeamName || 'Direct Assignment'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {asn.assignedTechnicians.map((t) => t.name).join(', ')}
                    </div>
                  </td>

                  {/* Scheduled Period */}
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{asn.scheduledStartDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      to {asn.scheduledEndDate} ({asn.scheduledStartTime || '08:30'})
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        ASSIGNMENT_STATUS_COLORS[asn.status]
                      }`}
                    >
                      {ASSIGNMENT_STATUS_LABELS[asn.status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct jump to M05 Field Execution */}
                      {asn.type === 'installation' && (
                        <Link
                          to={`/installations/${asn.referenceId.toLowerCase()}/execution`}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
                          title="Open M05 Field Execution Screen"
                        >
                          <Wrench className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Quick status progress actions */}
                      {canManage && asn.status === 'assigned' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(asn.id, 'accepted', 'Accepted by manager on behalf of team')}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                          title="Mark Accepted"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onReassign(asn)}
                          className="p-1 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded"
                          title="Reassign Crew"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {asn.type === 'installation' && (
                        <Link
                          to={`/installations/${asn.referenceId.toLowerCase()}`}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="View Installation Dossier"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{' '}
            {filtered.length} assignments
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
