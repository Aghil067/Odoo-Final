/**
 * ProfitabilityTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Installation Profitability Analysis Ledger in Module M09.
 * Explicitly differentiates recorded actual expenses from provisional BOM estimates.
 */

import React, { useState } from 'react';
import { Search, TrendingUp, AlertTriangle, CheckCircle, FileText, Info } from 'lucide-react';
import type { InstallationProfitability } from '../types/profitability.types';
import { CostTypeBadge } from './FinanceStatusBadge';

interface ProfitabilityTableProps {
  profitabilityRecords: InstallationProfitability[];
  isLoading?: boolean;
}

export const ProfitabilityTable: React.FC<ProfitabilityTableProps> = ({
  profitabilityRecords,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actualsOnly, setActualsOnly] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InstallationProfitability | null>(null);

  const filtered = profitabilityRecords.filter((p) => {
    const matchesSearch =
      p.installationRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.systemCapacity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActuals = !actualsOnly || p.hasAllActuals;
    return matchesSearch && matchesActuals;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Informational Callout */}
      <div className="p-3 bg-amber-50/70 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Accounting Policy Notice:</span> Cost records marked as{' '}
          <span className="font-semibold text-emerald-800">Actual Recorded</span> represent verified supplier procurement invoices and disbursements. Values tagged with{' '}
          <span className="font-semibold text-amber-800">Estimated BOM</span> represent provisional quotations from M03 Solar Configuration and have not yet been posted to financial ledgers.
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search installation, customer, capacity..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={actualsOnly}
              onChange={(e) => setActualsOnly(e.target.checked)}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span>Show 100% Reconciled Actuals Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Installation & Customer</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4 text-right">Invoiced (₹)</th>
              <th className="py-3 px-4 text-right">Collected (₹)</th>
              <th className="py-3 px-4 text-right">Material Cost (₹)</th>
              <th className="py-3 px-4 text-right">Labour & Logistics (₹)</th>
              <th className="py-3 px-4 text-right">Total Cost (₹)</th>
              <th className="py-3 px-4 text-right">Profit (₹)</th>
              <th className="py-3 px-4 text-right">Margin (%)</th>
              <th className="py-3 px-4 text-center">Cost Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  Loading profitability models...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No installation records match the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isHighMargin = p.profitMarginPercent >= 25;
                return (
                  <tr
                    key={p.installationId}
                    onClick={() => setSelectedRecord(p)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{p.installationRef}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{p.customerName}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">{p.systemCapacity}</td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.invoiceRevenue.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      ₹{p.amountCollected.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div>₹{p.materialCost.toLocaleString('en-IN')}</div>
                      <div className="text-[9px]">
                        <CostTypeBadge isEstimated={p.isMaterialCostEstimated} />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div>₹{(p.labourCost + p.transportationCost).toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400">
                        (Lab: ₹{(p.labourCost / 1000).toFixed(0)}k | Tr: ₹{(p.transportationCost / 1000).toFixed(0)}k)
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      ₹{p.totalRecordedCost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{p.recordedProfit.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isHighMargin ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        {p.profitMarginPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {p.hasAllActuals ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Provisional
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-green-700 uppercase">
                  {selectedRecord.installationRef}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Installation Profitability Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedRecord.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">System Capacity:</span>
                <span className="font-semibold text-slate-800">{selectedRecord.systemCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project Status:</span>
                <span className="font-semibold capitalize text-slate-800">
                  {selectedRecord.installationStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">Cost & Revenue Breakdown</h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Invoice Revenue:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedRecord.invoiceRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Realized Collections:</span>
                  <span className="font-mono font-semibold">₹{selectedRecord.amountCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Outstanding Receivables:</span>
                  <span className="font-mono font-semibold">₹{selectedRecord.outstandingAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t border-slate-100 pt-1.5 flex justify-between">
                  <span>
                    Material & BOS Cost:
                    <span className="ml-1.5">
                      <CostTypeBadge isEstimated={selectedRecord.isMaterialCostEstimated} />
                    </span>
                  </span>
                  <span className="font-mono font-semibold">₹{selectedRecord.materialCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Labour Cost:
                    <span className="ml-1.5">
                      <CostTypeBadge isEstimated={selectedRecord.isLabourCostEstimated} />
                    </span>
                  </span>
                  <span className="font-mono font-semibold">₹{selectedRecord.labourCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Transportation Cost:
                    <span className="ml-1.5">
                      <CostTypeBadge isEstimated={selectedRecord.isTransportationCostEstimated} />
                    </span>
                  </span>
                  <span className="font-mono font-semibold">₹{selectedRecord.transportationCost.toLocaleString('en-IN')}</span>
                </div>

                {selectedRecord.otherRecordedCosts > 0 && (
                  <div className="flex justify-between">
                    <span>Other Direct Costs (Liaison, Testing):</span>
                    <span className="font-mono font-semibold">₹{selectedRecord.otherRecordedCosts.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Project Cost:</span>
                  <span className="font-mono">₹{selectedRecord.totalRecordedCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-slate-300 pt-2">
                  <span>Gross Recorded Profit:</span>
                  <span className="font-mono">₹{selectedRecord.recordedProfit.toLocaleString('en-IN')} ({selectedRecord.profitMarginPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {selectedRecord.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <span className="font-semibold text-slate-800">Financial Audit Note: </span>
                {selectedRecord.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
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

