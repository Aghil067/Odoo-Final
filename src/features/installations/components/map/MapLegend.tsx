import { useState } from 'react';
import type { StatusCategory, StatusColor } from '../../types/map.types';

interface LegendItem {
  category: StatusCategory;
  color: StatusColor;
  label: string;
  dotClass: string;
  bgClass: string;
  description: string;
}

const legendItems: LegendItem[] = [
  {
    category: 'PLANNED',
    color: 'blue',
    label: 'Planned',
    dotClass: 'bg-blue-500 ring-blue-200',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Planned or site-ready installations'
  },
  {
    category: 'IN_PROGRESS',
    color: 'orange',
    label: 'In Progress',
    dotClass: 'bg-amber-500 ring-amber-200',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Active execution, testing or review'
  },
  {
    category: 'COMMISSIONED',
    color: 'green',
    label: 'Commissioned',
    dotClass: 'bg-emerald-500 ring-emerald-200',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Fully certified and operational solar sites'
  },
  {
    category: 'ON_HOLD_REWORK',
    color: 'red',
    label: 'On Hold / Rework',
    dotClass: 'bg-rose-500 ring-rose-200',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Paused, issues blocking or rework needed'
  }
];

export function MapLegend({
  counts,
  activeFilter,
  onSelectFilter
}: {
  counts?: Record<StatusCategory, number>;
  activeFilter?: StatusCategory | '';
  onSelectFilter?: (cat: StatusCategory | '') => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200/80 p-3 text-xs z-[1000] max-w-xs transition-all">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Status Legend</span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-600 font-medium text-[11px] px-1 py-0.5 rounded"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-1.5">
          {legendItems.map(item => {
            const count = counts ? counts[item.category] : undefined;
            const isSelected = activeFilter === item.category;

            return (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectFilter?.(isSelected ? '' : item.category)}
                className={`w-full flex items-center justify-between p-1.5 rounded transition text-left ${
                  isSelected
                    ? 'bg-slate-100 ring-1 ring-slate-400 font-medium'
                    : 'hover:bg-slate-50'
                }`}
                title={item.description}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ring-2 ${item.dotClass}`} />
                  <span className="text-slate-700">{item.label}</span>
                </div>
                {count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-white font-bold text-[9px]">
              2+
            </span>
            <span>Badge = Multiple installations at site</span>
          </div>
        </div>
      )}
    </div>
  );
}
