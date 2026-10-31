/**
 * ConfigurationsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Configurations listing with search, status filtering, and BOM shortcuts.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  Search,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { configurationService } from '../services/configurationService';
import type {
  SolarConfiguration,
  ConfigurationStatus,
} from '../types/configuration.types';
import {
  CONFIGURATION_STATUS_LABELS,
  CONFIGURATION_STATUS_COLOURS,
  SYSTEM_TYPE_COLOURS,
} from '../types/configuration.types';
import { SYSTEM_TYPE_LABELS } from '../../crm/types/enquiry.types';

export function ConfigurationsPage() {
  const [configurations, setConfigurations] = useState<SolarConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConfigurationStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await configurationService.list({
        search,
        status: statusFilter,
      });
      setConfigurations(res.data);
    } catch (err) {
      console.error('Failed to load configurations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Configurations</h1>
          <p className="text-sm text-slate-500">
            Engineered solar specifications and generated Bills of Materials.
          </p>
        </div>

        <PermissionGuard module="solar_configuration" require="full">
          <Link to="/configurations/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Configuration
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by Configuration ID, Name, or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ConfigurationStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'ready_for_quotation', label: 'Ready for Quotation' },
                { value: 'quotation_generated', label: 'Quotation Generated' },
                { value: 'superseded', label: 'Superseded' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Listing Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading configurations...</div>
        ) : configurations.length === 0 ? (
          <div className="py-12 text-center">
            <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No configurations found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter
                ? 'Try adjusting your search criteria or filter options.'
                : 'Get started by creating your first solar configuration for an approved survey.'}
            </p>
            <PermissionGuard module="solar_configuration" require="full">
              <div className="mt-4">
                <Link to="/configurations/new">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Create Configuration
                  </Button>
                </Link>
              </div>
            </PermissionGuard>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ref / ID</th>
                  <th className="px-5 py-3.5">Configuration Name</th>
                  <th className="px-5 py-3.5">Customer & Survey</th>
                  <th className="px-5 py-3.5">System Specs</th>
                  <th className="px-5 py-3.5 text-center">Components</th>
                  <th className="px-5 py-3.5">Est. Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configurations.map((config) => (
                  <tr key={config.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
                        {config.configurationId}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/configurations/${config.id}`}
                        className="font-semibold text-slate-800 hover:text-amber-600 transition-colors block"
                      >
                        {config.configurationName}
                      </Link>
                      <span className="text-xs text-slate-400">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{config.customerName}</div>
                      <div className="text-xs text-slate-500 font-mono">Survey: {config.surveyRef}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          label={SYSTEM_TYPE_LABELS[config.systemType]}
                          className={SYSTEM_TYPE_COLOURS[config.systemType]}
                        />
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {config.ratedCapacity} · {config.phaseType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
                        {config.totalComponentCount} items ({config.totalQuantity} units)
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        ₹{(config.estimatedTotalCost || 0).toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400">est. baseline</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={CONFIGURATION_STATUS_LABELS[config.status]}
                        className={CONFIGURATION_STATUS_COLOURS[config.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/configurations/${config.id}/bom`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            BOM
                          </Button>
                        </Link>
                        <Link to={`/configurations/${config.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600">
                            View
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
