/**
 * analyticsService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for M10: Dashboard & Analytics Module.
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
  DashboardPeriodFilter,
} from '../types/analytics.types';
import {
  MOCK_SYSTEM_KPIS,
  MOCK_MONTHLY_TRENDS,
  MOCK_SALES_FUNNEL,
  MOCK_INSTALLATION_DISTRIBUTION,
  MOCK_SERVICE_DISTRIBUTION,
  MOCK_TECHNICIAN_WORKLOAD,
  MOCK_STOCK_CATEGORIES,
  MOCK_SYSTEM_ALERTS,
  MOCK_RECENT_ACTIVITIES,
} from '../data/mockAnalyticsData';

export const analyticsService = {
  /**
   * Get dynamic aggregated system KPIs.
   */
  async getKPIs(_period: DashboardPeriodFilter = 'all_time'): Promise<SystemKPIs> {
    return { ...MOCK_SYSTEM_KPIS };
  },

  /**
   * Get monthly historical trends (installations, enquiries, finances).
   */
  async getMonthlyTrends(_period: DashboardPeriodFilter = 'all_time'): Promise<MonthlyTrendData[]> {
    return [...MOCK_MONTHLY_TRENDS];
  },

  /**
   * Get Sales & Conversion Funnel.
   */
  async getSalesFunnel(): Promise<FunnelStage[]> {
    return [...MOCK_SALES_FUNNEL];
  },

  /**
   * Get Installation Status Distribution.
   */
  async getInstallationDistribution(): Promise<StatusDistributionItem[]> {
    return [...MOCK_INSTALLATION_DISTRIBUTION];
  },

  /**
   * Get Service Ticket Status Distribution.
   */
  async getServiceDistribution(): Promise<StatusDistributionItem[]> {
    return [...MOCK_SERVICE_DISTRIBUTION];
  },

  /**
   * Get Technician Workload Allocation.
   */
  async getTechnicianWorkload(): Promise<TechnicianWorkloadItem[]> {
    return [...MOCK_TECHNICIAN_WORKLOAD];
  },

  /**
   * Get Inventory Stock by Category.
   */
  async getStockCategories(): Promise<StockCategoryItem[]> {
    return [...MOCK_STOCK_CATEGORIES];
  },

  /**
   * Get Active System Alerts & Warnings.
   */
  async getAlerts(): Promise<SystemAlert[]> {
    return [...MOCK_SYSTEM_ALERTS];
  },

  /**
   * Get Unified Recent Activity Stream.
   */
  async getActivities(): Promise<ActivityEvent[]> {
    return [...MOCK_RECENT_ACTIVITIES];
  },
};

