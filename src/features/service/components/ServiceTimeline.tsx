/**
 * ServiceTimeline.tsx
 * ─────────────────────────────────────────────────────────────
 * Activity & audit timeline stream for Service Tickets in Module M08.
 */

import React from 'react';
import {
  FileText,
  Shield,
  UserCheck,
  Calendar,
  Search,
  Wrench,
  Package,
  CheckCircle2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import type { ServiceTicketActivity } from '../types/serviceTicket.types';

interface ServiceTimelineProps {
  activities: ServiceTicketActivity[];
}

export const ServiceTimeline: React.FC<ServiceTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <p className="text-center py-6 text-xs text-slate-400">No activity events recorded yet.</p>;
  }

  const getIcon = (type: ServiceTicketActivity['eventType']) => {
    switch (type) {
      case 'created':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'warranty_checked':
        return <Shield className="w-3.5 h-3.5 text-green-600" />;
      case 'assigned':
        return <UserCheck className="w-3.5 h-3.5 text-sky-600" />;
      case 'visit_scheduled':
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case 'inspection_completed':
        return <Search className="w-3.5 h-3.5 text-cyan-600" />;
      case 'repair_started':
      case 'repair_completed':
        return <Wrench className="w-3.5 h-3.5 text-purple-600" />;
      case 'parts_requested':
        return <Package className="w-3.5 h-3.5 text-orange-600" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'closed':
        return <Lock className="w-3.5 h-3.5 text-slate-600" />;
      case 'reopened':
        return <RotateCcw className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => (
        <div key={act.id} className="relative group">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
            {getIcon(act.eventType)}
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{act.title}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(act.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{act.description}</p>
            <p className="text-[11px] text-slate-400 font-medium">By: {act.performedBy}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

