/**
 * FinanceStatusBadge.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable badge components for Invoices, Expenses, Payments & Subsidies in Module M09.
 */

import React from 'react';
import type { InvoiceStatus } from '../types/invoice.types';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../types/invoice.types';
import type { ExpenseStatus } from '../types/expense.types';
import { EXPENSE_STATUS_LABELS, EXPENSE_STATUS_COLORS } from '../types/expense.types';
import type { TechnicianPaymentStatus } from '../types/technicianPayment.types';
import {
  TECHNICIAN_PAYMENT_STATUS_LABELS,
  TECHNICIAN_PAYMENT_STATUS_COLORS,
} from '../types/technicianPayment.types';
import type { SubsidyStatus } from '../types/subsidy.types';
import { SUBSIDY_STATUS_LABELS, SUBSIDY_STATUS_COLORS } from '../types/subsidy.types';

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const colors = INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.draft;
  const label = INVOICE_STATUS_LABELS[status] || status;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${padding}`}
    >
      {label}
    </span>
  );
};

export const ExpenseStatusBadge: React.FC<{ status: ExpenseStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const colors = EXPENSE_STATUS_COLORS[status] || EXPENSE_STATUS_COLORS.draft;
  const label = EXPENSE_STATUS_LABELS[status] || status;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${padding}`}
    >
      {label}
    </span>
  );
};

export const TechPaymentStatusBadge: React.FC<{
  status: TechnicianPaymentStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'md' }) => {
  const colors =
    TECHNICIAN_PAYMENT_STATUS_COLORS[status] || TECHNICIAN_PAYMENT_STATUS_COLORS.pending;
  const label = TECHNICIAN_PAYMENT_STATUS_LABELS[status] || status;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${padding}`}
    >
      {label}
    </span>
  );
};

export const SubsidyStatusBadge: React.FC<{ status: SubsidyStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const colors = SUBSIDY_STATUS_COLORS[status] || SUBSIDY_STATUS_COLORS.not_started;
  const label = SUBSIDY_STATUS_LABELS[status] || status;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${padding}`}
    >
      {label}
    </span>
  );
};

export const CostTypeBadge: React.FC<{ isEstimated: boolean }> = ({ isEstimated }) => {
  if (isEstimated) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Provisional cost based on M03 BOM quotation estimates">
        Estimated BOM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Actual verified supplier procurement invoice">
      Actual Recorded
    </span>
  );
};

