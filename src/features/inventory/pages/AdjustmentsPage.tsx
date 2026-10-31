/**
 * AdjustmentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Stock Adjustments & Physical Count Reconciliation manager.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  PlusCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { adjustmentService } from '../services/adjustmentService';
import type { StockAdjustment, AdjustmentStatus } from '../types/stock.types';
import {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_STATUS_COLOURS,
  ADJUSTMENT_REASON_LABELS,
} from '../types/stock.types';

export function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdjustmentStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await adjustmentService.list({
        search,
        status: status || undefined,
      });
      setAdjustments(res.data);
    } catch (err) {
      console.error('Failed to load adjustments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  const handleStatusChange = async (id: string, newStatus: AdjustmentStatus) => {
    try {
      const updated = await adjustmentService.updateStatus(id, newStatus);
      setAdjustments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('Failed to update adjustment status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Adjustments & Write-Offs</h1>
          <p className="text-sm text-slate-500">
            Reconcile physical inventory counts against system records and document transit damages.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Link to="/inventory/adjustments/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Stock Adjustment
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by adjustment reference, warehouse, explanation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdjustmentStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted (Pending Approval)' },
                { value: 'approved', label: 'Approved & Reconciled' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Adjustments Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading adjustments...</div>
        ) : adjustments.length === 0 ? (
          <div className="py-16 text-center">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No stock adjustments logged</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a stock adjustment when verified physical stock deviates from recorded quantities.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Adjustment Ref</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Warehouse</th>
                  <th className="px-5 py-3.5">Reason & Explanation</th>
                  <th className="px-5 py-3.5 text-center">Net Variance</th>
                  <th className="px-5 py-3.5">Adjusted By</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                      {adj.adjustmentNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{adj.adjustmentDate}</td>
                    <td className="px-5 py-4 font-medium text-slate-800 text-xs">
                      {adj.warehouseName}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {ADJUSTMENT_REASON_LABELS[adj.reason]}
                      </span>
                      <span className="text-slate-500 line-clamp-1">{adj.explanation}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded ${
                          adj.totalDifference > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : adj.totalDifference < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {adj.totalDifference > 0 ? `+${adj.totalDifference}` : adj.totalDifference}{' '}
                        units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>{adj.adjustedBy}</div>
                      {adj.approvedBy && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Approved by {adj.approvedBy}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={ADJUSTMENT_STATUS_LABELS[adj.status]}
                        className={ADJUSTMENT_STATUS_COLOURS[adj.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <PermissionGuard module="inventory" require="full">
                        {adj.status === 'submitted' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(adj.id, 'approved')}
                              className="h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(adj.id, 'rejected')}
                              className="h-8 text-xs text-red-500"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

