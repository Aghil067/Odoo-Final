/**
 * ServiceTicketCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for logging a new Service Request in Module M08.
 */

import React from 'react';
import type { ServiceTicketFormData } from '../types/serviceTicket.types';
import { serviceTicketService } from '../services/serviceTicketService';
import { ServiceTicketForm } from '../components/ServiceTicketForm';

export const ServiceTicketCreatePage: React.FC = () => {
  const handleCreate = async (data: ServiceTicketFormData) => {
    await serviceTicketService.create(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Log Customer Service Request</h1>
        <p className="text-xs text-slate-500">
          Capture customer failure symptoms, affected equipment serial, and verify M07 warranty coverage.
        </p>
      </div>

      <ServiceTicketForm onSubmit={handleCreate} />
    </div>
  );
};

