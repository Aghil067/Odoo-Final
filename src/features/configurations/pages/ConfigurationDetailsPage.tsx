/**
 * ConfigurationDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive detail view for a customer solar configuration.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
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
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

export function ConfigurationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<SolarConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await configurationService.getById(id);
      setConfig(res);
    } catch (err) {
      console.error('Failed to load configuration details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: ConfigurationStatus) => {
    if (!config) return;
    try {
      setStatusUpdating(true);
      const updated = await configurationService.updateStatus(config.id, newStatus);
      setConfig(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading configuration details...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Configuration Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested solar configuration does not exist or may have been deleted.
        </p>
        <Link to="/configurations" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Configurations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/configurations">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {config.configurationId}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">{config.configurationName}</h1>
              <Badge
                label={CONFIGURATION_STATUS_LABELS[config.status]}
                className={CONFIGURATION_STATUS_COLOURS[config.status]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {new Date(config.createdAt).toLocaleDateString()}
              {config.templateName && ` · Sourced from template "${config.templateName}"`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/configurations/${config.id}/bom`}>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              View Printable BOM
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Status Controls */}
      <PermissionGuard module="solar_configuration" require="full">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700">Workflow Transitions:</span>
          <div className="flex items-center gap-2">
            {config.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                disabled={statusUpdating}
                onClick={() => handleStatusChange('ready_for_quotation')}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Mark Ready for Quotation
              </Button>
            )}
            {config.status !== 'archived' && (
              <Button
                size="sm"
                variant="ghost"
                disabled={statusUpdating}
                onClick={() => handleStatusChange('archived')}
                className="text-slate-500 hover:text-red-600 h-8"
              >
                Archive Configuration
              </Button>
            )}
          </div>
        </div>
      </PermissionGuard>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Survey Dossier */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <CardHeader
            title="Customer & Site Context"
            subtitle="Linked from approved site survey records"
          />

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Customer</p>
                <Link
                  to={`/crm/customers/${config.customerId}`}
                  className="font-medium text-slate-800 hover:text-amber-600 flex items-center gap-1"
                >
                  {config.customerName}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Installation Site</p>
                <p className="text-slate-700">{config.siteLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Approved Site Survey</p>
                <Link
                  to={`/surveys/${config.surveyId}`}
                  className="font-mono text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {config.surveyRef}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Specifications */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <CardHeader
            title="Technical Parameters"
            subtitle="Engineering sizing and electrical design"
          />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">System Architecture</p>
              <div className="mt-1">
                <Badge
                  label={SYSTEM_TYPE_LABELS[config.systemType]}
                  className={SYSTEM_TYPE_COLOURS[config.systemType]}
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Rated Capacity</p>
              <p className="text-base font-bold text-slate-800 mt-1">{config.ratedCapacity}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Inverter Phase</p>
              <p className="font-medium text-slate-700 mt-1">
                {config.phaseType === 'three_phase' ? 'Three Phase (415V)' : 'Single Phase (230V)'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Panel Wattage</p>
              <p className="font-medium text-slate-700 mt-1">
                {config.recommendedPanelWattage ? `${config.recommendedPanelWattage}W Mono PERC` : 'Standard'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Mounting Type</p>
              <p className="font-medium text-slate-700 mt-1 capitalize">
                {config.mountingType ? config.mountingType.replace('_', ' ') : 'Standard Rooftop'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Tilt / Azimuth</p>
              <p className="font-medium text-slate-700 mt-1">
                {config.tiltAngle || 15}° / {config.azimuth || '180° South'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bill of Materials Breakdown Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bill of Materials (BOM)</h2>
            <p className="text-xs text-slate-500">
              Snapshot of components configured for this installation
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Estimated Cost (Baseline)</span>
            <span className="text-xl font-bold text-slate-800">
              ₹{(config.estimatedTotalCost || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-12 text-center">#</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Component / Model</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Est. Unit (₹)</th>
                <th className="px-5 py-3 text-right">Line Total (₹)</th>
                <th className="px-5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.components.map((item, index) => (
                <tr key={`${item.componentId}-${index}`} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-center text-xs font-mono text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {COMPONENT_CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    {item.modelNumber && (
                      <div className="text-xs font-mono text-slate-400">{item.modelNumber}</div>
                    )}
                    {item.specification && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.specification}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="font-bold text-slate-800">
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">
                    {item.estimatedUnitCost ? `₹${item.estimatedUnitCost.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-slate-800">
                    {item.estimatedLineTotal
                      ? `₹${item.estimatedLineTotal.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {item.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 font-semibold border-t border-slate-200 text-slate-800">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-right">
                  Totals ({config.totalComponentCount} items, {config.totalQuantity} units):
                </td>
                <td className="px-5 py-3 text-center">{config.totalQuantity}</td>
                <td className="px-5 py-3"></td>
                <td className="px-5 py-3 text-right text-base text-amber-700">
                  ₹{(config.estimatedTotalCost || 0).toLocaleString()}
                </td>
                <td className="px-5 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Notes & Activity Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Configuration Notes" subtitle="Engineering remarks & constraints" />
          <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
            {config.notes || 'No special engineering notes provided.'}
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Activity History" subtitle="Audit log of status updates" />
          <div className="space-y-3">
            {config.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-700">{act.description}</p>
                  <p className="text-slate-400">
                    {new Date(act.timestamp).toLocaleString()} · {act.performedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
