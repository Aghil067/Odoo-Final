/**
 * InvoiceCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page hosting InvoiceForm to create a new customer invoice in Module M09.
 */

import React from 'react';
import type { InvoiceFormData } from '../types/invoice.types';
import { invoiceService } from '../services/invoiceService';
import { InvoiceForm } from '../components/InvoiceForm';

export const InvoiceCreatePage: React.FC = () => {
  const handleCreate = async (formData: InvoiceFormData) => {
    await invoiceService.create(formData);
  };

  return <InvoiceForm onSubmit={handleCreate} />;
};

