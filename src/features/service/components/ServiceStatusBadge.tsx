/**
 * ServiceStatusBadge.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable Status, Priority, and Warranty indicator badges for Module M08.
 */

import React from 'react';
import type {
  ServiceTicketStatus,
  ServicePriority,
  ServiceWarrantyIndicator,
} from '../types/serviceTicket.types';
import type { ServiceTaskStatus } from '../types/serviceTask.types';
import {
  SERVICE_TICKET_STATUS_LABELS,
  SERVICE_TICKET_STATUS_COLOURS,
  SERVICE_PRIORITY_LABELS,
  SERVICE_PRIORITY_COLOURS,
  SERVICE_WARRANTY_INDICATOR_LABELS,
  SERVICE_WARRANTY_INDICATOR_COLOURS,
} from '../types/serviceTicket.types';
import {
  SERVICE_TASK_STATUS_LABELS,
  SERVICE_TASK_STATUS_COLOURS,
} from '../types/serviceTask.types';

interface TicketStatusBadgeProps {
  status: ServiceTicketStatus;
  size?: 'sm' | 'md';
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = SERVICE_TICKET_STATUS_LABELS[status] || status;
  const config = SERVICE_TICKET_STATUS_COLOURS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};

interface TaskStatusBadgeProps {
  status: ServiceTaskStatus;
  size?: 'sm' | 'md';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = SERVICE_TASK_STATUS_LABELS[status] || status;
  const config = SERVICE_TASK_STATUS_COLOURS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: ServicePriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const label = SERVICE_PRIORITY_LABELS[priority] || priority;
  const config = SERVICE_PRIORITY_COLOURS[priority] || {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${config.badge}`}
    >
      {label}
    </span>
  );
};

interface WarrantyIndicatorBadgeProps {
  indicator: ServiceWarrantyIndicator;
}

export const WarrantyIndicatorBadge: React.FC<WarrantyIndicatorBadgeProps> = ({ indicator }) => {
  const label = SERVICE_WARRANTY_INDICATOR_LABELS[indicator] || indicator;
  const config = SERVICE_WARRANTY_INDICATOR_COLOURS[indicator] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}
    >
      {label}
    </span>
  );
};

