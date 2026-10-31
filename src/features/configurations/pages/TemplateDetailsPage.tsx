/**
 * TemplateDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Detailed view of a System Template with component composition.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  PowerOff,
  PlusCircle,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { templateService } from '../services/templateService';
import type { SystemTemplate } from '../types/template.types';
import {
  SYSTEM_TYPE_LABELS,
} from '../../crm/types/enquiry.types';
import { SYSTEM_TYPE_COLOURS } from '../types/configuration.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

export function TemplateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<SystemTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await templateService.getById(id);
      setTemplate(res);
    } catch (err) {
      console.error('Failed to load template', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!template) return;
    try {
      const updated = await templateService.toggleStatus(template.id);
      setTemplate(updated);
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading template specifications...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Template Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested system template does not exist or may have been removed.
        </p>
        <Link to="/configurations/templates" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Templates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/configurations/templates">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded">
                {template.templateCode}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">{template.templateName}</h1>
              <Badge
                label={template.status}
                className={
                  template.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Template Ref: <span className="font-mono">{template.templateId}</span> · Updated{' '}
              {new Date(template.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard module="solar_configuration" require="full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className="text-xs text-slate-600"
            >
              {template.status === 'active' ? (
                <>
                  <PowerOff className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Activate
                </>
              )}
            </Button>

            <Link to="/configurations/new">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Use in Configuration
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Specifications Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-xs font-semibold uppercase">
            System Type
          </span>
          <div className="mt-1">
            <Badge
              label={SYSTEM_TYPE_LABELS[template.systemType]}
              className={SYSTEM_TYPE_COLOURS[template.systemType]}
            />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-xs font-semibold uppercase">
            Rated Capacity
          </span>
          <p className="text-lg font-bold text-slate-800 mt-1">{template.ratedCapacity}</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-xs font-semibold uppercase">
            Inverter Phase
          </span>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {template.phaseType === 'three_phase' ? 'Three Phase (415V)' : 'Single Phase (230V)'}
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-xs font-semibold uppercase">
            Est. Baseline Total
          </span>
          <p className="text-lg font-bold text-amber-700 mt-1">
            ₹{(template.estimatedTotalCost || 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {template.description && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Engineering Scope & Notes
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{template.description}</p>
        </Card>
      )}

      {/* Components Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <CardHeader
            title="Standard Component Sizing"
            subtitle="Components preloaded when selecting this template during customer configuration"
          />
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {template.components.length} components
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-12 text-center">#</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Component / Model</th>
                <th className="px-5 py-3 text-center">Default Qty</th>
                <th className="px-5 py-3 text-right">Est. Unit Cost (₹)</th>
                <th className="px-5 py-3 text-right">Line Total (₹)</th>
                <th className="px-5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {template.components.map((item, index) => {
                const lineTotal = (item.estimatedUnitCost || 0) * item.quantity;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
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
                      {lineTotal ? `₹${lineTotal.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.remarks || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/80 font-semibold border-t border-slate-200 text-slate-800">
              <tr>
                <td colSpan={5} className="px-5 py-3 text-right">
                  Total Estimated Template Baseline:
                </td>
                <td className="px-5 py-3 text-right text-base text-amber-700">
                  ₹{(template.estimatedTotalCost || 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
