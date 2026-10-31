/**
 * BusinessAlertsList.tsx
 * ─────────────────────────────────────────────────────────────
 * Actionable System Alerts & Warnings widget in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import type { SystemAlert } from '../types/analytics.types';

export const BusinessAlertsList: React.FC<{ alerts: SystemAlert[] }> = ({ alerts }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Operational Alerts & Action Items ({alerts.length})
          </h3>
          <p className="text-xs text-slate-500">Cross-module issues requiring attention.</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const isCritical = alert.type === 'critical';
          const isWarning = alert.type === 'warning';

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                isCritical
                  ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                  : isWarning
                  ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isCritical ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{alert.title}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white/80 text-slate-600 border border-slate-200">
                      {alert.module}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{alert.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                <Link
                  to={alert.linkPath}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                >
                  {alert.linkText}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

