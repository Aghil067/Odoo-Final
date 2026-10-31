/**
 * TechnicianPaymentTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Technician Payments & Payouts Ledger Table in Module M09.
 */

import React, { useState } from 'react';
import { Search, HardHat, FileText, ChevronRight } from 'lucide-react';
import type { TechnicianPaymentRecord, TechnicianPaymentStatus } from '../types/technicianPayment.types';
import { TECHNICIAN_PAYMENT_TYPE_LABELS } from '../types/technicianPayment.types';
import { TechPaymentStatusBadge } from './FinanceStatusBadge';
import { TechnicianPaymentModal } from './TechnicianPaymentModal';

interface TechnicianPaymentTableProps {
  payments: TechnicianPaymentRecord[];
  onApprove: (id: string, approvedAmount?: number) => Promise<void>;
  onDisburse: (id: string, amount: number, method: string, reference: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const TechnicianPaymentTable: React.FC<TechnicianPaymentTableProps> = ({
  payments,
  onApprove,
  onDisburse,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<TechnicianPaymentRecord | null>(null);

  const filtered = payments.filter((tp) => {
    const matchesSearch =
      tp.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tp.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tp.installationRef && tp.installationRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tp.serviceTaskRef && tp.serviceTaskRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ref #, technician, project/task..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Claim Ref</th>
              <th className="py-3 px-4">Technician</th>
              <th className="py-3 px-4">Project / Task</th>
              <th className="py-3 px-4">Payment Structure</th>
              <th className="py-3 px-4 text-right">Agreed (₹)</th>
              <th className="py-3 px-4 text-right">Paid (₹)</th>
              <th className="py-3 px-4 text-right">Pending (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  Loading technician payments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No technician payment records found matching the filters.
                </td>
              </tr>
            ) : (
              filtered.map((tp) => (
                <tr key={tp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tp.paymentReference}</td>

                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{tp.technicianName}</span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    {tp.installationRef ? (
                      <span className="text-blue-700">{tp.installationRef}</span>
                    ) : (
                      <span className="text-purple-700">{tp.serviceTaskRef}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {TECHNICIAN_PAYMENT_TYPE_LABELS[tp.paymentType] || tp.paymentType}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    ₹{tp.agreedAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    ₹{tp.paidAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    ₹{tp.pendingAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <TechPaymentStatusBadge status={tp.status as TechnicianPaymentStatus} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(tp)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded inline-flex items-center gap-1 transition-colors"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <TechnicianPaymentModal
          paymentRecord={selectedRecord}
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          onApprove={onApprove}
          onDisburse={onDisburse}
        />
      )}
    </div>
  );
};

