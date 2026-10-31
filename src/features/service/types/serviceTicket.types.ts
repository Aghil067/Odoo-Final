/**
 * serviceTicket.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Service Tickets in Module M08.
 */

export type ServiceTicketStatus =
  | 'new'
  | 'open'
  | 'under_review'
  | 'awaiting_assignment'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'awaiting_parts'
  | 'awaiting_customer'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type ServicePriority = 'low' | 'medium' | 'high' | 'critical';

export type ServiceIssueCategory =
  | 'inverter_failure'
  | 'battery_problem'
  | 'solar_panel_damage'
  | 'low_power_generation'
  | 'charge_controller_failure'
  | 'electrical_fault'
  | 'wiring_problem'
  | 'earthing_problem'
  | 'physical_damage'
  | 'general_maintenance'
  | 'other';

export type ServiceWarrantyIndicator =
  | 'active'
  | 'expired'
  | 'pending_activation'
  | 'none'
  | 'unavailable';

export interface ServiceTicketActivity {
  id: string;
  eventType:
    | 'created'
    | 'reviewed'
    | 'warranty_checked'
    | 'assigned'
    | 'visit_scheduled'
    | 'inspection_completed'
    | 'repair_started'
    | 'parts_requested'
    | 'repair_completed'
    | 'resolved'
    | 'closed'
    | 'reopened';
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
}

export interface ServiceTicket {
  id: string;
  ticketId: string; // e.g. "SRV-TKT-101"

  // Customer (M01)
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;

  // Installation (M05)
  installationId?: string;
  installationRef?: string;
  siteAddress?: string;
  siteCity?: string;
  siteState?: string;
  systemType?: string;
  systemCapacity?: string;

  // Equipment & Serial (M04)
  productId?: string;
  productName: string;
  productCategory: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  equipmentLocation?: string;

  // Warranty (M07)
  warrantyId?: string;
  warrantyRef?: string;
  warrantyStatus?: string;
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  warrantyCoverageType?: string;
  warrantyCoverageDescription?: string;
  warrantyIndicator: ServiceWarrantyIndicator;

  // Issue info
  issueCategory: ServiceIssueCategory;
  issueTitle: string;
  detailedDescription: string;
  reportedDate: string;
  issueOccurrenceDate?: string;
  priority: ServicePriority;
  customerObservations?: string;
  errorCode?: string;

  // Supporting evidence
  supportingPhotos: string[];
  supportingDocuments?: { id: string; name: string; url: string; size: string }[];
  remarks?: string;

  // Assignment & Workflow
  status: ServiceTicketStatus;
  assignedServiceManagerId?: string;
  assignedServiceManagerName?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  scheduledVisitDate?: string;

  // Tasks count & resolution
  taskIds: string[];
  isOverdue?: boolean;

  activityTimeline: ServiceTicketActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTicketFormData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;

  installationId?: string;
  installationRef?: string;
  siteAddress?: string;
  siteCity?: string;
  systemType?: string;
  systemCapacity?: string;

  productId?: string;
  productName: string;
  productCategory: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  equipmentLocation?: string;

  warrantyId?: string;
  warrantyRef?: string;
  warrantyStatus?: string;
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  warrantyCoverageType?: string;
  warrantyIndicator: ServiceWarrantyIndicator;

  issueCategory: ServiceIssueCategory;
  issueTitle: string;
  detailedDescription: string;
  reportedDate: string;
  issueOccurrenceDate?: string;
  priority: ServicePriority;
  customerObservations?: string;
  errorCode?: string;

  supportingPhotos: string[];
  remarks?: string;
  saveAsDraft?: boolean;
}

export interface ServiceTicketFilters {
  search?: string;
  status?: ServiceTicketStatus;
  priority?: ServicePriority;
  issueCategory?: ServiceIssueCategory;
  warrantyIndicator?: ServiceWarrantyIndicator;
  technicianId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ServiceDashboardMetrics {
  totalTickets: number;
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingCustomerResponse: number;
  resolvedTickets: number;
  overdueTickets: number;
  categoryDistribution: { category: ServiceIssueCategory; count: number }[];
  priorityDistribution: { priority: ServicePriority; count: number }[];
}

export const SERVICE_TICKET_STATUS_LABELS: Record<ServiceTicketStatus, string> = {
  new: 'New Ticket',
  open: 'Open',
  under_review: 'Under Review',
  awaiting_assignment: 'Awaiting Assignment',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  awaiting_parts: 'Awaiting Parts',
  awaiting_customer: 'Awaiting Customer',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const SERVICE_TICKET_STATUS_COLOURS: Record<
  ServiceTicketStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  open: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  under_review: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  awaiting_assignment: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  assigned: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  on_hold: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  awaiting_parts: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  awaiting_customer: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  closed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-500' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', dot: 'bg-rose-400' },
};

export const SERVICE_PRIORITY_LABELS: Record<ServicePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical Emergency',
};

export const SERVICE_PRIORITY_COLOURS: Record<ServicePriority, { bg: string; text: string; badge: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' },
};

export const SERVICE_ISSUE_CATEGORY_LABELS: Record<ServiceIssueCategory, string> = {
  inverter_failure: 'Inverter Failure / Tripping',
  battery_problem: 'Battery Storage / Rapid Drain',
  solar_panel_damage: 'Solar Panel Physical Damage',
  low_power_generation: 'Low Power Generation',
  charge_controller_failure: 'Charge Controller Failure',
  electrical_fault: 'Electrical Short / Breaker Trip',
  wiring_problem: 'DC/AC Cabling & Conduits',
  earthing_problem: 'Earthing Resistance / Surge Fault',
  physical_damage: 'Mounting Structure / Hail Damage',
  general_maintenance: 'Preventative Routine Maintenance',
  other: 'Other Hardware Issue',
};

export const SERVICE_WARRANTY_INDICATOR_LABELS: Record<ServiceWarrantyIndicator, string> = {
  active: 'Active Warranty Coverage',
  expired: 'Expired Warranty (Chargeable)',
  pending_activation: 'Pending Warranty Activation',
  none: 'No Warranty Found',
  unavailable: 'Warranty Information Unavailable',
};

export const SERVICE_WARRANTY_INDICATOR_COLOURS: Record<
  ServiceWarrantyIndicator,
  { bg: string; text: string; border: string }
> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  expired: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  pending_activation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  none: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  unavailable: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

