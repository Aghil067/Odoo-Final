/**
 * ClaimStatusBadge.tsx
 * ─────────────────────────────────────────────────────────────
 * Status and Priority indicator badges for Warranty Claims.
 */

import React from 'react';
import type { ClaimStatus, ClaimPriority } from '../types/warrantyClaim.types';
import {
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_COLOURS,
  CLAIM_PRIORITY_LABELS,
  CLAIM_PRIORITY_COLOURS,
} from '../types/warrantyClaim.types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  size?: 'sm' | 'md';
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = CLAIM_STATUS_LABELS[status] || status;
  const config = CLAIM_STATUS_COLOURS[status] || {
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

interface ClaimPriorityBadgeProps {
  priority: ClaimPriority;
}

export const ClaimPriorityBadge: React.FC<ClaimPriorityBadgeProps> = ({ priority }) => {
  const label = CLAIM_PRIORITY_LABELS[priority] || priority;
  const config = CLAIM_PRIORITY_COLOURS[priority] || {
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

