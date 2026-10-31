/**
 * StockReceiptForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Multi-product Stock Receipt creation form with serial number validation.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Hash, AlertTriangle } from 'lucide-react';
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
  StockReceiptFormData,
  StockReceiptLine,
  ReceiptStatus,
} from '../types/stock.types';

interface StockReceiptFormProps {
  onSubmit: (data: StockReceiptFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockReceiptForm({ onSubmit, onCancel, isLoading }: StockReceiptFormProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [formData, setFormData] = useState<StockReceiptFormData>({
    receiptDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    supplierReference: '',
    destinationWarehouseId: '',
    notes: '',
    lines: [],
    status: 'received',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [prodRes, whRes] = await Promise.all([
        productService.list({ status: 'active', pageSize: 100 }),
        warehouseService.list({ status: 'active' }),
      ]);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
      if (whRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, destinationWarehouseId: whRes.data[0].id }));
      }
    }
    loadData();
  }, []);

  const handleAddLine = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const newLine: Omit<StockReceiptLine, 'id'> = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      quantityReceived: 1,
      unit: prod.uom,
      purchaseCost: prod.purchaseCost,
      lineTotal: prod.purchaseCost,
      trackingMethod: prod.trackingMethod,
      serialNumbers: prod.trackingMethod === 'serial_tracking' ? [] : [],
      remarks: '',
    };

    setFormData({
      ...formData,
      lines: [...formData.lines, newLine],
    });
    setSelectedProductId('');
  };

  const handleRemoveLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    const updated = [...formData.lines];
    const line = updated[index];
    line.quantityReceived = Math.max(1, qty);
    if (line.purchaseCost) {
      line.lineTotal = line.purchaseCost * line.quantityReceived;
    }
    setFormData({ ...formData, lines: updated });
  };

  const handleLineSerialsChange = (index: number, serialsString: string) => {
    const updated = [...formData.lines];
    const serials = serialsString
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    updated[index].serialNumbers = serials;
    setFormData({ ...formData, lines: updated });
  };

  const handleGenerateSampleSerials = (index: number) => {
    const line = formData.lines[index];
    const count = line.quantityReceived;
    const prefix = line.sku.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
    const year = new Date().getFullYear();
    const generated: string[] = [];
    for (let i = 1; i <= count; i++) {
      generated.push(`${prefix}-${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`);
    }
    const updated = [...formData.lines];
    updated[index].serialNumbers = generated;
    setFormData({ ...formData, lines: updated });
  };

  const validate = (): boolean => {
    if (!formData.supplierName.trim()) {
      setErrors('Supplier Name is required.');
      return false;
    }
    if (!formData.destinationWarehouseId) {
      setErrors('Destination Warehouse is required.');
      return false;
    }
    if (formData.lines.length === 0) {
      setErrors('Please add at least one product line to receive.');
      return false;
    }

    // Check serial validation for completed/received receipts
    for (let i = 0; i < formData.lines.length; i++) {
      const line = formData.lines[i];
      if (line.trackingMethod === 'serial_tracking') {
        if (line.serialNumbers.length !== line.quantityReceived) {
          setErrors(
            `Line #${i + 1} (${line.productName}) has serial tracking enabled. Expected ${
              line.quantityReceived
            } serial numbers, but ${line.serialNumbers.length} were entered.`
          );
          return false;
        }
      }
    }

    setErrors(null);
    return true;
  };

  const handleSubmit = async (status: ReceiptStatus) => {
    formData.status = status;
    if (!validate()) return;
    await onSubmit(formData);
  };

  const totalCost = formData.lines.reduce(
    (acc, curr) => acc + (curr.lineTotal || (curr.purchaseCost || 0) * curr.quantityReceived),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          Receipt Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Receipt Date *"
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="Supplier Name *"
              placeholder="e.g. Waaree Energies Ltd"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="Supplier Invoice / DC Reference"
              placeholder="e.g. INV-2026-9012"
              value={formData.supplierReference || ''}
              onChange={(e) => setFormData({ ...formData, supplierReference: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <Select
              label="Destination Warehouse *"
              value={formData.destinationWarehouseId}
              onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code}) - ${w.city}`,
              }))}
            />
          </div>

          <div className="sm:col-span-3">
            <Textarea
              label="Consignment Remarks / Notes"
              placeholder="Delivery truck number, gate pass ref, quality inspection findings..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Line Items Builder */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Received Line Items</h3>
            <p className="text-xs text-slate-500">
              Add hardware items received from supplier with optional unit cost and serial allocation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={[
                { value: '', label: 'Select Product to Add...' },
                ...products.map((p) => ({
                  value: p.id,
                  label: `[${p.sku}] ${p.name} (${p.uom})`,
                })),
              ]}
              className="w-72"
            />
            <Button
              type="button"
              onClick={handleAddLine}
              disabled={!selectedProductId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>
        </div>

        {formData.lines.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No products added yet. Select a product above to add a line item.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.lines.map((line, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{line.productName}</span>
                      <span className="text-xs font-mono text-slate-500 ml-2">SKU: {line.sku}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1 self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Quantity Received ({line.unit}) *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantityReceived}
                      onChange={(e) => handleLineQtyChange(idx, Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Purchase Cost (₹/unit)
                    </label>
                    <Input
                      type="number"
                      value={line.purchaseCost ?? ''}
                      onChange={(e) => {
                        const updated = [...formData.lines];
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updated[idx].purchaseCost = val;
                        updated[idx].lineTotal = val ? val * updated[idx].quantityReceived : undefined;
                        setFormData({ ...formData, lines: updated });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Line Total</label>
                    <div className="h-9 px-3 flex items-center bg-white border border-slate-200 rounded text-slate-800 font-semibold font-mono text-xs">
                      ₹{(line.lineTotal || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Remarks</label>
                    <Input
                      placeholder="Lot # / Batch"
                      value={line.remarks || ''}
                      onChange={(e) => {
                        const updated = [...formData.lines];
                        updated[idx].remarks = e.target.value;
                        setFormData({ ...formData, lines: updated });
                      }}
                    />
                  </div>
                </div>

                {/* Serial Tracking Box */}
                {line.trackingMethod === 'serial_tracking' && (
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                        <Hash className="w-3.5 h-3.5 text-purple-700" />
                        <span>
                          Serial Numbers Required: {line.serialNumbers.length} /{' '}
                          {line.quantityReceived}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateSampleSerials(idx)}
                        className="text-[11px] text-purple-700 hover:text-purple-900 underline font-medium"
                      >
                        Auto-generate demo serials
                      </button>
                    </div>

                    <Textarea
                      placeholder="Paste or enter serial numbers separated by commas or newlines..."
                      value={line.serialNumbers.join('\n')}
                      onChange={(e) => handleLineSerialsChange(idx, e.target.value)}
                      rows={2}
                      className="text-xs font-mono"
                    />

                    {line.serialNumbers.length !== line.quantityReceived && (
                      <p className="text-[11px] text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Enter exactly {line.quantityReceived} unique serials for full receipt.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-sm">
              <span className="font-semibold text-emerald-900">
                Total Line Items: {formData.lines.length} ({formData.lines.reduce((a, b) => a + b.quantityReceived, 0)} units)
              </span>
              <span className="text-base font-bold text-emerald-950 font-mono">
                Total Valuation: ₹{totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Card>

      {errors && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errors}</span>
        </div>
      )}

      {/* Form Action Controls */}
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
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('received')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Processing Receipt...' : 'Confirm Stock Receipt'}
        </Button>
      </div>
    </div>
  );
}
