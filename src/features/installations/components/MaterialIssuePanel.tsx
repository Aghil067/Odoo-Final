/**
 * MaterialIssuePanel.tsx
 * ─────────────────────────────────────────────────────────────
 * Displays material issue information linked to M04 Stock Issues
 * and allocated equipment serial numbers.
 */

import { Link } from 'react-router-dom';
import { Truck, ExternalLink, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MaterialIssueReference } from '../types/installation.types';

interface MaterialIssuePanelProps {
  issueReferences: MaterialIssueReference[];
  installationId: string;
}

export function MaterialIssuePanel({ issueReferences }: MaterialIssuePanelProps) {
  if (issueReferences.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              M04 Material Issue & Dispatches
            </h3>
            <p className="text-xs text-slate-500">
              Official warehouse dispatch documents and tracked equipment serial numbers
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500 space-y-1">
          <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="font-medium text-slate-700">No Material Issues Dispatched Yet</p>
          <p>
            When the warehouse issues materials for this installation order, issue notes and equipment serial numbers will be displayed here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              M04 Material Issue & Serial Number Tracking
            </h3>
            <p className="text-xs text-slate-500">
              Confirmed warehouse dispatches linked to this installation
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {issueReferences.length} Dispatch{issueReferences.length > 1 ? 'es' : ''} Confirmed
        </span>
      </div>

      {/* Dispatches List */}
      <div className="space-y-4">
        {issueReferences.map((ref) => (
          <div
            key={ref.issueId}
            className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {ref.issueNumber}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {ref.warehouseName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Dispatched: <strong>{ref.issueDate}</strong></span>
                <span>Recipient: <strong>{ref.issuedTo}</strong></span>
                <Link
                  to={`/inventory/issues/${ref.issueId}`}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline ml-2"
                >
                  <span>View M04 Issue Note</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Issued Items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-md border border-slate-200">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3 text-center">Qty Issued</th>
                    <th className="py-2 px-3">Serial Numbers / Lot Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ref.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.serialNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.serialNumbers.map((sn) => (
                              <span
                                key={sn}
                                className="inline-flex items-center gap-1 text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
                              >
                                <Hash className="w-3 h-3 text-blue-500" />
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Non-serialized / Bulk item
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ref.notes && (
              <p className="text-xs text-slate-500 italic">
                Note: {ref.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

