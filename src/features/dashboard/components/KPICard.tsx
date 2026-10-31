/**
 * KPICard.tsx
 * ─────────────────────────────────────────────────────────────
 * Interactive KPI Metric Card for M10: Dashboard & Analytics.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
  linkPath?: string;
  trendText?: string;
  trendColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-slate-100',
  iconColor = 'text-slate-600',
  linkPath,
  trendText,
  trendColor = 'text-slate-500',
}) => {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 hover:shadow-md transition-all group relative">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 group-hover:text-green-700 transition-colors">
            {value}
          </div>
        </div>

        <div className={`p-2 rounded-lg ${iconBgColor} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
        {subtitle && <span className="text-slate-500 truncate max-w-[170px]">{subtitle}</span>}
        {trendText && <span className={`font-semibold ${trendColor}`}>{trendText}</span>}

        {linkPath && (
          <span className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (linkPath) {
    return <Link to={linkPath}>{content}</Link>;
  }

  return content;
};

