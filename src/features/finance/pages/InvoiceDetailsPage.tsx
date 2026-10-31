/**
 * InvoiceDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page hosting InvoiceDetails dossier in Module M09.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Invoice } from '../types/invoice.types';
import type { CustomerPayment } from '../types/payment.types';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { InvoiceDetails } from '../components/InvoiceDetails';

export const InvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [inv, payRes] = await Promise.all([
        invoiceService.getById(id),
        paymentService.list({ invoiceId: id }),
      ]);

      if (!inv) {
        navigate('/finance/invoices');
        return;
      }

      setInvoice(inv);
      setPayments(payRes.data);
    } catch (err) {
      console.error('Failed to load invoice dossier', err);
      navigate('/finance/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRecordPayment = async (data: any) => {
    await paymentService.recordPayment(data);
    await loadData();
  };

  if (isLoading || !invoice) {
    return (
      <div className="text-center py-24 text-xs text-slate-400">
        Loading invoice dossier...
      </div>
    );
  }

  return (
    <InvoiceDetails
      invoice={invoice}
      payments={payments}
      onRecordPayment={handleRecordPayment}
    />
  );
};

