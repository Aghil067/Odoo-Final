/**
 * TechnicianPaymentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Technician Payments & Payouts page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { TechnicianPaymentRecord } from '../types/technicianPayment.types';
import { technicianPaymentService } from '../services/technicianPaymentService';
import { TechnicianPaymentTable } from '../components/TechnicianPaymentTable';

export const TechnicianPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<TechnicianPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await technicianPaymentService.list();
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load technician payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, approvedAmount?: number) => {
    await technicianPaymentService.approve(id, approvedAmount);
    await loadData();
  };

  const handleDisburse = async (
    id: string,
    amount: number,
    method: string,
    reference: string,
    notes?: string
  ) => {
    await technicianPaymentService.recordDisbursement(id, amount, method, reference, notes);
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Technician Payments & Payouts</h1>
        <p className="text-xs text-slate-500">
          Review milestone claims, approve technician work settlements, and disburse bank transfers against M05 & M06 assignments.
        </p>
      </div>

      <TechnicianPaymentTable
        payments={payments}
        isLoading={isLoading}
        onApprove={handleApprove}
        onDisburse={handleDisburse}
      />
    </div>
  );
};

