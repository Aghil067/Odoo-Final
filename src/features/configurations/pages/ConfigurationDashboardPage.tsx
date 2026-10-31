/**
 * ConfigurationDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Overview dashboard for M03: Solar Configuration.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Sliders,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { configurationService } from '../services/configurationService';
import { templateService } from '../services/templateService';
import type { SolarConfiguration } from '../types/configuration.types';
import type { SystemTemplate } from '../types/template.types';
import {
  CONFIGURATION_STATUS_LABELS,
  CONFIGURATION_STATUS_COLOURS,
  SYSTEM_TYPE_COLOURS,
} from '../types/configuration.types';
import { SYSTEM_TYPE_LABELS } from '../../crm/types/enquiry.types';

export function ConfigurationDashboardPage() {
  const [stats, setStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    totalConfigurations: 0,
    draftConfigurations: 0,
    readyForQuotation: 0,
    byType: { on_grid: 0, off_grid: 0 },
  });

  const [recentConfigs, setRecentConfigs] = useState<SolarConfiguration[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<SystemTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [dashboardStats, configRes, templateRes] = await Promise.all([
          configurationService.getDashboardStats(),
          configurationService.list(),
          templateService.list({ status: 'active' }),
        ]);

        setStats(dashboardStats);
        setRecentConfigs(configRes.data.slice(0, 5));
        setFeaturedTemplates(templateRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load configuration dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Solar Configuration</h1>
          <p className="text-sm text-slate-500">
            System templates, component catalogue, and Bill of Materials (BOM) generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/configurations/components">
            <Button variant="outline" size="sm">
              <Cpu className="w-4 h-4 mr-1.5" />
              Components
            </Button>
          </Link>
          <Link to="/configurations/templates">
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-1.5" />
              Templates
            </Button>
          </Link>
          <PermissionGuard module="solar_configuration" require="full">
            <Link to="/configurations/new">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                New Configuration
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Configurations
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {isLoading ? '...' : stats.totalConfigurations}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Ready for Quotation
            </p>
            <p className="text-2xl font-bold text-emerald-700">
              {isLoading ? '...' : stats.readyForQuotation}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Templates
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {isLoading ? '...' : `${stats.activeTemplates} / ${stats.totalTemplates}`}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Grid vs Off-Grid
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {isLoading ? '...' : `${stats.byType.on_grid} On-Grid · ${stats.byType.off_grid} Off-Grid`}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Configurations & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Recent Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recent Configurations</h2>
                <p className="text-xs text-slate-500">
                  Custom engineered systems based on approved site surveys
                </p>
              </div>
              <Link to="/configurations/list">
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading configurations...</div>
            ) : recentConfigs.length === 0 ? (
              <div className="py-8 text-center">
                <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No configurations created yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Create a new configuration using an approved site survey.
                </p>
                <Link to="/configurations/new" className="inline-block mt-3">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    Start Configuration
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {config.configurationId}
                        </span>
                        <Link
                          to={`/configurations/${config.id}`}
                          className="font-medium text-slate-800 hover:text-amber-600 transition-colors"
                        >
                          {config.configurationName}
                        </Link>
                        <Badge
                          label={CONFIGURATION_STATUS_LABELS[config.status]}
                          className={CONFIGURATION_STATUS_COLOURS[config.status]}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Customer: <strong className="text-slate-700">{config.customerName}</strong></span>
                        <span>Survey: <code className="text-slate-600">{config.surveyRef}</code></span>
                        <span>Capacity: <strong className="text-slate-700">{config.ratedCapacity}</strong></span>
                        <span>Items: <strong className="text-slate-700">{config.totalComponentCount}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/configurations/${config.id}/bom`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          BOM
                        </Button>
                      </Link>
                      <Link to={`/configurations/${config.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1/3): System Templates Quick Access */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <CardHeader
              title="System Templates"
              subtitle="Standard engineering specifications"
              action={
                <Link to="/configurations/templates">
                  <Button variant="ghost" size="sm" className="text-xs text-amber-600 p-0 h-auto">
                    Manage
                  </Button>
                </Link>
              }
            />

            <div className="mt-4 space-y-3">
              {featuredTemplates.map((template) => (
                <Link
                  key={template.id}
                  to={`/configurations/templates/${template.id}`}
                  className="block p-3 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {template.templateCode}
                    </span>
                    <Badge
                      label={SYSTEM_TYPE_LABELS[template.systemType]}
                      className={SYSTEM_TYPE_COLOURS[template.systemType]}
                    />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm mt-2">{template.templateName}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span>{template.ratedCapacity} · {template.phaseType.replace('_', ' ')}</span>
                    <span className="font-medium text-slate-700">{template.components.length} components</span>
                  </div>
                </Link>
              ))}

              <Link to="/configurations/templates/new" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs border-dashed text-slate-600">
                  <PlusCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Create Reusable Template
                </Button>
              </Link>
            </div>
          </Card>

          {/* Technical Workflow Note Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Workflow Guideline</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              Configurations require an <strong>approved site survey</strong>. Once technical sizing and component selection are finalized, generated BOMs serve as the baseline for Module M04 inventory allocation and quotation finalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
