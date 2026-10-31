/**
 * InventoryDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Overview dashboard for M04: Inventory & Warehouse Management.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Warehouse,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Hash,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { stockService } from '../services/stockService';
import { receiptService } from '../services/receiptService';
import { issueService } from '../services/issueService';
import type { StockReceipt, StockIssue, StockBalance } from '../types/stock.types';
import {
  PRODUCT_CATEGORY_LABELS,
} from '../types/product.types';
import {
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_COLOURS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLOURS,
} from '../types/stock.types';

export function InventoryDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    serialTrackedItemsCount: 0,
    availableSerialsCount: 0,
    categoryCounts: {} as Record<string, number>,
    warehouseCounts: {} as Record<string, { name: string; quantity: number }>,
    lowStockAlerts: [] as StockBalance[],
  });

  const [recentReceipts, setRecentReceipts] = useState<StockReceipt[]>([]);
  const [recentIssues, setRecentIssues] = useState<StockIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [dashboardStats, receiptsRes, issuesRes] = await Promise.all([
          stockService.getDashboardStats(),
          receiptService.list(),
          issueService.list(),
        ]);

        setStats(dashboardStats);
        setRecentReceipts(receiptsRes.data.slice(0, 5));
        setRecentIssues(issuesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load inventory dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Quick Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Warehouse</h1>
          <p className="text-sm text-slate-500">
            Real-time stock control, equipment serialization, incoming receipts, and installation issues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/inventory/serial-numbers">
            <Button variant="outline" size="sm">
              <Hash className="w-4 h-4 mr-1.5 text-purple-600" />
              Serial Numbers
            </Button>
          </Link>
          <Link to="/inventory/stock">
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              Stock Overview
            </Button>
          </Link>

          <PermissionGuard module="inventory" require="full">
            <Link to="/inventory/receipts/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                New Receipt
              </Button>
            </Link>
            <Link to="/inventory/issues/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                Issue Stock
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Products
            </p>
            <p className="text-xl font-bold text-slate-800">
              {isLoading ? '...' : stats.totalProducts}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Stock Units
            </p>
            <p className="text-xl font-bold text-emerald-700">
              {isLoading ? '...' : stats.totalStockQuantity.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </p>
            <p className="text-xl font-bold text-amber-700">
              {isLoading ? '...' : stats.lowStockCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Out of Stock
            </p>
            <p className="text-xl font-bold text-red-600">
              {isLoading ? '...' : stats.outOfStockCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Warehouses
            </p>
            <p className="text-xl font-bold text-slate-800">
              {isLoading ? '...' : stats.totalWarehouses}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Serial Tracked
            </p>
            <p className="text-xl font-bold text-purple-800">
              {isLoading ? '...' : `${stats.availableSerialsCount} / ${stats.serialTrackedItemsCount}`}
            </p>
          </div>
        </Card>
      </div>

      {/* Low Stock Attention Banner */}
      {stats.lowStockAlerts.length > 0 && (
        <Card className="p-4 bg-amber-50/70 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">
                Low Stock Threshold Alerts ({stats.lowStockAlerts.length} items requiring replenishment)
              </h2>
            </div>
            <Link to="/inventory/stock" className="text-xs font-semibold text-amber-800 hover:underline">
              View All Balances →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.lowStockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1 shadow-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-400">{alert.sku}</span>
                  <Badge
                    label={alert.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                    className={
                      alert.status === 'out_of_stock'
                        ? 'bg-red-100 text-red-800 font-semibold'
                        : 'bg-amber-100 text-amber-800 font-semibold'
                    }
                  />
                </div>
                <p className="font-semibold text-slate-800 truncate">{alert.productName}</p>
                <p className="text-slate-500 text-[11px]">{alert.warehouseName}</p>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                  <span>On Hand: <strong className="text-red-700">{alert.availableQuantity} {alert.uom}</strong></span>
                  <span className="text-slate-400">Min: {alert.minimumStockLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Grid: Receipts vs Issues & Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Recent Receipts & Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Receipts */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800">Recent Stock Receipts</h2>
              </div>
              <Link to="/inventory/receipts">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-700">
                  View All Receipts
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading receipts...</div>
            ) : recentReceipts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No receipts logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReceipts.map((rec) => (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 px-2 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{rec.receiptNumber}</span>
                        <Badge
                          label={RECEIPT_STATUS_LABELS[rec.status]}
                          className={RECEIPT_STATUS_COLOURS[rec.status]}
                        />
                        <span className="text-slate-400">· {rec.receiptDate}</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-0.5">{rec.supplierName}</p>
                      <p className="text-[11px] text-slate-400">
                        {rec.destinationWarehouseName} · {rec.totalItems} line items ({rec.totalQuantity} units)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <Link to={`/inventory/receipts/${rec.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Issues */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800">Recent Dispatches / Issues</h2>
              </div>
              <Link to="/inventory/issues">
                <Button variant="ghost" size="sm" className="text-xs text-blue-700">
                  View All Issues
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading issues...</div>
            ) : recentIssues.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No issues logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 px-2 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{iss.issueNumber}</span>
                        <Badge
                          label={ISSUE_STATUS_LABELS[iss.status]}
                          className={ISSUE_STATUS_COLOURS[iss.status]}
                        />
                        <span className="text-slate-400">· {iss.issueDate}</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-0.5">
                        Issued To: <strong className="text-slate-900">{iss.issuedTo}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {iss.sourceWarehouseName} · {iss.totalItems} line items ({iss.totalQuantity} units)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <Link to={`/inventory/issues/${iss.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1/3): Stock by Warehouse & Categories */}
        <div className="space-y-6">
          {/* Warehouse Breakdown */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <CardHeader
              title="Stock by Warehouse"
              subtitle="Current physical allocation across depots"
              action={
                <Link to="/inventory/warehouses">
                  <Button variant="ghost" size="sm" className="text-xs text-emerald-700 p-0 h-auto">
                    Manage
                  </Button>
                </Link>
              }
            />

            <div className="space-y-3">
              {Object.entries(stats.warehouseCounts).map(([whId, whData]) => (
                <div key={whId} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{whData.name}</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {whData.quantity.toLocaleString()} units
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (whData.quantity / (stats.totalStockQuantity || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
            <CardHeader
              title="Category Distribution"
              subtitle="Major rooftop hardware stock"
            />

            <div className="space-y-2 text-xs">
              {Object.entries(stats.categoryCounts).map(([catKey, qty]) => (
                <div key={catKey} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none">
                  <span className="text-slate-600">
                    {PRODUCT_CATEGORY_LABELS[catKey as keyof typeof PRODUCT_CATEGORY_LABELS] || catKey}
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {qty.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit History Shortcut */}
          <Card className="p-4 bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <History className="w-4 h-4 text-slate-500" />
              <span>Full Stock Movement Ledger</span>
            </div>
            <Link to="/inventory/movements">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Open Ledger
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
