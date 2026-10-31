/**
 * PaymentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Customer Payments & Receipts ledger page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { CustomerPayment } from '../types/payment.types';
import { paymentService } from '../services/paymentService';
import { PaymentTable } from '../components/PaymentTable';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const res = await paymentService.list();
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load customer payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Payments & Receipts</h1>
        <p className="text-xs text-slate-500">
          Track verified incoming cash deposits, RTGS transfers, UPI transactions, and generate formal payment receipts.
        </p>
      </div>

      <PaymentTable payments={payments} isLoading={isLoading} />
    </div>
  );
};

