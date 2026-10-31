/**
 * IssueDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Detailed view of an outward stock dispatch with serial allocations.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  Calendar,
  User,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { issueService } from '../services/issueService';
import type { StockIssue, IssueStatus } from '../types/stock.types';
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLOURS,
  ISSUE_PURPOSE_LABELS,
} from '../types/stock.types';

export function IssueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<StockIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await issueService.getById(id);
        setIssue(res);
      } catch (err) {
        console.error('Failed to load issue details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    try {
      setStatusUpdating(true);
      const updated = await issueService.updateStatus(issue.id, newStatus);
      setIssue(updated);
    } catch (err) {
      console.error('Failed to update issue status', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading issue record...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Issue Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested material dispatch order does not exist.
        </p>
        <Link to="/inventory/issues" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Issues
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/inventory/issues">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {issue.issueNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">Material Dispatch Note</h1>
              <Badge
                label={ISSUE_STATUS_LABELS[issue.status]}
                className={ISSUE_STATUS_COLOURS[issue.status]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {issue.issueDate} · Authorized by: {issue.issuedBy}
            </p>
          </div>
        </div>

        <PermissionGuard module="inventory" require="full">
          <div className="flex items-center gap-2">
            {issue.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('issued')}
                disabled={statusUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm Dispatch
              </Button>
            )}
            {issue.status !== 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
                disabled={statusUpdating}
                className="text-red-600 hover:bg-red-50"
              >
                Cancel Issue
              </Button>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Recipient & Assignment" subtitle="Site technician or department" />
          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>
                Issued To: <strong>{issue.issuedTo}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span>Purpose: {ISSUE_PURPOSE_LABELS[issue.purpose]}</span>
            </div>
            {issue.referenceId && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Order / Ticket Ref:</span>
                <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {issue.referenceId}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Dispatch Warehouse" subtitle="Source facility providing hardware" />
          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-400" />
              <span>
                Facility: <strong>{issue.sourceWarehouseName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Date: {issue.issueDate}</span>
            </div>
            {issue.notes && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">
                Gate Pass / Notes: {issue.notes}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <CardHeader
            title="Dispatched Line Items"
            subtitle={`${issue.totalItems} items (${issue.totalQuantity} total units)`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-12 text-center">#</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-center">Quantity Dispatched</th>
                <th className="px-5 py-3">Assigned Serial Numbers</th>
                <th className="px-5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issue.lines.map((line, index) => (
                <tr key={line.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/inventory/products/${line.productId}`}
                      className="font-semibold text-slate-800 hover:text-blue-700"
                    >
                      {line.productName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                    {line.sku}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                    {line.quantityToIssue} {line.unit}
                  </td>
                  <td className="px-5 py-3.5">
                    {line.selectedSerialNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {line.selectedSerialNumbers.map((sn) => (
                          <Link
                            key={sn}
                            to={`/inventory/serial-numbers?search=${sn}`}
                            className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 hover:bg-purple-100"
                          >
                            {sn}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No serial tracking</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {line.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
