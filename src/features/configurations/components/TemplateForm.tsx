/**
 * TemplateForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Create / Edit System Template Form with dynamic component selector and quantity editor.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { componentService } from '../services/componentService';
import type { SystemComponent } from '../types/component.types';
import type {
  SystemTemplate,
  TemplateFormData,
  TemplateComponentItem,
  PhaseType,
  TemplateStatus,
} from '../types/template.types';
import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';
import {
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
} from '../../crm/types/enquiry.types';
import { PHASE_TYPE_LABELS } from '../types/template.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

interface TemplateFormProps {
  initialData?: SystemTemplate;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateForm({ initialData, onSubmit, onCancel, isLoading }: TemplateFormProps) {
  const [catalogueComponents, setCatalogueComponents] = useState<SystemComponent[]>([]);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState('');

  const [formData, setFormData] = useState<TemplateFormData>({
    templateName: initialData?.templateName ?? '',
    templateCode: initialData?.templateCode ?? '',
    description: initialData?.description ?? '',
    systemType: initialData?.systemType ?? 'on_grid',
    ratedCapacity: initialData?.ratedCapacity ?? '3kw',
    customCapacity: initialData?.customCapacity ?? '',
    phaseType: initialData?.phaseType ?? 'single_phase',
    status: initialData?.status ?? 'active',
    components: initialData?.components ?? [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    componentService.list({ pageSize: 100, status: 'active' }).then((res) => {
      setCatalogueComponents(res.data);
    });
  }, []);

  const handleAddComponent = () => {
    if (!selectedCatalogueId) return;
    const comp = catalogueComponents.find((c) => c.id === selectedCatalogueId);
    if (!comp) return;

    const newItem: TemplateComponentItem = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      componentId: comp.id,
      name: comp.name,
      category: comp.category,
      modelNumber: comp.modelNumber,
      specification: comp.specification,
      quantity: 1,
      unit: comp.unit,
      estimatedUnitCost: comp.estimatedUnitCost,
    };

    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, newItem],
    }));
    setSelectedCatalogueId('');
  };

  const handleRemoveComponent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id),
    }));
  };

  const handleQuantityChange = (id: string, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, qty) } : c)),
    }));
  };

  const handleRemarksChange = (id: string, remarks: string) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, remarks } : c)),
    }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const list = [...formData.components];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setFormData((prev) => ({ ...prev, components: list }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.templateName.trim()) errs.templateName = 'Template name is required';
    if (!formData.templateCode.trim()) errs.templateCode = 'Template code is required';
    if (formData.components.length === 0) errs.components = 'Please add at least one component to the template';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const totalCost = formData.components.reduce(
    (acc, curr) => acc + (curr.estimatedUnitCost || 0) * curr.quantity,
    0
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ─── A. Basic Information ───────────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          A. Template Basic Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Template Name"
            required
            placeholder="e.g. 3 kW On-grid Standard Rooftop System"
            value={formData.templateName}
            error={errors.templateName}
            onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
          />

          <Input
            label="Template Code"
            required
            placeholder="e.g. ONG-3KW-STD"
            value={formData.templateCode}
            error={errors.templateCode}
            onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
          />

          <Select
            label="System Type"
            options={Object.entries(SYSTEM_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.systemType}
            onChange={(e) => setFormData({ ...formData, systemType: e.target.value as SystemType })}
          />

          <Select
            label="Rated Capacity"
            options={Object.entries(CAPACITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.ratedCapacity}
            onChange={(e) =>
              setFormData({ ...formData, ratedCapacity: e.target.value as CapacityOption })
            }
          />

          <Select
            label="Phase Connection"
            options={Object.entries(PHASE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.phaseType}
            onChange={(e) => setFormData({ ...formData, phaseType: e.target.value as PhaseType })}
          />

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as TemplateStatus })
            }
          />

          <div className="md:col-span-2">
            <Textarea
              label="Description & Design Notes"
              placeholder="Recommended consumer category, roof suitability, warranty assumptions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* ─── B. Component Composition ───────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">B. Standard Component Composition</h3>
            <p className="text-xs text-slate-500">
              Select products from the catalogue and assign default quantities.
            </p>
          </div>

          {/* Add Component Bar */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCatalogueId}
              onChange={(e) => setSelectedCatalogueId(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg max-w-xs bg-white text-slate-700"
            >
              <option value="">-- Add Catalogue Component --</option>
              {catalogueComponents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({COMPONENT_CATEGORY_LABELS[c.category]})
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={!selectedCatalogueId}
              onClick={handleAddComponent}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>
        </div>

        {errors.components && (
          <p className="text-xs text-red-600 mb-3" role="alert">
            {errors.components}
          </p>
        )}

        {formData.components.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            No components added to this template yet. Select a product from the dropdown above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Component / Model</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 w-28">Quantity</th>
                  <th className="py-2.5 px-3">Est. Unit Price</th>
                  <th className="py-2.5 px-3">Line Total</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {formData.components.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.specification}</span>
                    </td>
                    <td className="py-2 px-3">{COMPONENT_CATEGORY_LABELS[item.category]}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-center"
                        />
                        <span className="text-slate-400 text-[11px]">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {item.estimatedUnitCost ? `₹${item.estimatedUnitCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                      {item.estimatedUnitCost
                        ? `₹${(item.estimatedUnitCost * item.quantity).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Orientation notes"
                        value={item.remarks ?? ''}
                        onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-600"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === formData.components.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── C. Summary Banner ──────────────────────────────────── */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">System Overview</span>
            <span className="text-sm font-bold text-slate-800">
              {CAPACITY_LABELS[formData.ratedCapacity]} • {SYSTEM_TYPE_LABELS[formData.systemType]} (
              {PHASE_TYPE_LABELS[formData.phaseType]})
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 block">Total Component Types</span>
              <span className="text-sm font-bold text-slate-800">{formData.components.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Est. Material Cost</span>
              <span className="text-base font-bold text-green-700">₹{totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update System Template' : 'Save System Template'}
        </Button>
      </div>
    </form>
  );
}

