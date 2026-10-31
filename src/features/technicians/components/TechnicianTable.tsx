/**
 * TechnicianTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master responsive table component for Technician Profiles.
 * Supports search, multi-faceted filtering by skill, team, and availability.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
  HardHat,
} from 'lucide-react';
import type {
  Technician,
  TechnicianSkill,
  AvailabilityStatus,
  EmploymentStatus,
} from '../types/technician.types';
import {
  TECHNICIAN_SKILL_LABELS,
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_STATUS_COLORS,
  EMPLOYMENT_STATUS_COLORS,
} from '../types/technician.types';
import type { TechnicianTeam } from '../types/team.types';
import { Button } from '../../../components/ui/Button';

interface TechnicianTableProps {
  technicians: Technician[];
  teams: TechnicianTeam[];
  canManage?: boolean;
}

const ITEMS_PER_PAGE = 8;

export function TechnicianTable({
  technicians,
  teams,
  canManage = true,
}: TechnicianTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<TechnicianSkill | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [availFilter, setAvailFilter] = useState<AvailabilityStatus | 'all'>('all');
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered dataset
  const filtered = useMemo(() => {
    return technicians.filter((tech) => {
      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = tech.fullName.toLowerCase().includes(q);
        const matchesId = tech.technicianId.toLowerCase().includes(q);
        const matchesPhone = tech.phone.includes(q);
        const matchesCity = tech.city.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesCity) return false;
      }

      // Skill filter
      if (skillFilter !== 'all' && !tech.skills.includes(skillFilter)) return false;

      // Team filter
      if (teamFilter !== 'all' && tech.teamId !== teamFilter) return false;

      // Availability filter
      if (availFilter !== 'all' && tech.availabilityStatus !== availFilter) return false;

      // Employment status filter
      if (employmentFilter !== 'all' && tech.employmentStatus !== employmentFilter) return false;

      return true;
    });
  }, [technicians, searchTerm, skillFilter, teamFilter, availFilter, employmentFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Top Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, TECH ID, phone, or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter Dropdowns & New Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Skill Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value as TechnicianSkill | 'all');
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
            >
              <option value="all">All Skills</option>
              {(Object.keys(TECHNICIAN_SKILL_LABELS) as TechnicianSkill[]).map((sk) => (
                <option key={sk} value={sk}>
                  {TECHNICIAN_SKILL_LABELS[sk]}
                </option>
              ))}
            </select>
          </div>

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
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>

          {/* Availability Dropdown */}
          <select
            value={availFilter}
            onChange={(e) => {
              setAvailFilter(e.target.value as AvailabilityStatus | 'all');
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Availability</option>
            {(Object.keys(AVAILABILITY_STATUS_LABELS) as AvailabilityStatus[]).map((st) => (
              <option key={st} value={st}>
                {AVAILABILITY_STATUS_LABELS[st]}
              </option>
            ))}
          </select>

          {/* Employment Status Dropdown */}
          <select
            value={employmentFilter}
            onChange={(e) => {
              setEmploymentFilter(e.target.value as EmploymentStatus | 'all');
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white text-xs text-slate-700"
          >
            <option value="all">All Employment</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>

          {canManage && (
            <Link to="/technicians/new">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Register Technician
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs space-y-2">
          <HardHat className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No technicians found</p>
          <p>Try resetting your search query or filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Assigned Team</th>
                <th className="py-2.5 px-3">Key Skills</th>
                <th className="py-2.5 px-3 text-center">Experience</th>
                <th className="py-2.5 px-3 text-center">Availability</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Technician ID & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      {tech.profilePhotoUrl ? (
                        <img
                          src={tech.profilePhotoUrl}
                          alt={tech.fullName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                          {tech.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <Link
                          to={`/technicians/${tech.id}`}
                          className="font-semibold text-slate-900 hover:text-green-700 hover:underline block"
                        >
                          {tech.fullName}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {tech.technicianId}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-3 text-slate-600">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{tech.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px]">{tech.email}</span>
                    </div>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800">
                      {tech.teamName || <span className="text-slate-400 italic">No Team</span>}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {tech.city}, {tech.state}
                    </div>
                  </td>

                  {/* Skills tags */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {tech.skills.slice(0, 2).map((sk) => (
                        <span
                          key={sk}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {TECHNICIAN_SKILL_LABELS[sk]}
                        </span>
                      ))}
                      {tech.skills.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] border border-slate-200">
                          +{tech.skills.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Experience */}
                  <td className="py-3 px-3 text-center font-semibold text-slate-800">
                    {tech.qualification.yearsOfExperience} yrs
                  </td>

                  {/* Availability */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        AVAILABILITY_STATUS_COLORS[tech.availabilityStatus]
                      }`}
                    >
                      {AVAILABILITY_STATUS_LABELS[tech.availabilityStatus]}
                    </span>
                  </td>

                  {/* Employment Status */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        EMPLOYMENT_STATUS_COLORS[tech.employmentStatus]
                      }`}
                    >
                      {tech.employmentStatus.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/technicians/${tech.id}`}
                        className="p-1 text-slate-500 hover:text-green-700 hover:bg-slate-100 rounded"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canManage && (
                        <Link
                          to={`/technicians/${tech.id}/edit`}
                          className="p-1 text-slate-500 hover:text-green-700 hover:bg-slate-100 rounded"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
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
            {filtered.length} technicians
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
