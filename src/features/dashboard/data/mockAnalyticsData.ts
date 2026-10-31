/**
 * mockAnalyticsData.ts
 * ─────────────────────────────────────────────────────────────
 * Cross-module analytics dataset for M10: Dashboard & Analytics.
 * Synthesizes business metrics from M01 through M09.
 */

import type {
  SystemKPIs,
  MonthlyTrendData,
  FunnelStage,
  StatusDistributionItem,
  TechnicianWorkloadItem,
  StockCategoryItem,
  SystemAlert,
  ActivityEvent,
} from '../types/analytics.types';

export const MOCK_SYSTEM_KPIS: SystemKPIs = {
  // M01 Customer & Sales
  totalCustomers: 48,
  newCustomersThisMonth: 12,
  openEnquiries: 19,
  qualifiedEnquiries: 14,
  quotationsAwaitingResponse: 6,

  // M02 Survey & M03 Configuration
  surveysAwaitingScheduling: 4,
  surveysInProgress: 3,
  surveysAwaitingApproval: 2,
  approvedSurveys: 32,

  // M04 Inventory
  totalInventoryProducts: 24,
  lowStockProducts: 3,
  outOfStockProducts: 1,
  availableSerializedUnits: 142,

  // M05 Installation
  totalInstallations: 38,
  installationsScheduled: 5,
  installationsInProgress: 4,
  completedInstallations: 26,
  installationsAwaitingVerification: 3,
  delayedInstallations: 1,

  // M06 Technicians
  totalTechnicians: 8,
  availableTechnicians: 3,
  assignedTechnicians: 4,
  busyTechnicians: 1,

  // M07 Warranty & M08 Service
  activeWarranties: 34,
  warrantiesExpiringSoon: 4,
  openServiceTickets: 7,
  criticalServiceTickets: 2,
  serviceTicketsAwaitingParts: 1,

  // M09 Finance
  totalInvoiced: 1491760,
  totalCollected: 635000,
  outstandingPayments: 856760,
  totalRecordedExpenses: 91000,
  overallRecordedProfit: 522000,
  technicianPaymentsPending: 27500,
};

export const MOCK_MONTHLY_TRENDS: MonthlyTrendData[] = [
  {
    month: 'May',
    installationsCompleted: 3,
    installationsScheduled: 4,
    enquiriesReceived: 14,
    enquiriesConverted: 4,
    revenue: 210000,
    expenses: 142000,
    collections: 195000,
  },
  {
    month: 'Jun',
    installationsCompleted: 5,
    installationsScheduled: 6,
    enquiriesReceived: 18,
    enquiriesConverted: 6,
    revenue: 340000,
    expenses: 228000,
    collections: 310000,
  },
  {
    month: 'Jul',
    installationsCompleted: 4,
    installationsScheduled: 5,
    enquiriesReceived: 16,
    enquiriesConverted: 5,
    revenue: 285000,
    expenses: 198000,
    collections: 260000,
  },
  {
    month: 'Aug',
    installationsCompleted: 6,
    installationsScheduled: 8,
    enquiriesReceived: 22,
    enquiriesConverted: 7,
    revenue: 420000,
    expenses: 285000,
    collections: 390000,
  },
  {
    month: 'Sep',
    installationsCompleted: 7,
    installationsScheduled: 9,
    enquiriesReceived: 26,
    enquiriesConverted: 8,
    revenue: 480000,
    expenses: 315000,
    collections: 440000,
  },
  {
    month: 'Oct',
    installationsCompleted: 9,
    installationsScheduled: 11,
    enquiriesReceived: 31,
    enquiriesConverted: 10,
    revenue: 640000,
    expenses: 412000,
    collections: 535000,
  },
];

export const MOCK_SALES_FUNNEL: FunnelStage[] = [
  { stage: '1. Enquiries Ingested', count: 125, percentage: 100 },
  { stage: '2. Qualified & Contacted', count: 96, percentage: 76.8, dropOffRate: 23.2 },
  { stage: '3. Site Survey Completed', count: 68, percentage: 54.4, dropOffRate: 22.4 },
  { stage: '4. System Configured & Quoted', count: 49, percentage: 39.2, dropOffRate: 15.2 },
  { stage: '5. Contract Closed & Commissioned', count: 38, percentage: 30.4, dropOffRate: 8.8 },
];

export const MOCK_INSTALLATION_DISTRIBUTION: StatusDistributionItem[] = [
  { status: 'Completed', count: 26, color: 'bg-emerald-500', percentage: 68.4 },
  { status: 'In Progress', count: 4, color: 'bg-purple-500', percentage: 10.5 },
  { status: 'Scheduled', count: 5, color: 'bg-blue-500', percentage: 13.2 },
  { status: 'Awaiting Material', count: 2, color: 'bg-amber-500', percentage: 5.3 },
  { status: 'On Hold / Delayed', count: 1, color: 'bg-rose-500', percentage: 2.6 },
];

export const MOCK_SERVICE_DISTRIBUTION: StatusDistributionItem[] = [
  { status: 'Resolved / Closed', count: 18, color: 'bg-emerald-500', percentage: 69.2 },
  { status: 'In Progress', count: 3, color: 'bg-purple-500', percentage: 11.5 },
  { status: 'Awaiting Parts', count: 2, color: 'bg-amber-500', percentage: 7.7 },
  { status: 'Assigned / Triage', count: 3, color: 'bg-blue-500', percentage: 11.5 },
];

export const MOCK_TECHNICIAN_WORKLOAD: TechnicianWorkloadItem[] = [
  {
    technicianId: 'tech-001',
    technicianName: 'Sanjay Verma',
    activeInstallations: 2,
    activeServiceTasks: 1,
    totalActive: 3,
    status: 'assigned',
  },
  {
    technicianId: 'tech-002',
    technicianName: 'Ramesh Kumar',
    activeInstallations: 1,
    activeServiceTasks: 1,
    totalActive: 2,
    status: 'assigned',
  },
  {
    technicianId: 'tech-003',
    technicianName: 'Vikram Singh',
    activeInstallations: 0,
    activeServiceTasks: 2,
    totalActive: 2,
    status: 'assigned',
  },
  {
    technicianId: 'tech-004',
    technicianName: 'Arjun Nair',
    activeInstallations: 1,
    activeServiceTasks: 0,
    totalActive: 1,
    status: 'assigned',
  },
  {
    technicianId: 'tech-005',
    technicianName: 'Karthik Rao',
    activeInstallations: 0,
    activeServiceTasks: 0,
    totalActive: 0,
    status: 'available',
  },
  {
    technicianId: 'tech-006',
    technicianName: 'Deepak Patel',
    activeInstallations: 0,
    activeServiceTasks: 0,
    totalActive: 0,
    status: 'available',
  },
];

export const MOCK_STOCK_CATEGORIES: StockCategoryItem[] = [
  { category: 'Solar Panels', itemCount: 6, totalQuantity: 340, lowStockCount: 0, healthyCount: 6 },
  { category: 'Inverters', itemCount: 5, totalQuantity: 28, lowStockCount: 1, healthyCount: 4 },
  { category: 'Batteries', itemCount: 4, totalQuantity: 18, lowStockCount: 1, healthyCount: 3 },
  { category: 'Mounting Structures', itemCount: 4, totalQuantity: 42, lowStockCount: 0, healthyCount: 4 },
  { category: 'BOS & Electricals', itemCount: 5, totalQuantity: 85, lowStockCount: 1, healthyCount: 4 },
];

export const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: 'alt-001',
    type: 'critical',
    module: 'Service Management',
    title: 'Critical Inverter Failure Ticket (SRV-TKT-101)',
    description: 'Priya Sharma site inverter tripped on grid overvoltage BESCOM 254V. Assigned to Sanjay Verma.',
    linkText: 'Inspect Ticket',
    linkPath: '/service/tickets/srv-001',
    timestamp: '25 mins ago',
  },
  {
    id: 'alt-002',
    type: 'critical',
    module: 'Finance & Accounting',
    title: 'Commercial Payment Overdue (INV-2026-0047)',
    description: 'Green Earth Agro Projects ₹6,20,000 payment is past 15-day settlement window.',
    linkText: 'Review Invoice',
    linkPath: '/finance/invoices/inv-004',
    timestamp: '2 hours ago',
  },
  {
    id: 'alt-003',
    type: 'warning',
    module: 'Inventory & Warehouse',
    title: 'Low Stock: Solis 5kW 3-Phase Inverters',
    description: 'Only 2 units remaining at Central Bengaluru Warehouse. Minimum reorder threshold is 4.',
    linkText: 'Check Inventory',
    linkPath: '/inventory/products',
    timestamp: '4 hours ago',
  },
  {
    id: 'alt-004',
    type: 'warning',
    module: 'Site Survey',
    title: 'Surveys Awaiting Approval (2)',
    description: 'Technical surveys for Koramangala and Indiranagar rooftop sites awaiting managerial review.',
    linkText: 'Open Approvals',
    linkPath: '/surveys/approvals',
    timestamp: '1 day ago',
  },
  {
    id: 'alt-005',
    type: 'warning',
    module: 'Warranty Management',
    title: 'Warranties Expiring Within 30 Days (4)',
    description: '4 residential solar systems are within 30 days of Year-1 free service warranty expiration.',
    linkText: 'View Expiring Dossiers',
    linkPath: '/warranty/expiring',
    timestamp: '2 days ago',
  },
];

export const MOCK_RECENT_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    module: 'Finance',
    title: 'Payment Received (₹1,00,000)',
    description: 'Priya Sharma deposited milestone payment via UPI ref UPI-7782190281.',
    timestamp: 'Just now',
    user: 'Finance Officer',
    linkPath: '/finance/payments',
    iconType: 'dollar',
  },
  {
    id: 'act-2',
    module: 'Service',
    title: 'Field Service Task Dispatched (TSK-2026-001)',
    description: 'Assigned Sanjay Verma to Solis inverter overvoltage recalibration.',
    timestamp: '18 mins ago',
    user: 'Service Manager',
    linkPath: '/service/tasks',
    iconType: 'wrench',
  },
  {
    id: 'act-3',
    module: 'Installations',
    title: 'Installation Commissioned (INS-2026-001)',
    description: 'Rajesh Kumar 3 kW rooftop installation verified with BESCOM bidirectional meter.',
    timestamp: '1 hour ago',
    user: 'Kavita Menon (Installation Mgr)',
    linkPath: '/installations',
    iconType: 'tool',
  },
  {
    id: 'act-4',
    module: 'Site Survey',
    title: 'Site Survey Approved (SRV-0002)',
    description: 'Feasibility approved for 5 kW bifacial solar rooftop at Koramangala.',
    timestamp: '3 hours ago',
    user: 'Suresh Rao (Surveyor)',
    linkPath: '/surveys/approvals',
    iconType: 'survey',
  },
  {
    id: 'act-5',
    module: 'CRM',
    title: 'New Solar Customer Onboarded',
    description: 'Registered Green Earth Agro Projects (10 kW commercial solar project).',
    timestamp: '5 hours ago',
    user: 'Sales Executive',
    linkPath: '/crm/customers',
    iconType: 'user',
  },
  {
    id: 'act-6',
    module: 'Inventory',
    title: 'Serialized Units Received (10 Modules)',
    description: 'Adani Solar 545W Bifacial modules barcoded and racked at Central Warehouse.',
    timestamp: 'Yesterday',
    user: 'Inventory Manager',
    linkPath: '/inventory/dashboard',
    iconType: 'package',
  },
  {
    id: 'act-7',
    module: 'Warranty',
    title: 'Manufacturer Warranty Registered',
    description: 'Registered 10-year Solis inverter warranty policy #WAR-2026-0012.',
    timestamp: '2 days ago',
    user: 'Service Manager',
    linkPath: '/warranty/records',
    iconType: 'shield',
  },
];

