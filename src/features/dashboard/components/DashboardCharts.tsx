/**
 * DashboardCharts.tsx
 * ─────────────────────────────────────────────────────────────
 * Clean responsive visual charts for M10: Dashboard & Analytics.
 * Built using native SVG & Tailwind CSS matching project styling.
 */

import React from 'react';
import type {
  MonthlyTrendData,
  FunnelStage,
  StatusDistributionItem,
  TechnicianWorkloadItem,
} from '../types/analytics.types';

/**
 * 1. Installation Monthly Completion Trend Chart
 */
export const InstallationTrendChart: React.FC<{ data: MonthlyTrendData[] }> = ({ data }) => {
  const maxVal = Math.max(...data.flatMap((d) => [d.installationsCompleted, d.installationsScheduled]), 12);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Monthly Installation Completion Trend</h3>
          <p className="text-xs text-slate-500">Completed commissioned rooftops vs scheduled projects.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span className="text-slate-600 font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-400 inline-block" />
            <span className="text-slate-600 font-medium">Scheduled</span>
          </div>
        </div>
      </div>

      <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
        {data.map((item) => {
          const compHeight = (item.installationsCompleted / maxVal) * 100;
          const schHeight = (item.installationsScheduled / maxVal) * 100;

          return (
            <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div className="w-full flex items-end justify-center gap-1.5 h-44">
                <div
                  style={{ height: `${compHeight}%` }}
                  className="w-1/2 bg-emerald-600 rounded-t transition-all group-hover:brightness-110"
                />
                <div
                  style={{ height: `${schHeight}%` }}
                  className="w-1/2 bg-blue-400 rounded-t transition-all group-hover:brightness-110"
                />
              </div>

              <span className="text-xs font-semibold text-slate-600 mt-2 block">{item.month}</span>

              {/* Tooltip on hover */}
              <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div>Completed: {item.installationsCompleted} | Scheduled: {item.installationsScheduled}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 2. Monthly Customer Enquiry Pipeline Trend Chart
 */
export const EnquiryTrendChart: React.FC<{ data: MonthlyTrendData[] }> = ({ data }) => {
  const maxVal = Math.max(...data.flatMap((d) => [d.enquiriesReceived, d.enquiriesConverted]), 35);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Customer Inflow & Conversion Pipeline</h3>
          <p className="text-xs text-slate-500">Inbound customer enquiries received vs deals closed.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
            <span className="text-slate-600 font-medium">Inquiries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-600 inline-block" />
            <span className="text-slate-600 font-medium">Converted</span>
          </div>
        </div>
      </div>

      <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
        {data.map((item) => {
          const recHeight = (item.enquiriesReceived / maxVal) * 100;
          const convHeight = (item.enquiriesConverted / maxVal) * 100;

          return (
            <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div className="w-full flex items-end justify-center gap-1.5 h-44">
                <div
                  style={{ height: `${recHeight}%` }}
                  className="w-1/2 bg-sky-500 rounded-t transition-all group-hover:brightness-110"
                />
                <div
                  style={{ height: `${convHeight}%` }}
                  className="w-1/2 bg-green-600 rounded-t transition-all group-hover:brightness-110"
                />
              </div>

              <span className="text-xs font-semibold text-slate-600 mt-2 block">{item.month}</span>

              {/* Tooltip */}
              <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div>Enquiries: {item.enquiriesReceived} | Converted: {item.enquiriesConverted}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 3. Sales & Conversion Funnel
 */
export const SalesConversionFunnel: React.FC<{ stages: FunnelStage[] }> = ({ stages }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Sales & Operational Conversion Funnel</h3>
        <p className="text-xs text-slate-500">From initial customer lead down to completed commissioning.</p>
      </div>

      <div className="space-y-3 pt-2">
        {stages.map((stage) => (
          <div key={stage.stage} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">{stage.stage}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-900">{stage.count}</span>
                <span className="text-[11px] font-semibold text-green-700 w-12 text-right">
                  {stage.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                style={{ width: `${stage.percentage}%` }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
              />
            </div>

            {stage.dropOffRate && (
              <span className="text-[10px] text-slate-400 block text-right">
                Stage drop-off: {stage.dropOffRate}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 4. Status Distribution Horizontal Bar / Legend
 */
export const StatusDistributionBar: React.FC<{
  title: string;
  subtitle?: string;
  items: StatusDistributionItem[];
}> = ({ title, subtitle, items }) => {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <span className="text-xs font-mono font-bold text-slate-800">Total: {total}</span>
        </div>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Segmented Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
        {items.map((item) => (
          <div
            key={item.status}
            style={{ width: `${item.percentage}%` }}
            className={`${item.color} h-full transition-all`}
            title={`${item.status}: ${item.count} (${item.percentage}%)`}
          />
        ))}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        {items.map((item) => (
          <div key={item.status} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color} inline-block`} />
              <span className="text-slate-700 font-medium truncate max-w-[120px]">{item.status}</span>
            </div>
            <div className="font-mono font-bold text-slate-900">
              {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 5. Technician Workload Allocation Widget
 */
export const TechnicianWorkloadChart: React.FC<{ items: TechnicianWorkloadItem[] }> = ({ items }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Technician Active Workload Distribution</h3>
        <p className="text-xs text-slate-500">Live active field installations vs customer repair tasks.</p>
      </div>

      <div className="space-y-3">
        {items.map((tech) => (
          <div key={tech.technicianId} className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{tech.technicianName}</span>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                    tech.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700'
                      : tech.status === 'assigned'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tech.status}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700">
                {tech.totalActive} Active Jobs
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
              <div
                style={{ width: `${(tech.activeInstallations / 4) * 100}%` }}
                className="bg-blue-600 h-full"
                title={`Installations: ${tech.activeInstallations}`}
              />
              <div
                style={{ width: `${(tech.activeServiceTasks / 4) * 100}%` }}
                className="bg-purple-600 h-full"
                title={`Service Tasks: ${tech.activeServiceTasks}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

