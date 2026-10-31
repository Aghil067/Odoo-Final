/**
 * analytics.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for M10: Dashboard & Analytics Module.
 */

export interface SystemKPIs {
  // Customer & Sales (M01)
  totalCustomers: number;
  newCustomersThisMonth: number;
  openEnquiries: number;
  qualifiedEnquiries: number;
  quotationsAwaitingResponse: number;

  // Survey & Configuration (M02 / M03)
  surveysAwaitingScheduling: number;
  surveysInProgress: number;
  surveysAwaitingApproval: number;
  approvedSurveys: number;

  // Inventory (M04)
  totalInventoryProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  availableSerializedUnits: number;

  // Installation (M05)
  totalInstallations: number;
  installationsScheduled: number;
  installationsInProgress: number;
  completedInstallations: number;
  installationsAwaitingVerification: number;
  delayedInstallations: number;

  // Technicians (M06)
  totalTechnicians: number;
  availableTechnicians: number;
  assignedTechnicians: number;
  busyTechnicians: number;

  // Warranty & Service (M07 / M08)
  activeWarranties: number;
  warrantiesExpiringSoon: number;
  openServiceTickets: number;
  criticalServiceTickets: number;
  serviceTicketsAwaitingParts: number;

  // Finance (M09)
  totalInvoiced: number;
  totalCollected: number;
  outstandingPayments: number;
  totalRecordedExpenses: number;
  overallRecordedProfit: number;
  technicianPaymentsPending: number;
}

export interface MonthlyTrendData {
  month: string;
  installationsCompleted: number;
  installationsScheduled: number;
  enquiriesReceived: number;
  enquiriesConverted: number;
  revenue: number;
  expenses: number;
  collections: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate?: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

export interface TechnicianWorkloadItem {
  technicianId: string;
  technicianName: string;
  activeInstallations: number;
  activeServiceTasks: number;
  totalActive: number;
  status: 'available' | 'assigned' | 'busy' | 'on_leave';
}

export interface StockCategoryItem {
  category: string;
  itemCount: number;
  totalQuantity: number;
  lowStockCount: number;
  healthyCount: number;
}

export interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  module: string;
  title: string;
  description: string;
  linkText: string;
  linkPath: string;
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  module: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  linkPath?: string;
  iconType: 'user' | 'survey' | 'tool' | 'package' | 'shield' | 'dollar' | 'wrench';
}

export type DashboardPeriodFilter = 'this_month' | 'last_month' | 'this_quarter' | 'ytd' | 'all_time';

export type DashboardDepartmentTab =
  | 'overview'
  | 'sales'
  | 'surveys'
  | 'inventory'
  | 'installations'
  | 'technicians'
  | 'service_warranty'
  | 'finance';

