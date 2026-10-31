/**
 * TechnicianPerformanceView.tsx
 * ─────────────────────────────────────────────────────────────
 * Technician Roster & Field Performance Analytics in Module M10.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, UserCheck, Clock, DollarSign } from 'lucide-react';
import type { SystemKPIs, TechnicianWorkloadItem } from '../../types/analytics.types';
import { KPICard } from '../KPICard';
import { TechnicianWorkloadChart } from '../DashboardCharts';

interface TechnicianPerformanceViewProps {
  kpis: SystemKPIs;
  technicianWorkload: TechnicianWorkloadItem[];
}

export const TechnicianPerformanceView: React.FC<TechnicianPerformanceViewProps> = ({
  kpis,
  technicianWorkload,
}) => {
  return (
    <div className="space-y-6">
      {/* Technician KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Field Technicians"
          value={kpis.totalTechnicians}
          subtitle="Certified solar installers"
          icon={HardHat}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
          linkPath="/technicians"
        />

        <KPICard
          title="Available Now"
          value={kpis.availableTechnicians}
          subtitle="Ready for dispatch"
          icon={UserCheck}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkPath="/technicians/availability"
          trendText="Immediate assignment"
          trendColor="text-emerald-700"
        />

        <KPICard
          title="On Active Duty"
          value={kpis.assignedTechnicians}
          subtitle={`${kpis.busyTechnicians} on high workload`}
          icon={Clock}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkPath="/technicians/assignments"
        />

        <KPICard
          title="Pending Payouts"
          value={`₹${(kpis.technicianPaymentsPending / 1000).toFixed(1)}k`}
          subtitle="Awaiting M09 finance clearance"
          icon={DollarSign}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          linkPath="/finance/technician-payments"
          trendText="Milestone claims"
          trendColor="text-amber-700"
        />
      </div>

      {/* Workload Distribution Chart */}
      <TechnicianWorkloadChart items={technicianWorkload} />

      {/* Roster Table Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Certified Solar Field Roster</h3>
            <p className="text-xs text-slate-500">Live operational assignment status and active job queue.</p>
          </div>
          <Link to="/technicians" className="text-xs text-green-700 hover:underline font-semibold">
            Manage Technicians (M06) &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <th className="py-2.5 px-4">Technician Name</th>
                <th className="py-2.5 px-4 text-center">Active Installations</th>
                <th className="py-2.5 px-4 text-center">Active Service Tasks</th>
                <th className="py-2.5 px-4 text-center">Total Assigned Workload</th>
                <th className="py-2.5 px-4 text-right">Availability Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {technicianWorkload.map((tech) => (
                <tr key={tech.technicianId} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {tech.technicianName.charAt(0)}
                    </div>
                    <span>{tech.technicianName}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{tech.activeInstallations}</td>
                  <td className="py-3 px-4 text-center font-mono">{tech.activeServiceTasks}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                    {tech.totalActive} Jobs
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                        tech.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tech.status === 'assigned'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tech.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
