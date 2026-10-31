/**
 * ExpiringWarrantiesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Dedicated Expiring Warranties Management Page in M07.
 */

import React, { useState, useEffect } from 'react';
import { Clock, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyRecord } from '../types/warranty.types';
import { warrantyService } from '../services/warrantyService';
import { WarrantyStatusBadge } from '../components/WarrantyStatusBadge';
import { formatRemainingCoverage } from '../components/WarrantyTable';

export const ExpiringWarrantiesPage: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<number>(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExpiring() {
      try {
        setIsLoading(true);
        const res = await warrantyService.list();
        setWarranties(res.data || []);
      } catch (err) {
        console.error('Failed to load expiring warranties', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExpiring();
  }, []);

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + selectedWindow);

  const filtered = warranties.filter((w) => {
    if (!w.warrantyExpiryDate) return false;
    const exp = new Date(w.warrantyExpiryDate);

    const matchesSearch =
      !searchTerm ||
      w.warrantyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.serialNumber && w.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const isExpired = exp < now;
    const isExpiringWithinWindow = exp >= now && exp <= cutoff;

    if (includeExpired) {
      return matchesSearch && (isExpiringWithinWindow || isExpired);
    }
    return matchesSearch && isExpiringWithinWindow;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Expiring Warranties Roster
          </h1>
          <p className="text-xs text-slate-500">
            Monitor approaching expiry deadlines to initiate AMC maintenance contracts and warranty extensions.
          </p>
        </div>

        {/* Expiry Window Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { days: 30, label: '30 Days' },
            { days: 60, label: '60 Days' },
            { days: 90, label: '90 Days' },
          ].map((w) => (
            <button
              key={w.days}
              type="button"
              onClick={() => setSelectedWindow(w.days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedWindow === w.days
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expiring in {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, warranty ID, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
            className="rounded text-orange-600 focus:ring-orange-500"
          />
          <span>Include Already Expired Records</span>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Warranty ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product & Serial</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Days Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading expiring warranties...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No equipment warranties found expiring in the selected {selectedWindow}-day window.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const info = formatRemainingCoverage(w.warrantyExpiryDate, w.status);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {w.warrantyId}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{w.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{w.customerPhone}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{w.productName}</div>
                        <div className="text-[11px] font-mono text-green-700">
                          SN: {w.serialNumber || 'N/A'}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {w.warrantyExpiryDate}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            info.isExpired
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {info.text}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <WarrantyStatusBadge status={w.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/warranty/${w.id}`}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-green-700 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Dossier
                        </Link>
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
