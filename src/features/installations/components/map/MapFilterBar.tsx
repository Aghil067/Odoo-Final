import { useState } from 'react';
import { Search, RotateCcw, Filter, Maximize2 } from 'lucide-react';
import type { MapFilters, StatusCategory, SystemType } from '../../types/map.types';
import { Button } from '../../../../components/ui/Button';

interface MapFilterBarProps {
  filters: MapFilters;
  onChange: (updated: MapFilters) => void;
  onReset: () => void;
  onFitBounds?: () => void;
  totalMapped: number;
}

export function MapFilterBar({
  filters,
  onChange,
  onReset,
  onFitBounds,
  totalMapped,
}: MapFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filters.statusCategory,
    filters.systemType,
    filters.minCapacity,
    filters.maxCapacity,
    filters.q,
  ].filter(v => v !== undefined && v !== '').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search site, customer, or project ID..."
            value={filters.q || ''}
            onChange={e => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filters.statusCategory || ''}
            onChange={e => onChange({ ...filters, statusCategory: (e.target.value as StatusCategory) || '' })}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="COMMISSIONED">🟢 Commissioned</option>
            <option value="IN_PROGRESS">🟠 In Progress</option>
            <option value="PLANNED">🔵 Planned</option>
            <option value="ON_HOLD_REWORK">🔴 On Hold / Rework</option>
          </select>

          {/* Grid Type Dropdown */}
          <select
            value={filters.systemType || ''}
            onChange={e => onChange({ ...filters, systemType: (e.target.value as SystemType) || '' })}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Grid Types</option>
            <option value="ON_GRID">On-Grid</option>
            <option value="OFF_GRID">Off-Grid</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Capacity</span>
            {Boolean(filters.minCapacity || filters.maxCapacity) && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </Button>

          {onFitBounds && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFitBounds}
              disabled={totalMapped === 0}
              className="flex items-center gap-1 text-xs text-slate-600"
              title="Fit map to all visible installations"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fit Bounds</span>
            </Button>
          )}

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters (Capacity range) */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-600">Solar Capacity (kW):</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min kW"
              min="0"
              step="0.5"
              value={filters.minCapacity ?? ''}
              onChange={e => onChange({
                ...filters,
                minCapacity: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))
              })}
              className="w-24 text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="number"
              placeholder="Max kW"
              min="0"
              step="0.5"
              value={filters.maxCapacity ?? ''}
              onChange={e => onChange({
                ...filters,
                maxCapacity: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))
              })}
              className="w-24 text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {(filters.minCapacity !== '' || filters.maxCapacity !== '') && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, minCapacity: '', maxCapacity: '' })}
              className="text-[11px] text-amber-600 hover:underline"
            >
              Clear Capacity
            </button>
          )}
        </div>
      )}
    </div>
  );
}
