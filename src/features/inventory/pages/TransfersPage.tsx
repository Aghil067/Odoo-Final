/**
 * TransfersPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Inter-warehouse Stock Transfers manager.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft,
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
import { transferService } from '../services/transferService';
import type { StockTransfer, TransferStatus } from '../types/stock.types';
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLOURS,
} from '../types/stock.types';

export function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TransferStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await transferService.list({
        search,
        status: status || undefined,
      });
      setTransfers(res.data);
    } catch (err) {
      console.error('Failed to load transfers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  const handleStatusChange = async (id: string, newStatus: TransferStatus) => {
    try {
      const updated = await transferService.updateStatus(id, newStatus);
      setTransfers((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update transfer status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inter-Warehouse Stock Transfers</h1>
          <p className="text-sm text-slate-500">
            Relocate solar inventory and serial-tracked modules between regional depots.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Link to="/inventory/transfers/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Stock Transfer
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
              placeholder="Search by transfer number, facility name, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransferStatus | '')}
              options={[
                { value: '', label: 'All Transfer Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Transfers Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center">
            <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No stock transfers found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Initiate a stock transfer to rebalance inventory across warehouses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Transfer Ref</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Source Facility</th>
                  <th className="px-5 py-3.5">Destination Facility</th>
                  <th className="px-5 py-3.5">Reason / Scope</th>
                  <th className="px-5 py-3.5 text-center">Quantity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                      {trf.transferNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{trf.transferDate}</td>
                    <td className="px-5 py-4 font-medium text-slate-800 text-xs">
                      {trf.sourceWarehouseName}
                    </td>
                    <td className="px-5 py-4 font-medium text-emerald-800 text-xs">
                      {trf.destinationWarehouseName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {trf.reason}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {trf.totalQuantity} units ({trf.totalItems} items)
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={TRANSFER_STATUS_LABELS[trf.status]}
                        className={TRANSFER_STATUS_COLOURS[trf.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <PermissionGuard module="inventory" require="full">
                        {trf.status === 'in_transit' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(trf.id, 'completed')}
                              className="h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Receive
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(trf.id, 'cancelled')}
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

