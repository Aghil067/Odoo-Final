/**
 * WarrantyStatusBadge.tsx
 * ─────────────────────────────────────────────────────────────
 * Clean status indicator badge for Equipment Warranties.
 */

import React from 'react';
import type { WarrantyStatus } from '../types/warranty.types';
import { WARRANTY_STATUS_LABELS, WARRANTY_STATUS_COLOURS } from '../types/warranty.types';

interface WarrantyStatusBadgeProps {
  status: WarrantyStatus;
  size?: 'sm' | 'md';
}

export const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const label = WARRANTY_STATUS_LABELS[status] || status;
  const config = WARRANTY_STATUS_COLOURS[status] || {
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

