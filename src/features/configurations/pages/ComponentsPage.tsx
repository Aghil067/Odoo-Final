/**
 * ComponentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * System Components Catalogue Manager.
 */

import { useEffect, useState } from 'react';
import {
  Cpu,
  Search,
  PlusCircle,
  Filter,
  Edit2,
  CheckCircle,
  PowerOff,
  X,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { componentService } from '../services/componentService';
import { ComponentForm } from '../components/ComponentForm';
import type {
  SystemComponent,
  ComponentCategory,
  ComponentStatus,
  ComponentFormData,
} from '../types/component.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

export function ComponentsPage() {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ComponentCategory | ''>('');
  const [status, setStatus] = useState<ComponentStatus | ''>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SystemComponent | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await componentService.list({
        search,
        category: category || undefined,
        status: status || undefined,
        pageSize: 50,
      });
      setComponents(res.data);
    } catch (err) {
      console.error('Failed to load components', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category, status]);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await componentService.toggleStatus(id);
      setComponents((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleSaveComponent = async (data: ComponentFormData) => {
    try {
      setIsSubmitting(true);
      if (editingComponent) {
        const updated = await componentService.update(editingComponent.id, data);
        setComponents((prev) => prev.map((c) => (c.id === editingComponent.id ? updated : c)));
      } else {
        const created = await componentService.create(data);
        setComponents((prev) => [created, ...prev]);
      }
      setShowModal(false);
      setEditingComponent(undefined);
    } catch (err) {
      console.error('Failed to save component', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingComponent(undefined);
    setShowModal(true);
  };

  const openEditModal = (comp: SystemComponent) => {
    setEditingComponent(comp);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Component Catalogue</h1>
          <p className="text-sm text-slate-500">
            Hardware catalogue of panels, inverters, structures, protection gear, and accessories.
          </p>
        </div>

        <PermissionGuard module="solar_configuration" require="full">
          <Button
            onClick={openCreateModal}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Component
          </Button>
        </PermissionGuard>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by code, component name, manufacturer, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComponentCategory | '')}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'solar_panels', label: 'Solar Panels' },
                { value: 'inverter', label: 'Inverters' },
                { value: 'battery', label: 'Battery Storage' },
                { value: 'charge_controller', label: 'Charge Controllers' },
                { value: 'mounting_structure', label: 'Mounting Structures' },
                { value: 'dc_cables', label: 'DC Cables' },
                { value: 'ac_cables', label: 'AC Cables' },
                { value: 'dc_protection', label: 'DC Protection (DCDB)' },
                { value: 'ac_protection', label: 'AC Protection (ACDB)' },
                { value: 'earthing_equipment', label: 'Earthing & Lightning' },
                { value: 'monitoring_device', label: 'Monitoring Devices' },
                { value: 'accessories', label: 'Accessories' },
              ]}
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComponentStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Components Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading components...</div>
        ) : components.length === 0 ? (
          <div className="py-16 text-center">
            <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No components found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || category || status
                ? 'Try adjusting your search criteria.'
                : 'Get started by registering system components in the engineering catalogue.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ref / ID</th>
                  <th className="px-5 py-3.5">Component & Specification</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Manufacturer & Model</th>
                  <th className="px-5 py-3.5 text-center">Unit</th>
                  <th className="px-5 py-3.5 text-right">Est. Unit Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                      {comp.componentId}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{comp.name}</div>
                      {comp.specification && (
                        <div className="text-xs text-slate-500 mt-0.5">{comp.specification}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {COMPONENT_CATEGORY_LABELS[comp.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="font-medium text-slate-800">{comp.manufacturer}</div>
                      {comp.modelNumber && (
                        <div className="text-slate-400 font-mono">{comp.modelNumber}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center text-xs font-semibold text-slate-700">
                      {comp.unit}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs font-semibold text-slate-800">
                      {comp.estimatedUnitCost
                        ? `₹${comp.estimatedUnitCost.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={comp.status}
                        className={
                          comp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PermissionGuard module="solar_configuration" require="full">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(comp)}
                            className="h-8 text-xs text-slate-600 hover:text-amber-600"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(comp.id)}
                            className="h-8 text-xs text-slate-500"
                          >
                            {comp.status === 'active' ? (
                              <PowerOff className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </Button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingComponent ? 'Edit System Component' : 'Add System Component'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ComponentForm
              initialData={editingComponent}
              onSubmit={handleSaveComponent}
              onCancel={() => setShowModal(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
