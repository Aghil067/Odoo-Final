/**
 * StockTransferForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Warehouse-to-Warehouse Stock Transfer creation form.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import type { InventoryProduct } from '../types/product.types';
import type { Warehouse } from '../types/warehouse.types';
import type {
  StockTransferFormData,
  StockTransferItem,
  TransferStatus,
} from '../types/stock.types';

interface StockTransferFormProps {
  onSubmit: (data: StockTransferFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockTransferForm({ onSubmit, onCancel, isLoading }: StockTransferFormProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [formData, setFormData] = useState<StockTransferFormData>({
    transferDate: new Date().toISOString().split('T')[0],
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    reason: 'Stock balancing to meet regional project demand',
    notes: '',
    items: [],
    status: 'in_transit',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    async function loadAux() {
      const [prodRes, whRes] = await Promise.all([
        productService.list({ status: 'active', pageSize: 100 }),
        warehouseService.list({ status: 'active' }),
      ]);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
      if (whRes.data.length >= 2) {
        setFormData((prev) => ({
          ...prev,
          sourceWarehouseId: whRes.data[0].id,
          destinationWarehouseId: whRes.data[1].id,
        }));
      }
    }
    loadAux();
  }, []);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const newItem: Omit<StockTransferItem, 'id'> = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: 1,
      unit: prod.uom,
      trackingMethod: prod.trackingMethod,
      selectedSerialNumbers: [],
      remarks: '',
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
    setSelectedProductId('');
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const updated = [...formData.items];
    updated[index].quantity = Math.max(1, qty);
    setFormData({ ...formData, items: updated });
  };

  const validate = (): boolean => {
    if (!formData.sourceWarehouseId) {
      setErrors('Source warehouse is required.');
      return false;
    }
    if (!formData.destinationWarehouseId) {
      setErrors('Destination warehouse is required.');
      return false;
    }
    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      setErrors('Source and Destination warehouse cannot be the same facility.');
      return false;
    }
    if (!formData.reason.trim()) {
      setErrors('Transfer reason is required.');
      return false;
    }
    if (formData.items.length === 0) {
      setErrors('Please add at least one item to transfer.');
      return false;
    }

    setErrors(null);
    return true;
  };

  const handleSubmit = async (status: TransferStatus) => {
    formData.status = status;
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
          Transfer Routing & Logistics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Transfer Date *"
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
            />
          </div>

          <div>
            <Select
              label="Source Warehouse *"
              value={formData.sourceWarehouseId}
              onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
            />
          </div>

          <div>
            <Select
              label="Destination Warehouse *"
              value={formData.destinationWarehouseId}
              onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              label="Transfer Purpose / Reason *"
              placeholder="e.g. Stock balancing for Hyderabad residential projects"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <Textarea
              label="Transit Notes / Logistics Partner"
              placeholder="Carrier docket number, transport driver contact, delivery deadline..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Items to Transfer */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Transfer Manifest</h3>
            <p className="text-xs text-slate-500">
              Select products and quantities dispatched between facilities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={[
                { value: '', label: 'Select Product to Transfer...' },
                ...products.map((p) => ({
                  value: p.id,
                  label: `[${p.sku}] ${p.name}`,
                })),
              ]}
              className="w-72"
            />
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedProductId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </div>

        {formData.items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No transfer items selected. Choose a product above to add to the transfer manifest.
          </div>
        ) : (
          <div className="space-y-3">
            {formData.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 w-full sm:w-1/2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <span className="text-slate-500 font-mono ml-2">[{item.sku}]</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                    />
                  </div>
                  <span className="text-slate-500 font-medium">{item.unit}</span>

                  <div className="w-48">
                    <Input
                      placeholder="Packaging / crate remarks"
                      value={item.remarks || ''}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[idx].remarks = e.target.value;
                        setFormData({ ...formData, items: updated });
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {errors && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errors}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={isLoading}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('in_transit')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Creating Transfer...' : 'Dispatch Transfer (In Transit)'}
        </Button>
      </div>
    </div>
  );
}

