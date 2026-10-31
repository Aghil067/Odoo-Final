/**
 * serviceResolutionService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Service Ticket Resolutions & Closure in Module M08.
 */

import type { ServiceTicketResolution } from '../types/serviceResolution.types';
import { MOCK_RESOLUTIONS } from '../data/mockServiceData';
import { serviceTicketService } from './serviceTicketService';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _resolutionsStore: Record<string, ServiceTicketResolution> = { ...MOCK_RESOLUTIONS };

export const serviceResolutionService = {
  async getResolution(ticketId: string): Promise<ServiceTicketResolution | null> {
    await delay();
    return _resolutionsStore[ticketId] || null;
  },

  async resolveTicket(ticketId: string, resolution: ServiceTicketResolution): Promise<ServiceTicketResolution> {
    await delay();
    _resolutionsStore[ticketId] = resolution;

    // Update ticket status to resolved
    await serviceTicketService.updateStatus(ticketId, 'resolved', `Resolution filed: ${resolution.finalDiagnosis}`);
    return resolution;
  },

  async closeTicket(ticketId: string, closedBy = 'Service Manager'): Promise<void> {
    await delay();
    const existing = _resolutionsStore[ticketId];
    if (existing) {
      existing.closedAt = new Date().toISOString();
      existing.closedBy = closedBy;
    }
    await serviceTicketService.updateStatus(ticketId, 'closed', `Ticket closed by ${closedBy}`);
  },

  async reopenTicket(ticketId: string, reason: string): Promise<void> {
    await delay();
    const existing = _resolutionsStore[ticketId];
    if (existing) {
      existing.reopenReason = reason;
    }
    await serviceTicketService.updateStatus(ticketId, 'open', `Ticket reopened: ${reason}`);
  },
};

