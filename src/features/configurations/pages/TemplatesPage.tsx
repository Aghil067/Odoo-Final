/**
 * TemplatesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * System Templates catalogue and manager.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  PlusCircle,
  ArrowRight,
  Filter,
  CheckCircle,
  PowerOff,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { templateService } from '../services/templateService';
import type { SystemTemplate, TemplateStatus } from '../types/template.types';
import type { SystemType } from '../../crm/types/enquiry.types';
import { SYSTEM_TYPE_LABELS } from '../../crm/types/enquiry.types';
import { SYSTEM_TYPE_COLOURS } from '../types/configuration.types';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [systemType, setSystemType] = useState<SystemType | ''>('');
  const [status, setStatus] = useState<TemplateStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await templateService.list({
        search,
        systemType: systemType || undefined,
        status: status || undefined,
      });
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, systemType, status]);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await templateService.toggleStatus(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to toggle template status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Templates</h1>
          <p className="text-sm text-slate-500">
            Standard engineering designs and pre-configured component assemblies.
          </p>
        </div>

        <PermissionGuard module="solar_configuration" require="full">
          <Link to="/configurations/templates/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New System Template
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by code, template name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as SystemType | '')}
              options={[
                { value: '', label: 'All System Types' },
                { value: 'on_grid', label: 'On-Grid' },
                { value: 'off_grid', label: 'Off-Grid' },
              ]}
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TemplateStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Listing Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No templates found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || systemType || status
              ? 'Try relaxing your search terms or filters.'
              : 'Create standard templates to expedite component selection during customer configuration.'}
          </p>
          <PermissionGuard module="solar_configuration" require="full">
            <div className="mt-4">
              <Link to="/configurations/templates/new">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Create First Template
                </Button>
              </Link>
            </div>
          </PermissionGuard>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded">
                    {tpl.templateCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      label={SYSTEM_TYPE_LABELS[tpl.systemType]}
                      className={SYSTEM_TYPE_COLOURS[tpl.systemType]}
                    />
                    <Badge
                      label={tpl.status}
                      className={
                        tpl.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">
                    <Link
                      to={`/configurations/templates/${tpl.id}`}
                      className="hover:text-amber-600 transition-colors"
                    >
                      {tpl.templateName}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {tpl.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Capacity
                    </span>
                    <span className="font-bold text-slate-700">{tpl.ratedCapacity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Phase
                    </span>
                    <span className="font-medium text-slate-700">
                      {tpl.phaseType === 'three_phase' ? 'Three Phase' : 'Single Phase'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Components
                    </span>
                    <span className="font-semibold text-slate-700">
                      {tpl.components.length} items
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Est. Baseline
                    </span>
                    <span className="font-semibold text-amber-700">
                      ₹{(tpl.estimatedTotalCost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <PermissionGuard module="solar_configuration" require="full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(tpl.id)}
                    className="h-8 text-xs text-slate-500 hover:text-slate-800"
                  >
                    {tpl.status === 'active' ? (
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
                </PermissionGuard>

                <Link to={`/configurations/templates/${tpl.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
