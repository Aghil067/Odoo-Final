/**
 * WarehouseForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable Warehouse creation and editing form with dynamic storage areas.
 */

import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type {
  Warehouse,
  WarehouseFormData,
  WarehouseStatus,
} from '../types/warehouse.types';

interface WarehouseFormProps {
  initialData?: Warehouse;
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WarehouseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: WarehouseFormProps) {
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: initialData?.name ?? '',
    code: initialData?.code ?? '',
    address: initialData?.address ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? 'Karnataka',
    pincode: initialData?.pincode ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    contactNumber: initialData?.contactNumber ?? '',
    email: initialData?.email ?? '',
    status: initialData?.status ?? 'active',
    storageAreas: initialData?.storageAreas.map((sa) => ({
      name: sa.name,
      code: sa.code,
      description: sa.description,
    })) ?? [
      { name: 'Bay 1 - Heavy Pallets', code: 'B1', description: 'Solar PV modules' },
      { name: 'Bay 2 - Equipment', code: 'B2', description: 'Inverters & batteries' },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Warehouse name is required';
    if (!formData.code.trim()) errs.code = 'Warehouse code is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Contact person is required';
    if (!formData.contactNumber.trim()) errs.contactNumber = 'Contact phone number is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddStorageArea = () => {
    setFormData({
      ...formData,
      storageAreas: [
        ...formData.storageAreas,
        { name: '', code: `SA-${formData.storageAreas.length + 1}`, description: '' },
      ],
    });
  };

  const handleRemoveStorageArea = (index: number) => {
    setFormData({
      ...formData,
      storageAreas: formData.storageAreas.filter((_, i) => i !== index),
    });
  };

  const handleStorageAreaChange = (
    index: number,
    field: 'name' | 'code' | 'description',
    val: string
  ) => {
    const updated = [...formData.storageAreas];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, storageAreas: updated });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Facility Info */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          Warehouse Facility Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Warehouse Name *"
              placeholder="e.g. Central Bengaluru Warehouse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
          </div>

          <div>
            <Input
              label="Facility Code *"
              placeholder="e.g. BLR-MAIN"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              error={errors.code}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Facility Address *"
              placeholder="Plot / Street / Industrial Area"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="City *"
              placeholder="e.g. Bengaluru"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              error={errors.city}
            />
          </div>

          <div>
            <Input
              label="State *"
              placeholder="e.g. Karnataka"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="PIN Code"
              placeholder="e.g. 560058"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>

          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as WarehouseStatus })}
              options={[
                { value: 'active', label: 'Active Operational' },
                { value: 'inactive', label: 'Inactive / Maintenance' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Contact Manager */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          Facility Manager & Dispatch Desk
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Contact Person / Supervisor *"
              placeholder="e.g. Suresh Gowda"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              error={errors.contactPerson}
            />
          </div>

          <div>
            <Input
              label="Contact Phone *"
              placeholder="e.g. +91 98450 11223"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              error={errors.contactNumber}
            />
          </div>

          <div>
            <Input
              label="Email Address"
              placeholder="e.g. warehouse.blr@sunpowersolutions.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Storage Bays / Locations */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">Storage Bays & Sections</h3>
            <p className="text-xs text-slate-500">
              Designate specific zones, shelves, or cages within this facility
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStorageArea}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Bay / Zone
          </Button>
        </div>

        <div className="space-y-3">
          {formData.storageAreas.map((area, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="w-full sm:w-1/3">
                <Input
                  placeholder="Bay / Area Name (e.g. Bay 1)"
                  value={area.name}
                  onChange={(e) => handleStorageAreaChange(idx, 'name', e.target.value)}
                />
              </div>

              <div className="w-full sm:w-1/4">
                <Input
                  placeholder="Code (e.g. B1)"
                  value={area.code}
                  onChange={(e) => handleStorageAreaChange(idx, 'code', e.target.value.toUpperCase())}
                />
              </div>

              <div className="w-full sm:w-1/3">
                <Input
                  placeholder="Storage description (e.g. Solar PV)"
                  value={area.description || ''}
                  onChange={(e) => handleStorageAreaChange(idx, 'description', e.target.value)}
                />
              </div>

              {formData.storageAreas.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStorageArea(idx)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Saving Warehouse...' : initialData ? 'Update Warehouse' : 'Save Warehouse'}
        </Button>
      </div>
    </form>
  );
}

