/**
 * ServiceTicketsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Service Tickets Ledger Page in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, HeadphonesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceTicket } from '../types/serviceTicket.types';
import { serviceTicketService } from '../services/serviceTicketService';
import { ServiceTicketTable } from '../components/ServiceTicketTable';

export const ServiceTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const res = await serviceTicketService.list();
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-green-600" />
            Customer Service Tickets
          </h1>
          <p className="text-xs text-slate-500">
            Master ledger of after-sales customer complaints, diagnostic tickets, and repair tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTickets}
            className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/service/tickets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Service Ticket
          </Link>
        </div>
      </div>

      <ServiceTicketTable tickets={tickets} isLoading={isLoading} />
    </div>
  );
};

