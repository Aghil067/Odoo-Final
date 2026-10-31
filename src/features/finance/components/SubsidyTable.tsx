/**
 * SubsidyTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Solar Subsidy Tracking Ledger Table in Module M09.
 */

import React, { useState } from 'react';
import { Search, Plus, Upload, FileText, ChevronRight } from 'lucide-react';
import type { SubsidyApplication, SubsidyStatus } from '../types/subsidy.types';
import { SubsidyStatusBadge } from './FinanceStatusBadge';

interface SubsidyTableProps {
  subsidies: SubsidyApplication[];
  onOpenCreate?: () => void;
  onUpdateStatus?: (id: string, status: SubsidyStatus, approvedAmount?: number, remarks?: string) => Promise<void>;
  onUploadDoc?: (subsidyId: string, docId: string, fileName: string) => Promise<void>;
  isLoading?: boolean;
}

export const SubsidyTable: React.FC<SubsidyTableProps> = ({
  subsidies,
  onOpenCreate,
  onUpdateStatus,
  onUploadDoc,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState<SubsidyApplication | null>(null);

  const filtered = subsidies.filter((s) => {
    const matchesSearch =
      s.subsidyReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.installationRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.consumerNumber && s.consumerNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
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
              placeholder="Search ref #, customer, DISCOM account..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Subsidy Stages</option>
            <option value="documents_pending">Documents Pending</option>
            <option value="ready_for_submission">Ready for Submission</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed (DBT)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="w-full sm:w-auto px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Subsidy Application
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Subsidy Ref</th>
              <th className="py-3 px-4">Customer & Project</th>
              <th className="py-3 px-4">Scheme & DISCOM</th>
              <th className="py-3 px-4">Documents</th>
              <th className="py-3 px-4 text-right">Expected (₹)</th>
              <th className="py-3 px-4 text-right">Approved (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  Loading subsidy applications...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No solar subsidy records found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const verifiedDocs = s.submittedDocuments.filter((d) => d.status === 'verified').length;
                const totalDocs = s.submittedDocuments.length;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.subsidyReference}</td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {s.installationRef} ({s.systemCapacity})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{s.subsidyScheme}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.consumerNumber ? `Acc: ${s.consumerNumber}` : s.discomName || 'DISCOM Net-meter'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-slate-700">{verifiedDocs}/{totalDocs}</span>
                        <span className="text-slate-400">Verified</span>
                      </div>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          style={{ width: `${(verifiedDocs / totalDocs) * 100}%` }}
                          className="bg-emerald-500 h-full rounded-full"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{s.expectedSubsidyAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {s.approvedSubsidyAmount > 0 ? `₹${s.approvedSubsidyAmount.toLocaleString('en-IN')}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <SubsidyStatusBadge status={s.status as SubsidyStatus} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSub(s)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded inline-flex items-center gap-1 transition-colors"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Subsidy Dossier Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-green-700 uppercase">
                  {selectedSub.subsidyReference}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Subsidy Application Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedSub.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installation Project:</span>
                <span className="font-semibold text-slate-800">{selectedSub.installationRef} ({selectedSub.systemCapacity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subsidy Scheme:</span>
                <span className="font-semibold text-slate-800">{selectedSub.subsidyScheme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DISCOM Account:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedSub.consumerNumber || 'Pending'}</span>
              </div>
            </div>

            {/* Document Checklist */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                Portal Document Checklist ({selectedSub.submittedDocuments.length})
              </h4>
              <div className="divide-y divide-slate-100">
                {selectedSub.submittedDocuments.map((doc) => (
                  <div key={doc.id} className="py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {doc.fileName ? `File: ${doc.fileName} (${doc.uploadedAt})` : 'Pending customer/liaison upload'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'uploaded'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.status}
                      </span>

                      {doc.status === 'pending' && onUploadDoc && (
                        <button
                          type="button"
                          onClick={() => {
                            const fname = window.prompt(`Enter file name for ${doc.name}:`, `${doc.category}_verified.pdf`);
                            if (fname) onUploadDoc(selectedSub.id, doc.id, fname);
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[10px] flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Upload
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Transition Actions */}
            {onUpdateStatus && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">Update Tracking Status:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSub.status !== 'submitted' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(selectedSub.id, 'submitted')}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold"
                    >
                      Mark Submitted
                    </button>
                  )}
                  {selectedSub.status !== 'under_review' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(selectedSub.id, 'under_review')}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-semibold"
                    >
                      Mark Under Review
                    </button>
                  )}
                  {selectedSub.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(selectedSub.id, 'approved', selectedSub.expectedSubsidyAmount)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold"
                    >
                      Mark Approved (₹{selectedSub.expectedSubsidyAmount.toLocaleString('en-IN')})
                    </button>
                  )}
                  {selectedSub.status !== 'disbursed' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(selectedSub.id, 'disbursed', selectedSub.expectedSubsidyAmount)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                    >
                      Mark DBT Disbursed
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedSub.remarks && (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                <span className="font-semibold">Notes: </span>
                {selectedSub.remarks}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
