/**
 * ServiceTicketTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Service Tickets Ledger Table for Module M08.
 */

import React, { useState } from 'react';
import { Search, HeadphonesIcon, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceTicket } from '../types/serviceTicket.types';
import { SERVICE_ISSUE_CATEGORY_LABELS } from '../types/serviceTicket.types';
import {
  TicketStatusBadge,
  PriorityBadge,
  WarrantyIndicatorBadge,
} from './ServiceStatusBadge';

interface ServiceTicketTableProps {
  tickets: ServiceTicket[];
  isLoading?: boolean;
}

export const ServiceTicketTable: React.FC<ServiceTicketTableProps> = ({
  tickets,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warrantyFilter, setWarrantyFilter] = useState('all');

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.installationRef && t.installationRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.issueTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.issueCategory === categoryFilter;
    const matchesWarranty = warrantyFilter === 'all' || t.warrantyIndicator === warrantyFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesWarranty;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, customer, equipment, serial number, issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="awaiting_parts">Awaiting Parts</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Issue Categories</option>
            <option value="inverter_failure">Inverter Failure</option>
            <option value="battery_problem">Battery Problem</option>
            <option value="solar_panel_damage">Panel Damage</option>
            <option value="low_power_generation">Low Generation</option>
            <option value="electrical_fault">Electrical Fault</option>
          </select>

          {/* Warranty Filter */}
          <select
            value={warrantyFilter}
            onChange={(e) => setWarrantyFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Warranty States</option>
            <option value="active">Active Warranty</option>
            <option value="expired">Expired Warranty</option>
            <option value="pending_activation">Pending Activation</option>
            <option value="none">No Warranty</option>
          </select>

          <Link
            to="/service/tickets/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Ticket ID & Date</th>
                <th className="px-4 py-3">Customer & Installation</th>
                <th className="px-4 py-3">Product & Serial</th>
                <th className="px-4 py-3">Issue Category & Headline</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assigned Tech</th>
                <th className="px-4 py-3">Ticket Status</th>
                <th className="px-4 py-3">Warranty</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading service tickets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <HeadphonesIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No service tickets match your search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">{t.ticketId}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.reportedDate}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ref: {t.installationRef || 'Over-the-counter'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{t.productName}</div>
                      <div className="text-[11px] font-mono text-green-700">
                        SN: {t.serialNumber || 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-slate-800 block truncate max-w-[190px]">
                        {SERVICE_ISSUE_CATEGORY_LABELS[t.issueCategory] || t.issueCategory}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[210px]" title={t.issueTitle}>
                        {t.issueTitle}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {t.assignedTechnicianName || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                      {t.scheduledVisitDate && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Visit: {t.scheduledVisitDate}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <TicketStatusBadge status={t.status} />
                    </td>

                    <td className="px-4 py-3">
                      <WarrantyIndicatorBadge indicator={t.warrantyIndicator} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/service/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
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
