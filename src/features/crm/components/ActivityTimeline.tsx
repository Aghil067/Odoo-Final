/**
 * src/features/crm/components/ActivityTimeline.tsx
 * Chronological activity timeline for customers and enquiries.
 */
import { Calendar, CheckCircle2, Clock, FilePlus, HelpCircle, MessageSquare } from 'lucide-react';
import type { CustomerActivity } from '../types/customer.types';

interface ActivityTimelineProps {
  activities: CustomerActivity[];
  isLoading?: boolean;
}

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-sm text-slate-400">Loading activity timeline...</div>;
  }

  if (activities.length === 0) {
    return <div className="p-4 text-center text-sm text-slate-400">No activity recorded yet.</div>;
  }

  const getIcon = (type: CustomerActivity['type']) => {
    switch (type) {
      case 'customer_created':
        return <FilePlus className="w-4 h-4 text-green-600" />;
      case 'enquiry_created':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'follow_up_scheduled':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'follow_up_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'status_changed':
        return <Clock className="w-4 h-4 text-violet-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((item) => (
        <div key={item.id} className="relative flex items-start gap-3">
          <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium text-slate-700">{item.performedBy}</span>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-slate-700">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

