/**
 * InventoryAnalyticsView.tsx
 * ─────────────────────────────────────────────────────────────
 * Inventory & Warehouse Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, QrCode, Warehouse } from 'lucide-react';
import type { SystemKPIs, StockCategoryItem } from '../../types/analytics.types';
import { KPICard } from '../KPICard';

interface InventoryAnalyticsViewProps {
  kpis: SystemKPIs;
  stockCategories: StockCategoryItem[];
}

export const InventoryAnalyticsView: React.FC<InventoryAnalyticsViewProps> = ({
  kpis,
  stockCategories,
}) => {
  return (
    <div className="space-y-6">
      {/* Inventory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Catalog SKUs"
          value={kpis.totalInventoryProducts}
          subtitle="Registered solar components"
          icon={Package}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          linkPath="/inventory/products"
        />

        <KPICard
          title="Serialized Units"
          value={kpis.availableSerializedUnits}
          subtitle="Individually barcoded panels & inverters"
          icon={QrCode}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/inventory/dashboard"
          trendText="100% Traceable"
          trendColor="text-blue-700"
        />

        <KPICard
          title="Low-Stock SKUs"
          value={kpis.lowStockProducts}
          subtitle="Items below safety reorder threshold"
          icon={AlertTriangle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          linkPath="/inventory/products"
          trendText={kpis.lowStockProducts > 0 ? 'Reorder needed' : 'Optimal'}
          trendColor={kpis.lowStockProducts > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}
        />

        <KPICard
          title="Active Warehouses"
          value="2"
          subtitle="Central BLR & Rural Peenya Depot"
          icon={Warehouse}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkPath="/inventory/dashboard"
        />
      </div>

      {/* Stock Availability by Component Category */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Availability by Component Category</h3>
            <p className="text-xs text-slate-500">Inventory volume and threshold health across core solar classifications.</p>
          </div>
          <Link to="/inventory/products" className="text-xs text-green-700 hover:underline font-semibold">
            Manage Products &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <th className="py-2.5 px-4">Component Category</th>
                <th className="py-2.5 px-4 text-center">SKU Count</th>
                <th className="py-2.5 px-4 text-center">Total Quantity in Stock</th>
                <th className="py-2.5 px-4 text-center">Low Stock Status</th>
                <th className="py-2.5 px-4 text-right">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockCategories.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{cat.category}</td>
                  <td className="py-3 px-4 text-center font-mono">{cat.itemCount} SKUs</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{cat.totalQuantity} Units</td>
                  <td className="py-3 px-4 text-center font-mono">
                    {cat.lowStockCount > 0 ? (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {cat.lowStockCount} SKU Low
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        All Optimal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden ml-auto">
                      <div
                        style={{ width: `${(cat.healthyCount / cat.itemCount) * 100}%` }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Stock Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Warehouse className="w-4 h-4 text-green-700" />
            <h4 className="font-bold text-slate-900">Central Bengaluru Warehouse</h4>
          </div>
          <p className="text-slate-600">Location: Yeshwanthpur Industrial Suburb, Bengaluru</p>
          <div className="grid grid-cols-2 gap-2 pt-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Solar Modules</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">260 Units</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Inverters & BOS</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">45 Units</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Warehouse className="w-4 h-4 text-blue-700" />
            <h4 className="font-bold text-slate-900">Peenya Solar Logistics Depot</h4>
          </div>
          <p className="text-slate-600">Location: Peenya 2nd Stage, Bengaluru Rural Hub</p>
          <div className="grid grid-cols-2 gap-2 pt-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Mounting Struts</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">32 Sets</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Storage Batteries</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">14 Units</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
