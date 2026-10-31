/**
 * ExecutiveOverviewView.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive Executive Master Dashboard View for Module M10.
 * Combines high-level KPIs across M01 through M09.
 */

import React from 'react';
import {
  Users,
  MapPin,
  Package,
  Wrench,
  HardHat,
  Shield,
  TrendingUp,
} from 'lucide-react';
import type {
  SystemKPIs,
  MonthlyTrendData,
  FunnelStage,
  StatusDistributionItem,
  TechnicianWorkloadItem,
  SystemAlert,
  ActivityEvent,
} from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import {
  InstallationTrendChart,
  EnquiryTrendChart,
  SalesConversionFunnel,
  StatusDistributionBar,
  TechnicianWorkloadChart,
} from '../DashboardCharts';
import { BusinessAlertsList } from '../BusinessAlertsList';
import { RecentActivityFeed } from '../RecentActivityFeed';

interface ExecutiveOverviewViewProps {
  kpis: SystemKPIs;
  trends: MonthlyTrendData[];
  funnel: FunnelStage[];
  installationDistribution: StatusDistributionItem[];
  technicianWorkload: TechnicianWorkloadItem[];
  alerts: SystemAlert[];
  activities: ActivityEvent[];
}

export const ExecutiveOverviewView: React.FC<ExecutiveOverviewViewProps> = ({
  kpis,
  trends,
  funnel,
  installationDistribution,
  technicianWorkload,
  alerts,
  activities,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Primary Cross-Module Executive KPI Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Cross-Functional Executive Pulse (M01 – M09)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Sales & Customers */}
          <KPICard
            title="Customers"
            value={kpis.totalCustomers}
            subtitle={`${kpis.newCustomersThisMonth} new this month`}
            icon={Users}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            linkPath="/crm/customers"
            trendText={`${kpis.openEnquiries} open leads`}
            trendColor="text-blue-700"
          />

          {/* Site Surveys */}
          <KPICard
            title="Site Surveys"
            value={kpis.approvedSurveys}
            subtitle={`${kpis.surveysAwaitingApproval} pending approval`}
            icon={MapPin}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            linkPath="/surveys"
            trendText={`${kpis.surveysInProgress} in progress`}
            trendColor="text-emerald-700"
          />

          {/* Inventory */}
          <KPICard
            title="Inventory"
            value={kpis.availableSerializedUnits}
            subtitle={`${kpis.totalInventoryProducts} total SKUs`}
            icon={Package}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            linkPath="/inventory/dashboard"
            trendText={`${kpis.lowStockProducts} low stock`}
            trendColor={kpis.lowStockProducts > 0 ? 'text-amber-600' : 'text-slate-500'}
          />

          {/* Installations */}
          <KPICard
            title="Installations"
            value={kpis.totalInstallations}
            subtitle={`${kpis.completedInstallations} commissioned`}
            icon={Wrench}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            linkPath="/installations"
            trendText={`${kpis.installationsInProgress} active work`}
            trendColor="text-amber-700"
          />

          {/* Technicians */}
          <KPICard
            title="Technicians"
            value={kpis.totalTechnicians}
            subtitle={`${kpis.availableTechnicians} available for duty`}
            icon={HardHat}
            iconBgColor="bg-sky-50"
            iconColor="text-sky-600"
            linkPath="/technicians"
            trendText={`${kpis.assignedTechnicians} on field`}
            trendColor="text-sky-700"
          />

          {/* Warranty & Service */}
          <KPICard
            title="Service & Warranty"
            value={kpis.openServiceTickets}
            subtitle={`${kpis.activeWarranties} active warranties`}
            icon={Shield}
            iconBgColor="bg-rose-50"
            iconColor="text-rose-600"
            linkPath="/service/tickets"
            trendText={`${kpis.criticalServiceTickets} critical`}
            trendColor={kpis.criticalServiceTickets > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}
          />

          {/* Finance Collections */}
          <KPICard
            title="Net Cash Profit"
            value={`₹${(kpis.overallRecordedProfit / 1000).toFixed(0)}k`}
            subtitle={`₹${(kpis.totalCollected / 1000).toFixed(0)}k collected`}
            icon={TrendingUp}
            iconBgColor="bg-green-50"
            iconColor="text-green-700"
            linkPath="/finance/dashboard"
            trendText={`₹${(kpis.outstandingPayments / 1000).toFixed(0)}k due`}
            trendColor="text-rose-600"
          />
        </div>
      </div>

      {/* 2. Visual Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstallationTrendChart data={trends} />
        <EnquiryTrendChart data={trends} />
      </div>

      {/* 3. Funnel & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesConversionFunnel stages={funnel} />
        </div>
        <div>
          <StatusDistributionBar
            title="Solar Project Status Mix"
            subtitle="Current portfolio distribution across all stages."
            items={installationDistribution}
          />
        </div>
      </div>

      {/* 4. Technician Allocation & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechnicianWorkloadChart items={technicianWorkload} />
        <BusinessAlertsList alerts={alerts} />
      </div>

      {/* 5. Live Activity Feed */}
      <RecentActivityFeed activities={activities} />
    </div>
  );
};
