/**
 * ReceiptsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Stock Receipts listing and intake manager.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
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
import { receiptService } from '../services/receiptService';
import type { StockReceipt, ReceiptStatus } from '../types/stock.types';
import {
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_COLOURS,
} from '../types/stock.types';

export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReceiptStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await receiptService.list({
        search,
        status: status || undefined,
      });
      setReceipts(res.data);
    } catch (err) {
      console.error('Failed to load receipts', err);
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
          <h1 className="text-2xl font-bold text-slate-800">Stock Receipts (GRN)</h1>
          <p className="text-sm text-slate-500">
            Incoming vendor shipments, supplier deliveries, and equipment intake verification.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Link to="/inventory/receipts/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Stock Receipt
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
              placeholder="Search by receipt number, supplier name, invoice ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReceiptStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'received', label: 'Received & Stored' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Receipts Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center">
            <ArrowDownLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No receipts found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create an incoming stock receipt to book hardware into the warehouse.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Receipt Ref</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Supplier & Invoice</th>
                  <th className="px-5 py-3.5">Destination Warehouse</th>
                  <th className="px-5 py-3.5 text-center">Total Quantity</th>
                  <th className="px-5 py-3.5 text-right">Valuation (₹)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                      {rec.receiptNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{rec.receiptDate}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{rec.supplierName}</div>
                      {rec.supplierReference && (
                        <div className="text-xs font-mono text-slate-400">
                          Ref: {rec.supplierReference}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 text-xs">
                      {rec.destinationWarehouseName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {rec.totalQuantity} units ({rec.totalItems} items)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-slate-800">
                      {rec.totalCost ? `₹${rec.totalCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={RECEIPT_STATUS_LABELS[rec.status]}
                        className={RECEIPT_STATUS_COLOURS[rec.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/inventory/receipts/${rec.id}`}>
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
