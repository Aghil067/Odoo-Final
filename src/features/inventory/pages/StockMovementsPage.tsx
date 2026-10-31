/**
 * StockMovementsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Immutable Stock Movement Ledger and audit trail.
 */

import { useEffect, useState } from 'react';
import {
  History,
  Search,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { stockService } from '../services/stockService';
import type { StockMovement, MovementType } from '../types/stock.types';
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLOURS,
} from '../types/stock.types';

export function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<MovementType | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await stockService.getMovements({
        search,
        movementType: movementType || undefined,
      });
      setMovements(res.data);
    } catch (err) {
      console.error('Failed to load movements', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, movementType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Movement Ledger</h1>
          <p className="text-sm text-slate-500">
            Read-only chronological audit log of all inventory receipts, issues, transfers, and adjustments.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by SKU, product name, ref number, operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType | '')}
              options={[
                { value: '', label: 'All Movement Types' },
                ...Object.entries(MOVEMENT_TYPE_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Movement Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading movement ledger...</div>
        ) : movements.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No movement records found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Any goods receipts, material dispatches, or adjustments will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Log ID / Ref</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Product Name & SKU</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 text-center">Quantity</th>
                  <th className="px-5 py-3.5">From Location</th>
                  <th className="px-5 py-3.5">To Location</th>
                  <th className="px-5 py-3.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        {mov.referenceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{mov.movementId}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(mov.date).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{mov.productName}</div>
                      <span className="text-xs font-mono text-slate-400">{mov.sku}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={MOVEMENT_TYPE_LABELS[mov.movementType]}
                        className={MOVEMENT_TYPE_COLOURS[mov.movementType]}
                      />
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-xs">
                      <span
                        className={
                          mov.quantity > 0
                            ? 'text-emerald-700'
                            : mov.quantity < 0
                            ? 'text-blue-700'
                            : 'text-slate-600'
                        }
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.uom}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {mov.sourceLocation || '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {mov.destinationLocation || '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                      {mov.performedBy}
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
