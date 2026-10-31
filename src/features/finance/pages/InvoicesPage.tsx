/**
 * InvoicesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Customer Invoices Ledger page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types/invoice.types';
import type { CustomerPayment } from '../types/payment.types';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { InvoiceTable } from '../components/InvoiceTable';
import { PaymentRecordModal } from '../components/PaymentRecordModal';
import { InvoicePrintPreviewModal } from '../components/InvoicePrintPreviewModal';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);
  const [newlyCreatedReceipt, setNewlyCreatedReceipt] = useState<CustomerPayment | null>(null);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await invoiceService.list();
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load customer invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleRecordPayment = async (data: any) => {
    const payment = await paymentService.recordPayment(data);
    await loadInvoices();
    setNewlyCreatedReceipt(payment);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Invoices</h1>
        <p className="text-xs text-slate-500">
          Manage solar system sales quotes, tax invoices, discounts, and payment collections.
        </p>
      </div>

      <InvoiceTable
        invoices={invoices}
        isLoading={isLoading}
        onOpenRecordPayment={(inv) => setActivePaymentInvoice(inv)}
        onOpenPrintPreview={(inv) => setActivePrintInvoice(inv)}
      />

      {activePaymentInvoice && (
        <PaymentRecordModal
          invoice={activePaymentInvoice}
          isOpen={true}
          onClose={() => setActivePaymentInvoice(null)}
          onSubmit={handleRecordPayment}
        />
      )}

      {activePrintInvoice && (
        <InvoicePrintPreviewModal
          invoice={activePrintInvoice}
          isOpen={true}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}

      {newlyCreatedReceipt && (
        <PaymentReceiptModal
          payment={newlyCreatedReceipt}
          isOpen={true}
          onClose={() => setNewlyCreatedReceipt(null)}
        />
      )}
    </div>
  );
};

