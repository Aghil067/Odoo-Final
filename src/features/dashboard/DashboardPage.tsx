/**
 * DashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Dashboard & Analytics Page for Module M10.
 *
 * Implements:
 *  - Unified Executive Management Dashboard across Modules M01–M09
 *  - Global period filter ('this_month', 'last_month', 'this_quarter', 'ytd', 'all_time')
 *  - Dynamic data refresh with live timestamp
 *  - Department-specific analytical tab views (Sales, Surveys, Inventory,
 *    Installations, Technicians, Service & Warranty, Finance)
 *  - Role-specific dashboard adaptation for all 8 system roles
 *  - Role view preview switcher for Administrators
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCw,
  Calendar,
  Layers,
  Eye,
  Users,
  MapPin,
  Package,
  Wrench,
  HardHat,
  Shield,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { ROLE_META, ALL_ROLES } from '../../config/roles';
import type { UserRole } from '../auth/types/auth.types';
import type {
  SystemKPIs,
  MonthlyTrendData,
  FunnelStage,
  StatusDistributionItem,
  TechnicianWorkloadItem,
  StockCategoryItem,
  SystemAlert,
  ActivityEvent,
  DashboardPeriodFilter,
  DashboardDepartmentTab,
} from './types/analytics.types';
import { analyticsService } from './services/analyticsService';

// Executive Master Overview View
import { ExecutiveOverviewView } from './components/DepartmentViews/ExecutiveOverviewView';

// Department Analytic Views
import { SalesAnalyticsView } from './components/DepartmentViews/SalesAnalyticsView';
import { InstallationPerformanceView } from './components/DepartmentViews/InstallationPerformanceView';
import { InventoryAnalyticsView } from './components/DepartmentViews/InventoryAnalyticsView';
import { TechnicianPerformanceView } from './components/DepartmentViews/TechnicianPerformanceView';
import { ServiceWarrantyAnalyticsView } from './components/DepartmentViews/ServiceWarrantyAnalyticsView';
import { FinanceAnalyticsView } from './components/DepartmentViews/FinanceAnalyticsView';

// Operational Role Dashboard Views
import {
  SalesExecutiveDashboard,
  SurveyorDashboard,
  InventoryManagerDashboard,
  InstallationManagerDashboard,
  TechnicianDashboard,
  FinanceOfficerDashboard,
  ServiceManagerDashboard,
} from './components/RoleViews/RoleDashboardViews';

export function DashboardPage() {
  const { user } = useAuth();

  // Period filter state
  const [period, setPeriod] = useState<DashboardPeriodFilter>('this_month');
  const [departmentTab, setDepartmentTab] = useState<DashboardDepartmentTab>('overview');

  // Preview role state (allows Admins to preview any operational dashboard)
  const [activeRoleView, setActiveRoleView] = useState<UserRole | 'executive'>('executive');

  // Refresh & loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Analytics data state
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [trends, setTrends] = useState<MonthlyTrendData[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [installationDistribution, setInstallationDistribution] = useState<StatusDistributionItem[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<StatusDistributionItem[]>([]);
  const [technicianWorkload, setTechnicianWorkload] = useState<TechnicianWorkloadItem[]>([]);
  const [stockCategories, setStockCategories] = useState<StockCategoryItem[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  // Fetch all analytics datasets
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        kpiData,
        trendData,
        funnelData,
        instDistData,
        servDistData,
        techWorkloadData,
        stockCatData,
        alertData,
        activityData,
      ] = await Promise.all([
        analyticsService.getKPIs(period),
        analyticsService.getMonthlyTrends(period),
        analyticsService.getSalesFunnel(),
        analyticsService.getInstallationDistribution(),
        analyticsService.getServiceDistribution(),
        analyticsService.getTechnicianWorkload(),
        analyticsService.getStockCategories(),
        analyticsService.getAlerts(),
        analyticsService.getActivities(),
      ]);

      setKpis(kpiData);
      setTrends(trendData);
      setFunnel(funnelData);
      setInstallationDistribution(instDistData);
      setServiceDistribution(servDistData);
      setTechnicianWorkload(techWorkloadData);
      setStockCategories(stockCatData);
      setAlerts(alertData);
      setActivities(activityData);
      setLastRefreshed(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Set default view based on user role when logged in
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setActiveRoleView(user.role);
    } else {
      setActiveRoleView('executive');
    }
  }, [user]);

  const periodOptions: { value: DashboardPeriodFilter; label: string }[] = useMemo(
    () => [
      { value: 'this_month', label: 'This Month' },
      { value: 'last_month', label: 'Last Month' },
      { value: 'this_quarter', label: 'This Quarter' },
      { value: 'ytd', label: 'Year to Date' },
      { value: 'all_time', label: 'All Time' },
    ],
    []
  );

  const departmentTabs: { id: DashboardDepartmentTab; label: string; icon: React.ElementType }[] = useMemo(
    () => [
      { id: 'overview', label: 'Executive Overview', icon: Layers },
      { id: 'sales', label: 'Sales & CRM', icon: Users },
      { id: 'surveys', label: 'Site Surveys', icon: MapPin },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'installations', label: 'Installations', icon: Wrench },
      { id: 'technicians', label: 'Technicians', icon: HardHat },
      { id: 'service_warranty', label: 'Service & Warranty', icon: Shield },
      { id: 'finance', label: 'Finance & Accounts', icon: CreditCard },
    ],
    []
  );

  if (!user || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500">
          <RotateCw className="w-5 h-5 animate-spin text-green-600" />
          <span className="text-sm font-medium">Loading SunPower analytics...</span>
        </div>
      </div>
    );
  }

  const roleMeta = ROLE_META[user.role];
  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                M10 Dashboard & Analytics
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleMeta.badgeColour}`}>
                {roleMeta.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              SunPower Operations Central
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Welcome back, <strong className="text-white">{user.name}</strong>. Here is the operational pulse across all 9 modules.
            </p>
          </div>

          {/* Global Controls: Period Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
              <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <select
                aria-label="Dashboard period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as DashboardPeriodFilter)}
                className="bg-transparent text-slate-200 py-1 px-2 font-medium focus:outline-none cursor-pointer"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Data Button */}
            <button
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition shadow-sm"
              title="Refresh dashboard metrics"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-green-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Live sync status & quick stats ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              Live system status: <span className="text-green-400 font-semibold">All Systems Operational</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">
              Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Quick Snapshot Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-slate-300">
              Active Installations: <strong className="text-green-400">{kpis.installationsInProgress}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              Open Tickets: <strong className="text-amber-400">{kpis.openServiceTickets}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              Month Collections: <strong className="text-emerald-400">₹{(kpis.totalCollected / 1000).toFixed(0)}k</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Admin View-As Selector (Role Simulation) ─────────── */}
      {isAdmin && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="font-bold">Role View Switcher:</span>
            <span className="text-slate-500 hidden sm:inline">Preview the dashboard tailored for specific operational roles:</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Preview role dashboard"
              value={activeRoleView}
              onChange={(e) => setActiveRoleView(e.target.value as UserRole | 'executive')}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-green-500 focus:outline-none"
            >
              <option value="executive">👑 Executive Master (All Departments)</option>
              {ALL_ROLES.filter((r) => r !== 'admin').map((role) => (
                <option key={role} value={role}>
                  👤 {ROLE_META[role].label} View
                </option>
              ))}
            </select>
            {activeRoleView !== 'executive' && (
              <button
                onClick={() => setActiveRoleView('executive')}
                className="text-xs text-green-700 hover:text-green-800 font-semibold px-2 py-1 underline"
              >
                Reset to Executive
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Render Operational Persona View if not Executive ──── */}
      {activeRoleView !== 'executive' ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Currently displaying dashboard as:{' '}
              <strong className="font-bold text-amber-950">{ROLE_META[activeRoleView as UserRole]?.label}</strong>
            </span>
            {isAdmin && (
              <span className="text-[11px] text-amber-700 font-medium">Administrator Simulation Mode</span>
            )}
          </div>

          {activeRoleView === 'sales_executive' && (
            <SalesExecutiveDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'surveyor' && (
            <SurveyorDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'inventory_manager' && (
            <InventoryManagerDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'installation_manager' && (
            <InstallationManagerDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'technician' && (
            <TechnicianDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'finance_officer' && (
            <FinanceOfficerDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
          {activeRoleView === 'service_manager' && (
            <ServiceManagerDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}
        </div>
      ) : (
        /* ── Executive Management Dashboard & Department Tabs ── */
        <div className="space-y-6">
          {/* Department Navigation Tabs */}
          <div className="flex items-center overflow-x-auto gap-2 border-b border-slate-200 pb-2 scrollbar-none">
            {departmentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = departmentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDepartmentTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-green-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Department Tab View Content */}
          {departmentTab === 'overview' && (
            <ExecutiveOverviewView
              kpis={kpis}
              trends={trends}
              funnel={funnel}
              installationDistribution={installationDistribution}
              technicianWorkload={technicianWorkload}
              alerts={alerts}
              activities={activities}
            />
          )}

          {departmentTab === 'sales' && (
            <SalesAnalyticsView kpis={kpis} trends={trends} funnel={funnel} />
          )}

          {departmentTab === 'surveys' && (
            <SurveyorDashboard kpis={kpis} trends={trends} funnel={funnel} userName={user.name} />
          )}

          {departmentTab === 'inventory' && (
            <InventoryAnalyticsView kpis={kpis} stockCategories={stockCategories} />
          )}

          {departmentTab === 'installations' && (
            <InstallationPerformanceView
              kpis={kpis}
              trends={trends}
              distribution={installationDistribution}
            />
          )}

          {departmentTab === 'technicians' && (
            <TechnicianPerformanceView
              kpis={kpis}
              technicianWorkload={technicianWorkload}
            />
          )}

          {departmentTab === 'service_warranty' && (
            <ServiceWarrantyAnalyticsView
              kpis={kpis}
              serviceDistribution={serviceDistribution}
            />
          )}

          {departmentTab === 'finance' && (
            <FinanceAnalyticsView kpis={kpis} trends={trends} />
          )}
        </div>
      )}
    </div>
  );
}
