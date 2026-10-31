/**
 * ProductForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable product creation and editing form.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { warehouseService } from '../services/warehouseService';
import { componentService } from '../../configurations/services/componentService';
import type { Warehouse } from '../types/warehouse.types';
import type { SystemComponent } from '../../configurations/types/component.types';
import type {
  InventoryProduct,
  ProductFormData,
  ProductCategory,
  TrackingMethod,
  ProductStatus,
} from '../types/product.types';
import {
  PRODUCT_CATEGORY_LABELS,
  TRACKING_METHOD_LABELS,
} from '../types/product.types';

interface ProductFormProps {
  initialData?: InventoryProduct;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [m03Components, setM03Components] = useState<SystemComponent[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name ?? '',
    sku: initialData?.sku ?? '',
    category: initialData?.category ?? 'solar_panels',
    manufacturer: initialData?.manufacturer ?? '',
    modelNumber: initialData?.modelNumber ?? '',
    description: initialData?.description ?? '',
    uom: initialData?.uom ?? 'Nos',
    trackingMethod: initialData?.trackingMethod ?? 'no_tracking',
    minimumStockLevel: initialData?.minimumStockLevel ?? 10,
    reorderQuantity: initialData?.reorderQuantity ?? 30,
    defaultWarehouseId: initialData?.defaultWarehouseId ?? '',
    purchaseCost: initialData?.purchaseCost ?? undefined,
    sellingPrice: initialData?.sellingPrice ?? undefined,
    taxRatePercent: initialData?.taxRatePercent ?? 18,
    specs: {
      ratedPower: initialData?.specs?.ratedPower ?? '',
      voltage: initialData?.specs?.voltage ?? '',
      current: initialData?.specs?.current ?? '',
      capacity: initialData?.specs?.capacity ?? '',
      dimensions: initialData?.specs?.dimensions ?? '',
      weight: initialData?.specs?.weight ?? '',
      efficiency: initialData?.specs?.efficiency ?? '',
      warrantyYears: initialData?.specs?.warrantyYears ?? undefined,
      additionalSpecs: initialData?.specs?.additionalSpecs ?? '',
    },
    compatibleComponentId: initialData?.compatibleComponentId ?? '',
    status: initialData?.status ?? 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadAux() {
      try {
        const [whRes, compRes] = await Promise.all([
          warehouseService.list({ status: 'active' }),
          componentService.list({ pageSize: 50 }),
        ]);
        setWarehouses(whRes.data);
        setM03Components(compRes.data);
      } catch (err) {
        console.error('Failed to load auxiliary options', err);
      }
    }
    loadAux();
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU / Product Code is required';
    if (!formData.manufacturer.trim()) errs.manufacturer = 'Manufacturer is required';
    if (!formData.modelNumber.trim()) errs.modelNumber = 'Model number is required';
    if (formData.minimumStockLevel < 0) errs.minimumStockLevel = 'Min stock cannot be negative';
    if (formData.reorderQuantity <= 0) errs.reorderQuantity = 'Reorder quantity must be > 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Basic Information */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          1. Basic Product Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Product Name *"
              placeholder="e.g. Waaree Mono PERC Bifacial Solar Panel 550W"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
          </div>

          <div>
            <Input
              label="SKU / Product Code *"
              placeholder="e.g. WAA-550-BIF"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              error={errors.sku}
            />
          </div>

          <div>
            <Select
              label="Product Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
              options={Object.entries(PRODUCT_CATEGORY_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>

          <div>
            <Input
              label="Manufacturer / Brand *"
              placeholder="e.g. Waaree Energies"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              error={errors.manufacturer}
            />
          </div>

          <div>
            <Input
              label="Model Number *"
              placeholder="e.g. WAR-550-BIF"
              value={formData.modelNumber}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              error={errors.modelNumber}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Product Description"
              placeholder="Detailed commercial description, packaging notes, cell specs..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* 2. Technical Sizing & Specs */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">2. Technical Specifications</h3>
          <p className="text-xs text-slate-500">
            Electrical and mechanical attributes used for engineering compatibility
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Rated Power"
              placeholder="e.g. 550 Wp or 5 kW"
              value={formData.specs.ratedPower}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, ratedPower: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Operating Voltage"
              placeholder="e.g. 41.95 Vmp / 230V AC"
              value={formData.specs.voltage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, voltage: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Rated Current"
              placeholder="e.g. 13.12 A / 21.7 A"
              value={formData.specs.current}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, current: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Capacity / Storage"
              placeholder="e.g. 4.8 kWh / 100Ah"
              value={formData.specs.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, capacity: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Dimensions"
              placeholder="e.g. 2278 x 1134 x 35 mm"
              value={formData.specs.dimensions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, dimensions: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Weight"
              placeholder="e.g. 28.5 kg"
              value={formData.specs.weight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, weight: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Input
              label="Warranty (Years)"
              type="number"
              placeholder="e.g. 25"
              value={formData.specs.warrantyYears ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: {
                    ...formData.specs,
                    warrantyYears: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Additional Notes / Standards"
              placeholder="e.g. IEC 61215, IP68 water resistant"
              value={formData.specs.additionalSpecs}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specs: { ...formData.specs, additionalSpecs: e.target.value },
                })
              }
            />
          </div>
        </div>
      </Card>

      {/* 3. Inventory & Warehouse Controls */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">3. Inventory & Tracking Rules</h3>
          <p className="text-xs text-slate-500">
            Stock control thresholds and equipment serialization method
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label="Tracking Method *"
              value={formData.trackingMethod}
              onChange={(e) =>
                setFormData({ ...formData, trackingMethod: e.target.value as TrackingMethod })
              }
              options={Object.entries(TRACKING_METHOD_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>

          <div>
            <Select
              label="Unit of Measure (UOM) *"
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              options={[
                { value: 'Nos', label: 'Nos (Units / Pieces)' },
                { value: 'Meters', label: 'Meters (Cable length)' },
                { value: 'Sets', label: 'Sets (Mounting kit)' },
                { value: 'Pairs', label: 'Pairs (MC4 Connectors)' },
                { value: 'Rolls', label: 'Rolls' },
                { value: 'Boxes', label: 'Boxes' },
              ]}
            />
          </div>

          <div>
            <Select
              label="Default Warehouse"
              value={formData.defaultWarehouseId || ''}
              onChange={(e) => setFormData({ ...formData, defaultWarehouseId: e.target.value })}
              options={[
                { value: '', label: 'Select Default Warehouse' },
                ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
              ]}
            />
          </div>

          <div>
            <Input
              label="Minimum Stock Threshold *"
              type="number"
              value={formData.minimumStockLevel}
              onChange={(e) =>
                setFormData({ ...formData, minimumStockLevel: Number(e.target.value) })
              }
              error={errors.minimumStockLevel}
            />
          </div>

          <div>
            <Input
              label="Recommended Reorder Qty *"
              type="number"
              value={formData.reorderQuantity}
              onChange={(e) =>
                setFormData({ ...formData, reorderQuantity: Number(e.target.value) })
              }
              error={errors.reorderQuantity}
            />
          </div>

          <div>
            <Select
              label="Product Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              options={[
                { value: 'active', label: 'Active (Available for receipts & dispatch)' },
                { value: 'inactive', label: 'Inactive (Archived)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 4. Commercial Baseline & M03 BOM Mapping */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            4. Commercial Pricing & M03 BOM Alignment
          </h3>
          <p className="text-xs text-slate-500">
            Estimated procurement costs and mapping to Module M03 Solar Configuration component definitions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Estimated Purchase Cost (₹)"
              type="number"
              placeholder="e.g. 9800"
              value={formData.purchaseCost ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseCost: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div>
            <Input
              label="Target Selling Price (₹)"
              type="number"
              placeholder="e.g. 11500"
              value={formData.sellingPrice ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sellingPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div>
            <Input
              label="Applicable GST Rate (%)"
              type="number"
              placeholder="e.g. 12 or 18"
              value={formData.taxRatePercent ?? 18}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxRatePercent: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              label="Compatible M03 System Component (BOM Link)"
              value={formData.compatibleComponentId || ''}
              onChange={(e) =>
                setFormData({ ...formData, compatibleComponentId: e.target.value || undefined })
              }
              options={[
                { value: '', label: 'None (Unmapped / General Hardware Supply)' },
                ...m03Components.map((c) => ({
                  value: c.id,
                  label: `[${c.componentId}] ${c.name} (${c.modelNumber || c.manufacturer})`,
                })),
              ]}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Linking allows automated availability cross-referencing when customer BOMs are finalized.
            </p>
          </div>
        </div>
      </Card>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Saving Product...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

