/**
 * InstallationPerformanceView.tsx
 * ─────────────────────────────────────────────────────────────
 * Installation Performance & Job Execution Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { SystemKPIs, MonthlyTrendData, StatusDistributionItem } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { InstallationTrendChart, StatusDistributionBar } from '../DashboardCharts';

interface InstallationPerformanceViewProps {
  kpis: SystemKPIs;
  trends: MonthlyTrendData[];
  distribution: StatusDistributionItem[];
}

export const InstallationPerformanceView: React.FC<InstallationPerformanceViewProps> = ({
  kpis,
  trends,
  distribution,
}) => {
  return (
    <div className="space-y-6">
      {/* Installation KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Total Projects"
          value={kpis.totalInstallations}
          subtitle="Portfolio to date"
          icon={Wrench}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          linkPath="/installations"
        />

        <KPICard
          title="Commissioned"
          value={kpis.completedInstallations}
          subtitle="68.4% completion rate"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkPath="/installations"
          trendText="Verified by DISCOM"
          trendColor="text-emerald-700"
        />

        <KPICard
          title="Active Field Work"
          value={kpis.installationsInProgress}
          subtitle={`${kpis.installationsScheduled} upcoming scheduled`}
          icon={Clock}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/installations"
        />

        <KPICard
          title="Critical Delays"
          value={kpis.delayedInstallations}
          subtitle="Awaiting client or DISCOM liaison"
          icon={AlertTriangle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          linkPath="/installations"
          trendText={kpis.delayedInstallations > 0 ? 'Requires attention' : 'On schedule'}
          trendColor={kpis.delayedInstallations > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}
        />
      </div>

      {/* Monthly Trend & Status Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstallationTrendChart data={trends} />
        <StatusDistributionBar
          title="Installation Status Distribution"
          subtitle="Live operational state across solar turnkey projects."
          items={distribution}
        />
      </div>

      {/* System Capacity Breakdown & Grid Type Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Installed Solar Capacity Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution by kilowatt peak rating (kWp).</p>
            </div>
            <Link to="/installations" className="text-xs text-green-700 hover:underline font-semibold">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>3 kW Residential Rooftop Systems</span>
                <span className="font-mono text-slate-800">18 installations (47.4%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '47.4%' }} className="bg-emerald-500 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>5 kW Residential / Villa Systems</span>
                <span className="font-mono text-slate-800">14 installations (36.8%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '36.8%' }} className="bg-blue-600 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>10 kW+ Commercial & Farmhouse Arrays</span>
                <span className="font-mono text-slate-800">6 installations (15.8%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '15.8%' }} className="bg-purple-600 h-full rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Type Mix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grid Connectivity Typology</h3>
              <p className="text-xs text-slate-500">On-grid net metered vs hybrid battery storage systems.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">On-Grid Net Metered</span>
              <div className="text-2xl font-bold font-mono text-blue-700">76.3%</div>
              <p className="text-[11px] text-slate-500">29 installations tied to BESCOM bi-directional grid export.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Hybrid Storage</span>
              <div className="text-2xl font-bold font-mono text-purple-700">23.7%</div>
              <p className="text-[11px] text-slate-500">9 installations configured with lithium/tubular battery backup.</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Average turnaround from site survey approval to physical commissioning: <span className="font-bold text-slate-700">14.2 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
