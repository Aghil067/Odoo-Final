/**
 * InvoiceEditPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page hosting InvoiceForm to edit an existing draft invoice in Module M09.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Invoice, InvoiceFormData } from '../types/invoice.types';
import { invoiceService } from '../services/invoiceService';
import { InvoiceForm } from '../components/InvoiceForm';

export const InvoiceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await invoiceService.getById(id);
        if (!res) {
          navigate('/finance/invoices');
          return;
        }
        setInvoice(res);
      } catch (err) {
        console.error('Failed to load invoice for editing', err);
        navigate('/finance/invoices');
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoice();
  }, [id, navigate]);

  if (isLoading || !invoice) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading invoice for editing...</div>;
  }

  const initialFormData: InvoiceFormData = {
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    customerEmail: invoice.customerEmail,
    customerAddress: invoice.customerAddress,
    customerGst: invoice.customerGst,
    installationId: invoice.installationId,
    installationRef: invoice.installationRef,
    systemCapacity: invoice.systemCapacity,
    systemType: invoice.systemType,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      hsnSacCode: i.hsnSacCode,
    })),
    taxRate: invoice.taxRate,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    notes: invoice.notes,
    terms: invoice.terms,
  };

  const handleUpdate = async (formData: InvoiceFormData) => {
    await invoiceService.updateFromForm(invoice.id, formData);
  };

  return <InvoiceForm initialData={initialFormData} isEditing onSubmit={handleUpdate} />;
};
