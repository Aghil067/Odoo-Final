/**
 * ServiceWarrantyAnalyticsView.tsx
 * ─────────────────────────────────────────────────────────────
 * Warranty Coverage & After-Sales Service Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, HeadphonesIcon, AlertCircle, Clock } from 'lucide-react';
import type { SystemKPIs, StatusDistributionItem } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { StatusDistributionBar } from '../DashboardCharts';

interface ServiceWarrantyAnalyticsViewProps {
  kpis: SystemKPIs;
  serviceDistribution: StatusDistributionItem[];
}

export const ServiceWarrantyAnalyticsView: React.FC<ServiceWarrantyAnalyticsViewProps> = ({
  kpis,
  serviceDistribution,
}) => {
  return (
    <div className="space-y-6">
      {/* Service & Warranty KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Active Warranties"
          value={kpis.activeWarranties}
          subtitle="Registered solar dossiers"
          icon={Shield}
          iconBgColor="bg-cyan-50"
          iconColor="text-cyan-600"
          linkPath="/warranty/records"
        />

        <KPICard
          title="Expiring Warranties"
          value={kpis.warrantiesExpiringSoon}
          subtitle="Within next 30 days"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          linkPath="/warranty/expiring"
          trendText={kpis.warrantiesExpiringSoon > 0 ? 'AMC conversion target' : 'None'}
          trendColor="text-amber-700"
        />

        <KPICard
          title="Open Service Tickets"
          value={kpis.openServiceTickets}
          subtitle={`${kpis.serviceTicketsAwaitingParts} awaiting spare parts`}
          icon={HeadphonesIcon}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/service/tickets"
        />

        <KPICard
          title="Critical Incidents"
          value={kpis.criticalServiceTickets}
          subtitle="Inverter trips & outages"
          icon={AlertCircle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          linkPath="/service/tickets"
          trendText={kpis.criticalServiceTickets > 0 ? 'Urgent field attention' : 'Optimal'}
          trendColor={kpis.criticalServiceTickets > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}
        />
      </div>

      {/* Service Distribution & Incident Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionBar
          title="Service Ticket Lifecycle Mix"
          subtitle="Breakdown of customer service requests by operational phase."
          items={serviceDistribution}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incident Severity Breakdown</h3>
              <p className="text-xs text-slate-500">Service tickets categorized by SLA response severity.</p>
            </div>
            <Link to="/service/tickets" className="text-xs text-green-700 hover:underline font-semibold">
              Manage Tickets &rarr;
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Critical Priority (SLA &lt; 4 Hours)
                </span>
                <span className="font-mono text-slate-800">2 tickets (28.6%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '28.6%' }} className="bg-rose-500 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  High Priority (SLA &lt; 24 Hours)
                </span>
                <span className="font-mono text-slate-800">3 tickets (42.8%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '42.8%' }} className="bg-amber-500 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Medium / Low (Scheduled Maintenance)
                </span>
                <span className="font-mono text-slate-800">2 tickets (28.6%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '28.6%' }} className="bg-blue-500 h-full rounded-full" />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Average customer service resolution turnaround time: <span className="font-bold text-slate-700">18.5 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};
