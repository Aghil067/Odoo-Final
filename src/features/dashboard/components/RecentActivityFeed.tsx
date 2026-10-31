/**
 * RecentActivityFeed.tsx
 * ─────────────────────────────────────────────────────────────
 * Unified cross-module activity stream in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  User,
  MapPin,
  Wrench,
  Package,
  Shield,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import type { ActivityEvent } from '../types/analytics.types';

export const RecentActivityFeed: React.FC<{ activities: ActivityEvent[] }> = ({ activities }) => {
  const getIcon = (type: ActivityEvent['iconType']) => {
    switch (type) {
      case 'user':
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'survey':
        return <MapPin className="w-3.5 h-3.5 text-emerald-600" />;
      case 'tool':
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case 'package':
        return <Package className="w-3.5 h-3.5 text-purple-600" />;
      case 'shield':
        return <Shield className="w-3.5 h-3.5 text-cyan-600" />;
      case 'dollar':
        return <CreditCard className="w-3.5 h-3.5 text-green-600" />;
      case 'wrench':
        return <Wrench className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Live System Activity Audit
          </h3>
          <p className="text-xs text-slate-500">Chronological feed across CRM, surveys, inventory, field work & finance.</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 text-xs">
        {activities.map((act) => (
          <div key={act.id} className="py-3 flex items-start justify-between gap-3 group">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 mt-0.5 shrink-0">
                {getIcon(act.iconType)}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{act.title}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {act.module}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{act.description}</p>
                <p className="text-[10px] text-slate-400">By {act.user}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-right">
              <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
              {act.linkPath && (
                <Link
                  to={act.linkPath}
                  className="p-1 text-slate-400 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View Record"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

