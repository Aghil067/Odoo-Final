/**
 * ComponentForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Create/Edit form for Solar System Components in the catalogue.
 */

import { useState, type FormEvent } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import type {
  SystemComponent,
  ComponentFormData,
  ComponentCategory,
  ComponentStatus,
} from '../types/component.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

interface ComponentFormProps {
  initialData?: SystemComponent;
  onSubmit: (data: ComponentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ComponentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ComponentFormProps) {
  const [formData, setFormData] = useState<ComponentFormData>({
    name: initialData?.name ?? '',
    category: initialData?.category ?? 'solar_panels',
    manufacturer: initialData?.manufacturer ?? '',
    modelNumber: initialData?.modelNumber ?? '',
    specification: initialData?.specification ?? '',
    unit: initialData?.unit ?? 'Nos',
    description: initialData?.description ?? '',
    estimatedUnitCost: initialData?.estimatedUnitCost ?? undefined,
    status: initialData?.status ?? 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Component name is required';
    if (!formData.manufacturer.trim()) errs.manufacturer = 'Manufacturer is required';
    if (!formData.modelNumber.trim()) errs.modelNumber = 'Model number is required';
    if (!formData.specification.trim()) errs.specification = 'Technical specification is required';
    if (!formData.unit.trim()) errs.unit = 'Unit of measurement is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const categoryOptions = Object.entries(COMPONENT_CATEGORY_LABELS).map(([k, v]) => ({
    value: k,
    label: v,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">
          {initialData ? 'Edit Component Definition' : 'Register New System Component'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Component Name"
              required
              placeholder="e.g. Mono PERC Bifacial Solar Panel 550W"
              value={formData.name}
              error={errors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <Select
            label="Category"
            options={categoryOptions}
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as ComponentCategory })
            }
          />

          <Input
            label="Manufacturer / Brand"
            required
            placeholder="e.g. Waaree, Growatt, Polycab"
            value={formData.manufacturer}
            error={errors.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          />

          <Input
            label="Model Number / Code"
            required
            placeholder="e.g. WAR-550-BIF"
            value={formData.modelNumber}
            error={errors.modelNumber}
            onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
          />

          <Input
            label="Technical Specifications"
            required
            placeholder="e.g. 550 Wp, 24V, 144 Half-cut Cell"
            value={formData.specification}
            error={errors.specification}
            onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
          />

          <Input
            label="Unit of Measurement"
            required
            placeholder="e.g. Nos, Meters, Sets, Rolls"
            value={formData.unit}
            error={errors.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />

          <Input
            label="Estimated Unit Price (₹)"
            type="number"
            placeholder="e.g. 11500"
            value={formData.estimatedUnitCost ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedUnitCost: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as ComponentStatus })
            }
          />

          <div className="md:col-span-2">
            <Textarea
              label="Description / Technical Notes"
              placeholder="Additional engineering details, warranty info, or certifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Component' : 'Save Component'}
          </Button>
        </div>
      </Card>
    </form>
  );
}

