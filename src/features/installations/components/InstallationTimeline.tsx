/**
 * InstallationTimeline.tsx
 * ─────────────────────────────────────────────────────────────
 * Activity audit log and chronological timeline of events for an installation order.
 */

import {
  FileText,
  PackageCheck,
  Calendar,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  Camera,
  Truck,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type { InstallationActivity, InstallationActivityType } from '../types/installation.types';

interface InstallationTimelineProps {
  activities: InstallationActivity[];
}

export function InstallationTimeline({ activities }: InstallationTimelineProps) {
  const getActivityIcon = (type: InstallationActivityType) => {
    switch (type) {
      case 'created':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'materials_checked':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case 'materials_issued':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'scheduled':
      case 'rescheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'work_started':
      case 'work_resumed':
        return <PlayCircle className="w-4 h-4 text-cyan-600" />;
      case 'work_paused':
        return <PauseCircle className="w-4 h-4 text-amber-600" />;
      case 'checklist_updated':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'photo_uploaded':
        return <Camera className="w-4 h-4 text-amber-600" />;
      case 'issue_reported':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'work_completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'completion_submitted':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center text-xs text-slate-400">
        No recorded activities yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Clock className="w-5 h-5 text-slate-500" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Installation Activity Log & Timeline
          </h3>
          <p className="text-xs text-slate-500">
            Immutable chronological audit record of actions and stage milestones
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {activities.map((act) => {
          const dt = new Date(act.timestamp);
          const formattedDate = dt.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const formattedTime = dt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={act.id} className="relative group">
              {/* Node indicator */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-green-600 transition-colors shadow-xs">
                {getActivityIcon(act.type)}
              </div>

              {/* Event Content */}
              <div className="bg-slate-50/70 group-hover:bg-slate-50 border border-slate-200/80 rounded-lg p-3 transition-colors text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {act.description}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formattedDate} at {formattedTime}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>Performed by: <strong>{act.performedBy}</strong></span>
                </div>

                {act.notes && (
                  <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                    {act.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

