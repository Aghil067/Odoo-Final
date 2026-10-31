/**
 * WarrantyTimeline.tsx
 * ─────────────────────────────────────────────────────────────
 * Activity timeline for Equipment Warranty lifecycle events in M07.
 */

import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { WarrantyActivity } from '../types/warranty.types';

interface WarrantyTimelineProps {
  activities: WarrantyActivity[];
}

export const WarrantyTimeline: React.FC<WarrantyTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No recorded lifecycle events yet.
      </div>
    );
  }

  const getEventIcon = (type: WarrantyActivity['eventType']) => {
    switch (type) {
      case 'registered':
      case 'submitted_activation':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'activated':
      case 'resumed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'suspended':
        return <PauseCircle className="w-3.5 h-3.5 text-amber-600" />;
      case 'claim_filed':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />;
      case 'expired':
        return <Clock className="w-3.5 h-3.5 text-rose-600" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => (
        <div key={act.id} className="relative group">
          {/* Node marker */}
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
            {getEventIcon(act.eventType)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{act.title}</span>
              <span className="text-[11px] text-slate-400">
                {new Date(act.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>
            <p className="text-[11px] text-slate-400 font-medium">Performed by: {act.performedBy}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
