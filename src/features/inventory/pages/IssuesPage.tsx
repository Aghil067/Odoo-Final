/**
 * IssuesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Stock Issues & Material Dispatch listing.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Search,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { issueService } from '../services/issueService';
import type { StockIssue, IssueStatus } from '../types/stock.types';
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLOURS,
  ISSUE_PURPOSE_LABELS,
} from '../types/stock.types';

export function IssuesPage() {
  const [issues, setIssues] = useState<StockIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<IssueStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await issueService.list({
        search,
        status: status || undefined,
      });
      setIssues(res.data);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Issues & Material Dispatch</h1>
          <p className="text-sm text-slate-500">
            Outward equipment movement for installations, field service kits, and maintenance.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Link to="/inventory/issues/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Stock Issue
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
              placeholder="Search by issue number, recipient, reference order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'issued', label: 'Dispatched & Issued' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Issues Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="py-16 text-center">
            <ArrowUpRight className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No issues found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Issue products from warehouse stock to field technicians or installation orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Issue Ref</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Issued To</th>
                  <th className="px-5 py-3.5">Purpose & Reference</th>
                  <th className="px-5 py-3.5">Source Warehouse</th>
                  <th className="px-5 py-3.5 text-center">Quantity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                      {iss.issueNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{iss.issueDate}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{iss.issuedTo}</div>
                      <span className="text-[11px] text-slate-400">By {iss.issuedBy}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700 block">
                        {ISSUE_PURPOSE_LABELS[iss.purpose]}
                      </span>
                      {iss.referenceId && (
                        <span className="text-xs font-mono text-blue-600">
                          {iss.referenceId}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 text-xs">
                      {iss.sourceWarehouseName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {iss.totalQuantity} units ({iss.totalItems} items)
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={ISSUE_STATUS_LABELS[iss.status]}
                        className={ISSUE_STATUS_COLOURS[iss.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/inventory/issues/${iss.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          View
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
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
