/**
 * SalesAnalyticsView.tsx
 * ─────────────────────────────────────────────────────────────
 * Sales & CRM Performance Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, PhoneCall, CheckCircle, ArrowRight } from 'lucide-react';
import type { SystemKPIs, MonthlyTrendData, FunnelStage } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { EnquiryTrendChart, SalesConversionFunnel } from '../DashboardCharts';

interface SalesAnalyticsViewProps {
  kpis: SystemKPIs;
  trends: MonthlyTrendData[];
  funnel: FunnelStage[];
}

export const SalesAnalyticsView: React.FC<SalesAnalyticsViewProps> = ({
  kpis,
  trends,
  funnel,
}) => {
  return (
    <div className="space-y-6">
      {/* Sales KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Total Customers"
          value={kpis.totalCustomers}
          subtitle="All registered CRM accounts"
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/crm/customers"
        />

        <KPICard
          title="New Accounts"
          value={kpis.newCustomersThisMonth}
          subtitle="Onboarded this month"
          icon={UserPlus}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkPath="/crm/customers"
          trendText="+25% vs last month"
          trendColor="text-emerald-600"
        />

        <KPICard
          title="Open Enquiries"
          value={kpis.openEnquiries}
          subtitle={`${kpis.qualifiedEnquiries} qualified for survey`}
          icon={PhoneCall}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          linkPath="/crm/enquiries"
        />

        <KPICard
          title="Conversion Rate"
          value="30.4%"
          subtitle="Inbound lead to commissioned system"
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          linkPath="/crm/enquiries"
          trendText="Industry top-quartile"
          trendColor="text-green-700"
        />
      </div>

      {/* Visual Funnel & Enquiry Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesConversionFunnel stages={funnel} />
        <EnquiryTrendChart data={trends} />
      </div>

      {/* Customer Segments & Follow-up Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Segment Mix</h3>
              <p className="text-xs text-slate-500">Distribution across consumer categories.</p>
            </div>
            <Link to="/crm/customers" className="text-xs text-green-700 hover:underline font-semibold">
              Open CRM &rarr;
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Residential Solar Rooftops (3kW - 5kW)</span>
                <span className="font-mono text-slate-800">32 accounts (66.7%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '66.7%' }} className="bg-blue-600 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Commercial & Industrial Sheds (10kW - 50kW)</span>
                <span className="font-mono text-slate-800">11 accounts (22.9%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '22.9%' }} className="bg-emerald-600 h-full rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Agricultural Solar Pump & Feeder Projects</span>
                <span className="font-mono text-slate-800">5 accounts (10.4%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div style={{ width: '10.4%' }} className="bg-amber-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Follow-ups */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">High-Priority Follow-ups Due</h3>
              <p className="text-xs text-slate-500">Scheduled client call backs and site visits.</p>
            </div>
            <Link to="/crm/follow-ups" className="text-xs text-green-700 hover:underline font-semibold">
              View Follow-ups &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Green Earth Agro (10 kW Commercial)</p>
                <p className="text-[11px] text-slate-500">Scheduled proposal review call with managing director</p>
              </div>
              <Link
                to="/crm/enquiries"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1"
              >
                Action <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Dr. Vivek Murthy (5 kW Hybrid)</p>
                <p className="text-[11px] text-slate-500">Follow up on battery storage sizing comparison</p>
              </div>
              <Link
                to="/crm/enquiries"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1"
              >
                Action <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

