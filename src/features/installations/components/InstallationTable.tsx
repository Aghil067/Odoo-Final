/**
 * InstallationTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master responsive table component for All Installations.
 * Supports keyword search, multi-faceted filtering, status tabs, and pagination.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Wrench,
} from 'lucide-react';
import type {
  Installation,
  InstallationStatus,
  InstallationType,
  MaterialReadinessStatus,
} from '../types/installation.types';
import {
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_COLORS,
  MATERIAL_READINESS_LABELS,
  MATERIAL_READINESS_COLORS,
} from '../types/installation.types';
import { Button } from '../../../components/ui/Button';

interface InstallationTableProps {
  installations: Installation[];
  canCreate?: boolean;
}

const ITEMS_PER_PAGE = 8;

export function InstallationTable({
  installations,
  canCreate = true,
}: InstallationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstallationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InstallationType | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialReadinessStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique teams
  const availableTeams = useMemo(() => {
    return Array.from(
      new Set(
        installations
          .map((i) => i.schedule.assignedTeam)
          .filter((t): t is string => Boolean(t))
      )
    );
  }, [installations]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return installations.filter((item) => {
      // Search keyword
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesId = item.installationId.toLowerCase().includes(q);
        const matchesCust = item.customerName.toLowerCase().includes(q);
        const matchesCity = item.siteCity.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        if (!matchesId && !matchesCust && !matchesCity && !matchesTitle) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Team filter
      if (teamFilter !== 'all' && item.schedule.assignedTeam !== teamFilter) return false;

      // Material readiness filter
      if (materialFilter !== 'all' && item.overallMaterialReadiness !== materialFilter) return false;

      return true;
    });
  }, [installations, searchTerm, statusFilter, typeFilter, teamFilter, materialFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, customer name, city, or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InstallationStatus | 'all');
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="awaiting_material">Awaiting Material</option>
              <option value="ready_for_scheduling">Ready for Scheduling</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="completion_submitted">Completion Submitted</option>
              <option value="verified">Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as InstallationType | 'all');
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>

          {/* Team Dropdown */}
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Teams</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          {/* Material Readiness Dropdown */}
          <select
            value={materialFilter}
            onChange={(e) => {
              setMaterialFilter(e.target.value as MaterialReadinessStatus | 'all');
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Material States</option>
            <option value="not_checked">Not Checked</option>
            <option value="available">Available</option>
            <option value="partially_available">Partially Available</option>
            <option value="issued">Issued</option>
          </select>

          {canCreate && (
            <Link to="/installations/new">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Work Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs space-y-2">
          <Layers className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No installation work orders found</p>
          <p>Try resetting filters or search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer & Site</th>
                <th className="py-2.5 px-3">System / Capacity</th>
                <th className="py-2.5 px-3">Scheduled Dates</th>
                <th className="py-2.5 px-3">Assigned Team</th>
                <th className="py-2.5 px-3 text-center">Material Status</th>
                <th className="py-2.5 px-3 text-center">Work Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    <Link
                      to={`/installations/${inst.id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>{inst.installationId}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {inst.customerName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">
                      {inst.siteAddress}, {inst.siteCity}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">
                      {inst.systemCapacity}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {inst.systemType.replace('_', ' ')} • {inst.type}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{inst.schedule.plannedStartDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      to {inst.schedule.plannedEndDate}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">
                      {inst.schedule.assignedTeam || (
                        <span className="text-slate-400 italic">Unassigned (M06)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mgr: {inst.schedule.installationManager}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        MATERIAL_READINESS_COLORS[inst.overallMaterialReadiness]
                      }`}
                    >
                      {MATERIAL_READINESS_LABELS[inst.overallMaterialReadiness]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        INSTALLATION_STATUS_COLORS[inst.status]
                      }`}
                    >
                      {INSTALLATION_STATUS_LABELS[inst.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/installations/${inst.id}`}
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
                        title="View Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/installations/${inst.id}/execution`}
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
                        title="Field Execution Screen"
                      >
                        <Wrench className="w-4 h-4" />
                      </Link>
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
            {filtered.length} work orders
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

