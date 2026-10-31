/**
 * MaterialReadinessPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * Cross-references M03 BOM components with M04 inventory availability.
 * Displays component quantities, readiness badges, and links to inventory records.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  RefreshCw,
  Info,
} from 'lucide-react';
import type {
  InstallationMaterial,
  MaterialReadinessStatus,
} from '../types/installation.types';
import {
  MATERIAL_READINESS_LABELS,
  MATERIAL_READINESS_COLORS,
} from '../types/installation.types';
import { Button } from '../../../components/ui/Button';

interface MaterialReadinessPanelProps {
  materials: InstallationMaterial[];
  overallStatus: MaterialReadinessStatus;
  installationId: string;
  onRefreshReadiness?: () => Promise<void>;
  canCoordinate?: boolean; // Inventory Manager or Installation Manager
}

export function MaterialReadinessPanel({
  materials,
  overallStatus,
  onRefreshReadiness,
  canCoordinate = true,
}: MaterialReadinessPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshReadiness) return;
    try {
      setIsRefreshing(true);
      await onRefreshReadiness();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: MaterialReadinessStatus) => {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
          MATERIAL_READINESS_COLORS[status] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {MATERIAL_READINESS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Bill of Materials & Material Readiness
            </h3>
            <p className="text-xs text-slate-500">
              Cross-referenced with M04 Inventory and Warehouse stock balances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(overallStatus)}
          {onRefreshReadiness && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Check Availability
            </Button>
          )}
        </div>
      </div>

      {/* Backend Notice Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">M04 Inventory Live Coordination:</span> Stock availability is derived from warehouse records in Central Bengaluru and Regional Depots. Official stock deductions and dispatch notes are managed via M04 Material Issue transactions.
        </div>
      </div>

      {/* Materials Table */}
      {materials.length === 0 ? (
        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No BOM materials linked yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Materials will appear once an approved M03 Solar Configuration is selected.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Item / Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Required</th>
                <th className="py-2.5 px-3 text-center">M04 Stock Available</th>
                <th className="py-2.5 px-3 text-center">Issued</th>
                <th className="py-2.5 px-3 text-center">Readiness Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat) => {
                const isShort =
                  mat.availableQuantity !== undefined &&
                  mat.availableQuantity < mat.requiredQuantity &&
                  mat.materialStatus !== 'issued';

                return (
                  <tr key={mat.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {mat.productName}
                      </div>
                      {mat.modelNumber && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          {mat.modelNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 capitalize">
                      {mat.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {mat.requiredQuantity} {mat.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold ${
                          isShort ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {mat.availableQuantity !== undefined
                          ? `${mat.availableQuantity} ${mat.unit}`
                          : 'Pending Check'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-emerald-700">
                      {mat.issuedQuantity !== undefined
                        ? `${mat.issuedQuantity} ${mat.unit}`
                        : '0'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(mat.materialStatus)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {mat.inventoryProductId ? (
                        <Link
                          to={`/inventory/products/${mat.inventoryProductId}`}
                          className="inline-flex items-center gap-1 text-[11px] text-green-700 hover:text-green-800 font-medium hover:underline"
                        >
                          <span>Inventory</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          to="/inventory/stock"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
                        >
                          <span>Stock Ledger</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inventory Action Footnote */}
      {canCoordinate && materials.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {overallStatus === 'available' || overallStatus === 'issued' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {overallStatus === 'issued'
                ? 'All materials have been dispatched and confirmed on site.'
                : overallStatus === 'available'
                ? 'Warehouse has adequate inventory to fulfill this work order.'
                : 'Material allocation or warehouse transfer recommended prior to scheduling.'}
            </span>
          </div>
          <Link
            to="/inventory/issues/new"
            className="text-xs font-semibold text-green-700 hover:text-green-800 hover:underline flex items-center gap-1"
          >
            <span>Create M04 Stock Issue Note</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

