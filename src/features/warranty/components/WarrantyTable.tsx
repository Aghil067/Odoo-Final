/**
 * WarrantyTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Interactive tabular listing for Warranty Records in M07.
 */

import React, { useState } from 'react';
import { Search, Shield, Eye, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyRecord, WarrantyStatus } from '../types/warranty.types';
import { WarrantyStatusBadge } from './WarrantyStatusBadge';

interface WarrantyTableProps {
  warranties: WarrantyRecord[];
  onQuickActivate?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function formatRemainingCoverage(expiryDateStr?: string, status?: WarrantyStatus): {
  text: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (status === 'draft') return { text: 'Draft Registration', isUrgent: false, isExpired: false };
  if (status === 'pending_activation') return { text: 'Pending Activation', isUrgent: false, isExpired: false };
  if (!expiryDateStr) return { text: 'Not Activated', isUrgent: false, isExpired: false };

  const now = new Date();
  const exp = new Date(expiryDateStr);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const elapsedDays = Math.abs(diffDays);
    if (elapsedDays > 365) {
      return { text: `Expired ${(elapsedDays / 365).toFixed(1)} yrs ago`, isUrgent: false, isExpired: true };
    }
    return { text: `Expired ${elapsedDays}d ago`, isUrgent: false, isExpired: true };
  }

  if (diffDays <= 30) {
    return { text: `${diffDays} days remaining`, isUrgent: true, isExpired: false };
  }

  if (diffDays <= 90) {
    const months = Math.ceil(diffDays / 30);
    return { text: `~${months} months left`, isUrgent: true, isExpired: false };
  }

  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return {
      text: `${years} yr${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `${remainingMonths} mo` : ''} left`,
      isUrgent: false,
      isExpired: false,
    };
  }

  return { text: `${Math.ceil(diffDays / 30)} months left`, isUrgent: false, isExpired: false };
}

export const WarrantyTable: React.FC<WarrantyTableProps> = ({
  warranties,
  onQuickActivate,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'expiry' | 'id' | 'customer'>('expiry');

  const filtered = warranties
    .filter((w) => {
      const matchesSearch =
        !searchTerm ||
        w.warrantyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.serialNumber && w.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.installationRef && w.installationRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        w.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || w.productCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortField === 'expiry') {
        const tA = a.warrantyExpiryDate ? new Date(a.warrantyExpiryDate).getTime() : 0;
        const tB = b.warrantyExpiryDate ? new Date(b.warrantyExpiryDate).getTime() : 0;
        return tA - tB;
      }
      if (sortField === 'customer') {
        return a.customerName.localeCompare(b.customerName);
      }
      return a.warrantyId.localeCompare(b.warrantyId);
    });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by warranty ID, customer, serial number, installation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_activation">Pending Activation</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="draft">Draft</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Hardware</option>
            <option value="inverter">Inverter</option>
            <option value="solar_panels">Solar Panels</option>
            <option value="battery">Battery Storage</option>
            <option value="charge_controller">Charge Controller</option>
          </select>

          {/* Sort */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="expiry">Sort by Expiry Date</option>
            <option value="customer">Sort by Customer</option>
            <option value="id">Sort by Warranty ID</option>
          </select>

          <Link
            to="/warranty/register"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            Register Warranty
          </Link>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Warranty ID</th>
                <th className="px-4 py-3">Customer & Site</th>
                <th className="px-4 py-3">Product & Serial</th>
                <th className="px-4 py-3">Policy & Type</th>
                <th className="px-4 py-3">Coverage Window</th>
                <th className="px-4 py-3">Remaining Coverage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading warranty records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No warranty records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const coverageInfo = formatRemainingCoverage(w.warrantyExpiryDate, w.status);

                  return (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 font-mono">
                          {w.warrantyId}
                        </span>
                        {w.installationRef && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Ref: {w.installationRef}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{w.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {w.siteAddress || w.customerPhone}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{w.productName}</div>
                        <div className="text-[11px] font-mono text-green-700 mt-0.5">
                          SN: {w.serialNumber || 'Batch/Unserialized'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 truncate max-w-[180px]" title={w.policyName}>
                          {w.policyName}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {w.coverageType} ({w.durationValue} {w.durationUnit})
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-700 font-mono text-[11px]">
                          {w.warrantyStartDate || 'Pending'} → {w.warrantyExpiryDate || 'Pending'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Basis: {w.activationBasis.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            coverageInfo.isExpired
                              ? 'text-rose-600'
                              : coverageInfo.isUrgent
                              ? 'text-orange-600 font-semibold'
                              : 'text-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {coverageInfo.text}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <WarrantyStatusBadge status={w.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {w.status === 'pending_activation' && onQuickActivate && (
                            <button
                              type="button"
                              onClick={() => onQuickActivate(w.id)}
                              className="px-2 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors inline-flex items-center gap-1"
                              title="Activate Warranty"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Activate
                            </button>
                          )}
                          <Link
                            to={`/warranty/${w.id}`}
                            className="p-1.5 text-slate-500 hover:text-green-700 hover:bg-slate-100 rounded transition-colors"
                            title="View Warranty Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
