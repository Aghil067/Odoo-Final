/**
 * WarrantyClaimTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Claims listing ledger for M07: Warranty Management.
 */

import React, { useState } from 'react';
import { Search, AlertTriangle, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { ISSUE_CATEGORY_LABELS } from '../types/warrantyClaim.types';
import { ClaimStatusBadge, ClaimPriorityBadge } from './ClaimStatusBadge';

interface WarrantyClaimTableProps {
  claims: WarrantyClaim[];
  isLoading?: boolean;
}

export const WarrantyClaimTable: React.FC<WarrantyClaimTableProps> = ({
  claims,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = claims.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.serialNumber && c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.warrantyRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issueTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims by ID, customer, serial, issue..."
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
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="repair_in_progress">Repair in Progress</option>
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

          <Link
            to="/warranty/claims/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Link>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Claim ID & Date</th>
                <th className="px-4 py-3">Customer & Product</th>
                <th className="px-4 py-3">Serial & Warranty</th>
                <th className="px-4 py-3">Issue Category & Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Reviewer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading warranty claims...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No warranty claims found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">{c.claimId}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.claimDate}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.customerName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]">{c.productName}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-green-700 font-medium">
                        {c.serialNumber || 'Batch/Unserialized'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ref: {c.warrantyRef}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-slate-700 block truncate max-w-[200px]">
                        {ISSUE_CATEGORY_LABELS[c.issueCategory] || c.issueCategory}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px]" title={c.issueTitle}>
                        {c.issueTitle}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <ClaimPriorityBadge priority={c.priority} />
                    </td>

                    <td className="px-4 py-3">
                      <ClaimStatusBadge status={c.status} />
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-slate-800 font-medium">{c.assignedReviewerName || 'Unassigned'}</span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/warranty/claims/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
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
