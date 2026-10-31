/**
 * StockOverviewPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Real-time Stock Overview by product, warehouse location, and stock threshold status.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { stockService } from '../services/stockService';
import { warehouseService } from '../services/warehouseService';
import type { StockBalance, StockStatus } from '../types/stock.types';
import type { ProductCategory } from '../types/product.types';
import type { Warehouse } from '../types/warehouse.types';
import { PRODUCT_CATEGORY_LABELS } from '../types/product.types';
import {
  STOCK_STATUS_LABELS,
  STOCK_STATUS_COLOURS,
} from '../types/stock.types';

export function StockOverviewPage() {
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [status, setStatus] = useState<StockStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [stockRes, whRes] = await Promise.all([
        stockService.getStockOverview({
          search,
          warehouseId: warehouseId || undefined,
          category: category || undefined,
          status: status || undefined,
        }),
        warehouseService.list({ status: 'active' }),
      ]);
      setStockBalances(stockRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Failed to load stock overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, warehouseId, category, status]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Balances & Overview</h1>
          <p className="text-sm text-slate-500">
            Current on-hand inventory, reserved project quantities, and warehouse storage locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/inventory/receipts/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Receive Goods
            </Button>
          </Link>
          <Link to="/inventory/issues/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Issue Goods
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by product, SKU, bay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'All Warehouses' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>

          <div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
              options={[
                { value: '', label: 'All Categories' },
                ...Object.entries(PRODUCT_CATEGORY_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StockStatus | '')}
              options={[
                { value: '', label: 'All Stock Statuses' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Balances Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading stock balances...</div>
        ) : stockBalances.length === 0 ? (
          <div className="py-16 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No stock balances found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || warehouseId || category || status
                ? 'Try adjusting your search criteria or filter options.'
                : 'Stock records will appear here as incoming receipts are verified.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">SKU / Code</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Warehouse & Bay</th>
                  <th className="px-5 py-3.5 text-center">Total On-Hand</th>
                  <th className="px-5 py-3.5 text-center">Reserved</th>
                  <th className="px-5 py-3.5 text-center">Available</th>
                  <th className="px-5 py-3.5 text-center">Min Threshold</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockBalances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                      {item.sku}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/inventory/products/${item.productId}`}
                        className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors block"
                      >
                        {item.productName}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {PRODUCT_CATEGORY_LABELS[item.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 text-xs">{item.warehouseName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.location}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-800 font-mono">
                      {item.totalQuantity} {item.uom}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-amber-700 font-mono">
                      {item.reservedQuantity} {item.uom}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-emerald-700 font-mono">
                      {item.availableQuantity} {item.uom}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-slate-500 font-mono">
                      {item.minimumStockLevel}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={STOCK_STATUS_LABELS[item.status]}
                        className={STOCK_STATUS_COLOURS[item.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/inventory/products/${item.productId}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Product
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
