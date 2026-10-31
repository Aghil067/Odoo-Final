/**
 * RoleDashboardViews.tsx
 * ─────────────────────────────────────────────────────────────
 * Role-tailored dashboards for individual operational personas in Module M10.
 * Directly fulfills Section 12 requirements:
 *  - Sales Executive
 *  - Surveyor
 *  - Inventory Manager
 *  - Installation Manager
 *  - Technician
 *  - Finance Officer
 *  - Service Manager
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Package,
  Wrench,
  HardHat,
  Shield,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import type { SystemKPIs, MonthlyTrendData, FunnelStage } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { SalesConversionFunnel, InstallationTrendChart, StatusDistributionBar } from '../DashboardCharts';
import { BusinessAlertsList } from '../BusinessAlertsList';
import { RecentActivityFeed } from '../RecentActivityFeed';
import { MOCK_INSTALLATION_DISTRIBUTION, MOCK_SERVICE_DISTRIBUTION, MOCK_SYSTEM_ALERTS, MOCK_RECENT_ACTIVITIES } from '../../data/mockAnalyticsData';

interface RoleViewProps {
  kpis: SystemKPIs;
  trends: MonthlyTrendData[];
  funnel: FunnelStage[];
  userName: string;
}

/**
 * 1. Sales Executive Dashboard View
 */
export const SalesExecutiveDashboard: React.FC<RoleViewProps> = ({ kpis, funnel }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Total Customers" value={kpis.totalCustomers} subtitle="All accounts" icon={Users} linkPath="/crm/customers" />
      <KPICard title="New This Month" value={kpis.newCustomersThisMonth} subtitle="Acquired" icon={Users} linkPath="/crm/customers" />
      <KPICard title="Open Enquiries" value={kpis.openEnquiries} subtitle="In pipeline" icon={Clock} linkPath="/crm/enquiries" />
      <KPICard title="Qualified Leads" value={kpis.qualifiedEnquiries} subtitle="Ready for survey" icon={CheckCircle2} linkPath="/crm/enquiries" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SalesConversionFunnel stages={funnel} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">Upcoming Customer Follow-ups</h3>
          <Link to="/crm/follow-ups" className="text-xs text-green-700 hover:underline font-semibold">View All &rarr;</Link>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Green Earth Agro (10 kW Commercial)</p>
              <p className="text-[11px] text-slate-500">Proposal review scheduled with Director</p>
            </div>
            <Link to="/crm/enquiries" className="text-green-700 hover:underline font-semibold text-[11px]">Contact</Link>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Dr. Vivek Murthy (5 kW Hybrid)</p>
              <p className="text-[11px] text-slate-500">Battery storage quotation discussion</p>
            </div>
            <Link to="/crm/enquiries" className="text-green-700 hover:underline font-semibold text-[11px]">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 2. Surveyor Dashboard View
 */
export const SurveyorDashboard: React.FC<RoleViewProps> = ({ kpis }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Pending Scheduling" value={kpis.surveysAwaitingScheduling} subtitle="Awaiting visit date" icon={Clock} linkPath="/surveys" />
      <KPICard title="Surveys in Progress" value={kpis.surveysInProgress} subtitle="Active on field" icon={MapPin} linkPath="/surveys" />
      <KPICard title="Awaiting Approval" value={kpis.surveysAwaitingApproval} subtitle="Submitted to manager" icon={AlertTriangle} linkPath="/surveys/approvals" />
      <KPICard title="Approved Surveys" value={kpis.approvedSurveys} subtitle="Feasible for installation" icon={CheckCircle2} linkPath="/surveys" />
    </div>

    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Assigned Field Surveys Queue</h3>
      <div className="divide-y divide-slate-100 text-xs">
        <div className="py-3 flex justify-between items-center">
          <div>
            <p className="font-semibold text-slate-800">Survey #SRV-0004 — Green Earth Agro (Nelamangala)</p>
            <p className="text-[11px] text-slate-500">Rooftop shading analysis & HT panel distance measurement</p>
          </div>
          <Link to="/surveys" className="px-3 py-1 bg-green-600 text-white font-semibold rounded text-[11px]">Execute</Link>
        </div>
        <div className="py-3 flex justify-between items-center">
          <div>
            <p className="font-semibold text-slate-800">Survey #SRV-0005 — Indiranagar Residential Villa</p>
            <p className="text-[11px] text-slate-500">RCC flat roof slope & South-facing tilt survey</p>
          </div>
          <Link to="/surveys" className="px-3 py-1 bg-green-600 text-white font-semibold rounded text-[11px]">Execute</Link>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 3. Inventory Manager Dashboard View
 */
export const InventoryManagerDashboard: React.FC<RoleViewProps> = ({ kpis }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Total Products" value={kpis.totalInventoryProducts} subtitle="Active SKUs" icon={Package} linkPath="/inventory/products" />
      <KPICard title="Serialized Units" value={kpis.availableSerializedUnits} subtitle="Available in rack" icon={CheckCircle2} linkPath="/inventory/dashboard" />
      <KPICard title="Low-Stock SKUs" value={kpis.lowStockProducts} subtitle="Threshold breached" icon={AlertTriangle} linkPath="/inventory/products" />
      <KPICard title="Stockout SKUs" value={kpis.outOfStockProducts} subtitle="Zero quantity" icon={AlertTriangle} linkPath="/inventory/products" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Critical Low Stock Reorders</h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Solis 5kW 3-Phase Inverter</p>
              <p className="text-[11px] text-rose-600 font-semibold">2 units remaining (Min: 4)</p>
            </div>
            <Link to="/inventory/products" className="text-green-700 font-semibold hover:underline">Reorder</Link>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Luminous 150Ah Tubular Battery</p>
              <p className="text-[11px] text-rose-600 font-semibold">1 unit remaining (Min: 6)</p>
            </div>
            <Link to="/inventory/products" className="text-green-700 font-semibold hover:underline">Reorder</Link>
          </div>
        </div>
      </div>

      <BusinessAlertsList alerts={MOCK_SYSTEM_ALERTS.filter((a) => a.module.includes('Inventory'))} />
    </div>
  </div>
);

/**
 * 4. Installation Manager Dashboard View
 */
export const InstallationManagerDashboard: React.FC<RoleViewProps> = ({ kpis, trends }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Total Projects" value={kpis.totalInstallations} subtitle="All time" icon={Wrench} linkPath="/installations" />
      <KPICard title="Completed Projects" value={kpis.completedInstallations} subtitle="Commissioned" icon={CheckCircle2} linkPath="/installations" />
      <KPICard title="Active Field Work" value={kpis.installationsInProgress} subtitle="Under construction" icon={Clock} linkPath="/installations" />
      <KPICard title="Delayed Projects" value={kpis.delayedInstallations} subtitle="Awaiting clearance" icon={AlertTriangle} linkPath="/installations" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InstallationTrendChart data={trends} />
      <StatusDistributionBar
        title="Installation Status Distribution"
        items={MOCK_INSTALLATION_DISTRIBUTION}
      />
    </div>
  </div>
);

/**
 * 5. Technician Persona Dashboard View
 */
export const TechnicianDashboard: React.FC<RoleViewProps> = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Assigned Jobs" value="3" subtitle="Assigned to your roster" icon={HardHat} linkPath="/service/my-tasks" />
      <KPICard title="Today's Site Visits" value="1" subtitle="Scheduled for 10:00 AM" icon={MapPin} linkPath="/service/my-tasks" />
      <KPICard title="Completed Jobs" value="14" subtitle="All time verified" icon={CheckCircle2} linkPath="/service/my-tasks" />
      <KPICard title="Pending Payouts" value="₹17,000" subtitle="Approved milestone claims" icon={CreditCard} linkPath="/service/my-tasks" />
    </div>

    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Your Active Field Tasks</h3>
          <p className="text-xs text-slate-500">Upcoming site inspections, wiring, and commissioning work.</p>
        </div>
        <Link to="/service/my-tasks" className="text-xs text-green-700 hover:underline font-semibold">
          Open Technician Workspace &rarr;
        </Link>
      </div>

      <div className="divide-y divide-slate-100 text-xs">
        <div className="py-3 flex justify-between items-center">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-green-700">TSK-2026-001</span>
              <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded font-semibold text-[10px]">Critical</span>
            </div>
            <p className="font-semibold text-slate-800">Solis 5kW Inverter Overvoltage Recalibration</p>
            <p className="text-[11px] text-slate-500">Client: Priya Sharma • 12th Main, Koramangala</p>
          </div>
          <Link to="/service/my-tasks" className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold">
            Start Field Diagnostic
          </Link>
        </div>

        <div className="py-3 flex justify-between items-center">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-700">INS-2026-003</span>
              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-semibold text-[10px]">Scheduled</span>
            </div>
            <p className="font-semibold text-slate-800">5 kW Hybrid Rooftop Rail Mount Installation</p>
            <p className="text-[11px] text-slate-500">Client: Amit Verma • Sector 14, HSR Layout</p>
          </div>
          <Link to="/technicians/my-assignments" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            View Details
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 6. Finance Officer Dashboard View
 */
export const FinanceOfficerDashboard: React.FC<RoleViewProps> = ({ kpis }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Total Billed" value={`₹${(kpis.totalInvoiced / 1000).toFixed(0)}k`} subtitle="Invoices issued" icon={CreditCard} linkPath="/finance/invoices" />
      <KPICard title="Cash Collected" value={`₹${(kpis.totalCollected / 1000).toFixed(0)}k`} subtitle="Deposited to bank" icon={TrendingUp} linkPath="/finance/payments" />
      <KPICard title="Unpaid Receivables" value={`₹${(kpis.outstandingPayments / 1000).toFixed(0)}k`} subtitle="Due from customers" icon={Clock} linkPath="/finance/invoices" />
      <KPICard title="Recorded Profit" value={`₹${(kpis.overallRecordedProfit / 1000).toFixed(0)}k`} subtitle="Net realized margin" icon={TrendingUp} linkPath="/finance/profitability" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Pending Customer Collections</h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Green Earth Agro (INV-2026-0047)</p>
              <p className="text-[11px] text-rose-600 font-semibold">₹6,20,000 Overdue</p>
            </div>
            <Link to="/finance/invoices" className="text-green-700 font-semibold hover:underline">Collect</Link>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800">Amit Verma (INV-2026-0044)</p>
              <p className="text-[11px] text-amber-600 font-semibold">₹1,95,000 Balance</p>
            </div>
            <Link to="/finance/invoices" className="text-green-700 font-semibold hover:underline">Collect</Link>
          </div>
        </div>
      </div>

      <RecentActivityFeed activities={MOCK_RECENT_ACTIVITIES.filter((a) => a.module === 'Finance')} />
    </div>
  </div>
);

/**
 * 7. Service Manager Dashboard View
 */
export const ServiceManagerDashboard: React.FC<RoleViewProps> = ({ kpis }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard title="Active Warranties" value={kpis.activeWarranties} subtitle="Registered systems" icon={Shield} linkPath="/warranty/records" />
      <KPICard title="Expiring Warranties" value={kpis.warrantiesExpiringSoon} subtitle="Next 30 days" icon={Clock} linkPath="/warranty/expiring" />
      <KPICard title="Open Tickets" value={kpis.openServiceTickets} subtitle="Under support" icon={Wrench} linkPath="/service/tickets" />
      <KPICard title="Critical Tickets" value={kpis.criticalServiceTickets} subtitle="Urgent priority" icon={AlertTriangle} linkPath="/service/tickets" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <StatusDistributionBar title="Service Ticket Statuses" items={MOCK_SERVICE_DISTRIBUTION} />
      <BusinessAlertsList alerts={MOCK_SYSTEM_ALERTS.filter((a) => a.module.includes('Service') || a.module.includes('Warranty'))} />
    </div>
  </div>
);
