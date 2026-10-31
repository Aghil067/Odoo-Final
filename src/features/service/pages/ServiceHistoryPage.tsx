/**
 * ServiceHistoryPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Equipment Failure & Historical Service Records in Module M08.
 * Facilitates identifying repeated component failures and warranty liabilities.
 */

import React, { useState, useEffect } from 'react';
import { History, Search, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceTicket } from '../types/serviceTicket.types';
import { serviceTicketService } from '../services/serviceTicketService';
import { TicketStatusBadge, WarrantyIndicatorBadge } from '../components/ServiceStatusBadge';
import { SERVICE_ISSUE_CATEGORY_LABELS } from '../types/serviceTicket.types';

export const ServiceHistoryPage: React.FC = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const res = await serviceTicketService.list();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || t.issueCategory === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-green-600" />
            Equipment Service History Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Historical equipment malfunction ledger to identify recurrent failure patterns across product models and customer sites.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          title="Refresh history"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search service history by customer, serial number, equipment model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Installation Ref</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Reported Date</th>
                <th className="px-4 py-3">Warranty State</th>
                <th className="px-4 py-3">Ticket Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Loading history logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No historical service records match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {t.ticketId}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.customerPhone}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{t.productName}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-green-700">
                      {t.serialNumber || 'N/A'}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {t.installationRef || 'Over-the-counter'}
                    </td>

                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-800">
                        {SERVICE_ISSUE_CATEGORY_LABELS[t.issueCategory] || t.issueCategory}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {t.reportedDate}
                    </td>

                    <td className="px-4 py-3">
                      <WarrantyIndicatorBadge indicator={t.warrantyIndicator} />
                    </td>

                    <td className="px-4 py-3">
                      <TicketStatusBadge status={t.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/service/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-green-700 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Dossier
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
