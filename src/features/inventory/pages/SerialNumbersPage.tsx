/**
 * SerialNumbersPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Dedicated Serial Number Tracking page for high-value solar hardware
 * (Inverters, Batteries, MPPT Charge Controllers).
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hash,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { serialNumberService } from '../services/serialNumberService';
import { warehouseService } from '../services/warehouseService';
import type {
  SerialNumberRecord,
  SerialNumberStatus,
} from '../types/serialNumber.types';
import type { Warehouse } from '../types/warehouse.types';
import {
  SERIAL_STATUS_LABELS,
  SERIAL_STATUS_COLOURS,
} from '../types/serialNumber.types';
import { PRODUCT_CATEGORY_LABELS } from '../types/product.types';

export function SerialNumbersPage() {
  const [serials, setSerials] = useState<SerialNumberRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SerialNumberStatus | ''>('');
  const [warehouseId, setWarehouseId] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [serialsRes, whRes] = await Promise.all([
        serialNumberService.list({
          search,
          status: status || undefined,
          warehouseId: warehouseId || undefined,
          pageSize: 50,
        }),
        warehouseService.list({ status: 'active' }),
      ]);
      setSerials(serialsRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Failed to load serial numbers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status, warehouseId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Serial Number Tracking</h1>
          <p className="text-sm text-slate-500">
            Lifecycle traceability for inverters, battery storage packs, and smart solar hardware.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/inventory/movements">
            <Button variant="outline" size="sm">
              View Movement Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search serial #, product name, installation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as SerialNumberStatus | '')}
              options={[
                { value: '', label: 'All Lifecycle Statuses' },
                ...Object.entries(SERIAL_STATUS_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'All Warehouse Locations' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Serial Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading serialized hardware...</div>
        ) : serials.length === 0 ? (
          <div className="py-16 text-center">
            <Hash className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No serial records found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Serial numbers are automatically catalogued during incoming goods receipts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Serial Number</th>
                  <th className="px-5 py-3.5">Product & Model</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Current Location / Holder</th>
                  <th className="px-5 py-3.5">Lifecycle Status</th>
                  <th className="px-5 py-3.5">Linked Context</th>
                  <th className="px-5 py-3.5">Warranty</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serials.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to={`/inventory/serial-numbers/${s.id}`}
                        className="font-mono text-xs font-bold text-purple-700 hover:underline block"
                      >
                        {s.serialNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {s.sku}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{s.productName}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {s.manufacturer} {s.modelNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {PRODUCT_CATEGORY_LABELS[s.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {s.currentWarehouseName ? (
                        <div>
                          <div className="font-medium text-slate-800 text-xs">
                            {s.currentWarehouseName}
                          </div>
                          {s.currentLocation && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {s.currentLocation}
                            </div>
                          )}
                        </div>
                      ) : s.linkedInstallationCustomer ? (
                        <div className="text-xs">
                          <span className="text-purple-800 font-medium">Customer Rooftop</span>
                          <span className="block text-slate-500 font-medium">
                            {s.linkedInstallationCustomer}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">In Field Dispatch</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={SERIAL_STATUS_LABELS[s.status]}
                        className={SERIAL_STATUS_COLOURS[s.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">
                      {s.linkedInstallationId ? (
                        <span className="text-blue-700 font-semibold block">
                          {s.linkedInstallationId}
                        </span>
                      ) : s.receiptReference ? (
                        <span className="text-slate-500 block">Rec: {s.receiptReference}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {s.warrantyStatus ? (
                        <span className="text-slate-700 font-medium truncate block max-w-xs">
                          {s.warrantyStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">M07 pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/inventory/serial-numbers/${s.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Details
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
