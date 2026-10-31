/**
 * serviceTicketService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Service Tickets in Module M08.
 */

import type {
  ServiceTicket,
  ServiceTicketFormData,
  ServiceTicketFilters,
  ServiceTicketStatus,
  ServiceDashboardMetrics,
  ServiceIssueCategory,
  ServicePriority,
} from '../types/serviceTicket.types';
import { MOCK_SERVICE_TICKETS } from '../data/mockServiceData';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _ticketsStore: ServiceTicket[] = [...MOCK_SERVICE_TICKETS];

export const serviceTicketService = {
  async list(filters: ServiceTicketFilters = {}): Promise<{
    data: ServiceTicket[];
    total: number;
  }> {
    await delay();
    let results = [..._ticketsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.productName.toLowerCase().includes(q) ||
          (t.serialNumber && t.serialNumber.toLowerCase().includes(q)) ||
          (t.installationRef && t.installationRef.toLowerCase().includes(q)) ||
          t.issueTitle.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((t) => t.status === filters.status);
    }

    if (filters.priority) {
      results = results.filter((t) => t.priority === filters.priority);
    }

    if (filters.issueCategory) {
      results = results.filter((t) => t.issueCategory === filters.issueCategory);
    }

    if (filters.warrantyIndicator) {
      results = results.filter((t) => t.warrantyIndicator === filters.warrantyIndicator);
    }

    if (filters.technicianId) {
      results = results.filter((t) => t.assignedTechnicianId === filters.technicianId);
    }

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<ServiceTicket | null> {
    await delay();
    return _ticketsStore.find((t) => t.id === id || t.ticketId === id) || null;
  },

  async create(data: ServiceTicketFormData): Promise<ServiceTicket> {
    await delay();
    const newId = `srv-${String(_ticketsStore.length + 1).padStart(3, '0')}`;
    const newTicketId = `SRV-TKT-${100 + _ticketsStore.length + 1}`;
    const now = new Date().toISOString();

    const newTicket: ServiceTicket = {
      id: newId,
      ticketId: newTicketId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,

      installationId: data.installationId,
      installationRef: data.installationRef,
      siteAddress: data.siteAddress,
      siteCity: data.siteCity,
      systemType: data.systemType,
      systemCapacity: data.systemCapacity,

      productId: data.productId,
      productName: data.productName,
      productCategory: data.productCategory,
      manufacturer: data.manufacturer,
      modelNumber: data.modelNumber,
      serialNumber: data.serialNumber,
      equipmentLocation: data.equipmentLocation,

      warrantyId: data.warrantyId,
      warrantyRef: data.warrantyRef,
      warrantyStatus: data.warrantyStatus,
      warrantyStartDate: data.warrantyStartDate,
      warrantyExpiryDate: data.warrantyExpiryDate,
      warrantyCoverageType: data.warrantyCoverageType,
      warrantyIndicator: data.warrantyIndicator,

      issueCategory: data.issueCategory,
      issueTitle: data.issueTitle,
      detailedDescription: data.detailedDescription,
      reportedDate: data.reportedDate || now.split('T')[0],
      issueOccurrenceDate: data.issueOccurrenceDate,
      priority: data.priority,
      customerObservations: data.customerObservations,
      errorCode: data.errorCode,

      supportingPhotos: data.supportingPhotos || [],
      remarks: data.remarks,

      status: data.saveAsDraft ? 'new' : 'open',
      taskIds: [],
      isOverdue: false,

      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          eventType: 'created',
          title: data.saveAsDraft ? 'Draft Ticket Saved' : 'Service Request Logged',
          description: `Ticket created for ${data.customerName}`,
          timestamp: now,
          performedBy: 'Current User',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    _ticketsStore = [newTicket, ..._ticketsStore];
    return newTicket;
  },

  async update(id: string, data: Partial<ServiceTicket>): Promise<ServiceTicket> {
    await delay();
    const index = _ticketsStore.findIndex((t) => t.id === id || t.ticketId === id);
    if (index === -1) {
      throw new Error(`Service ticket not found: ${id}`);
    }

    const updated: ServiceTicket = {
      ..._ticketsStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    _ticketsStore[index] = updated;
    return updated;
  },

  async updateStatus(id: string, newStatus: ServiceTicketStatus, reason?: string): Promise<ServiceTicket> {
    await delay();
    const index = _ticketsStore.findIndex((t) => t.id === id || t.ticketId === id);
    if (index === -1) {
      throw new Error(`Service ticket not found: ${id}`);
    }

    const current = _ticketsStore[index];
    const now = new Date().toISOString();

    const updated: ServiceTicket = {
      ...current,
      status: newStatus,
      activityTimeline: [
        ...current.activityTimeline,
        {
          id: `act-${Date.now()}`,
          eventType: newStatus === 'resolved' ? 'resolved' : newStatus === 'closed' ? 'closed' : 'reviewed',
          title: `Status Changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
          description: reason || `Updated by service manager`,
          timestamp: now,
          performedBy: 'Service Manager',
        },
      ],
      updatedAt: now,
    };

    _ticketsStore[index] = updated;
    return updated;
  },

  async getDashboardMetrics(): Promise<ServiceDashboardMetrics> {
    await delay();
    const totalTickets = _ticketsStore.length;
    const newTickets = _ticketsStore.filter((t) => t.status === 'new').length;
    const openTickets = _ticketsStore.filter((t) => t.status === 'open' || t.status === 'under_review').length;
    const inProgressTickets = _ticketsStore.filter((t) => t.status === 'in_progress' || t.status === 'assigned').length;
    const pendingCustomerResponse = _ticketsStore.filter((t) => t.status === 'awaiting_customer').length;
    const resolvedTickets = _ticketsStore.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const overdueTickets = _ticketsStore.filter((t) => t.isOverdue).length;

    // Categories
    const catMap = new Map<ServiceIssueCategory, number>();
    for (const t of _ticketsStore) {
      catMap.set(t.issueCategory, (catMap.get(t.issueCategory) || 0) + 1);
    }
    const categoryDistribution = Array.from(catMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // Priorities
    const priMap = new Map<ServicePriority, number>();
    for (const t of _ticketsStore) {
      priMap.set(t.priority, (priMap.get(t.priority) || 0) + 1);
    }
    const priorityDistribution = Array.from(priMap.entries()).map(([priority, count]) => ({
      priority,
      count,
    }));

    return {
      totalTickets,
      newTickets,
      openTickets,
      inProgressTickets,
      pendingCustomerResponse,
      resolvedTickets,
      overdueTickets,
      categoryDistribution,
      priorityDistribution,
    };
  },
};

