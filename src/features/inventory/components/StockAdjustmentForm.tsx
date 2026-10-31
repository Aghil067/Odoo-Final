/**
 * StockAdjustmentForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Stock Adjustment form for physical reconciliation and damage write-offs.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Scale } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { stockService } from '../services/stockService';
import type { InventoryProduct } from '../types/product.types';
import type { Warehouse } from '../types/warehouse.types';
import type { StockBalance } from '../types/stock.types';
import type {
  StockAdjustmentFormData,
  StockAdjustmentLine,
  AdjustmentReason,
  AdjustmentStatus,
} from '../types/stock.types';
import { ADJUSTMENT_REASON_LABELS } from '../types/stock.types';

interface StockAdjustmentFormProps {
  onSubmit: (data: StockAdjustmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockAdjustmentForm({
  onSubmit,
  onCancel,
  isLoading,
}: StockAdjustmentFormProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);

  const [formData, setFormData] = useState<StockAdjustmentFormData>({
    warehouseId: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    reason: 'physical_count',
    explanation: '',
    notes: '',
    lines: [],
    status: 'submitted',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    async function loadAux() {
      const [prodRes, whRes, stockRes] = await Promise.all([
        productService.list({ status: 'active', pageSize: 100 }),
        warehouseService.list({ status: 'active' }),
        stockService.getStockOverview(),
      ]);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
      setStockBalances(stockRes.data);
      if (whRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, warehouseId: whRes.data[0].id }));
      }
    }
    loadAux();
  }, []);

  const handleAddLine = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Fetch system quantity recorded for this warehouse
    const balance = stockBalances.find(
      (b) => b.productId === prod.id && b.warehouseId === formData.warehouseId
    );
    const systemQuantity = balance?.totalQuantity ?? 0;

    const newLine: Omit<StockAdjustmentLine, 'id'> = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      systemQuantity,
      physicalCount: systemQuantity,
      difference: 0,
      unit: prod.uom,
      trackingMethod: prod.trackingMethod,
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

  const handlePhysicalCountChange = (index: number, count: number) => {
    const updated = [...formData.lines];
    const line = updated[index];
    line.physicalCount = Math.max(0, count);
    line.difference = line.physicalCount - line.systemQuantity;
    setFormData({ ...formData, lines: updated });
  };

  const validate = (): boolean => {
    if (!formData.warehouseId) {
      setErrors('Warehouse is required.');
      return false;
    }
    if (!formData.explanation.trim()) {
      setErrors('Explanation / Root cause is mandatory for stock adjustment audits.');
      return false;
    }
    if (formData.lines.length === 0) {
      setErrors('Please add at least one line item to reconcile.');
      return false;
    }

    setErrors(null);
    return true;
  };

  const handleSubmit = async (status: AdjustmentStatus) => {
    formData.status = status;
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-600" />
          Adjustment Header & Reason
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Adjustment Date *"
              type="date"
              value={formData.adjustmentDate}
              onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
            />
          </div>

          <div>
            <Select
              label="Target Warehouse *"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
            />
          </div>

          <div>
            <Select
              label="Adjustment Reason *"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value as AdjustmentReason })
              }
              options={Object.entries(ADJUSTMENT_REASON_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              label="Audit Explanation / Justification *"
              placeholder="e.g. Q4 physical warehouse inventory reconciliation variance"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <Textarea
              label="Supporting Notes / Auditor Remarks"
              placeholder="Counter-signed by internal auditor or warehouse supervisor..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Lines reconciliation */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Physical Count Comparison</h3>
            <p className="text-xs text-slate-500">
              Input verified on-hand count; the system calculates the variance automatically
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={[
                { value: '', label: 'Select Product to Reconcile...' },
                ...products.map((p) => ({
                  value: p.id,
                  label: `[${p.sku}] ${p.name}`,
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
              Add Line
            </Button>
          </div>
        </div>

        {formData.lines.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No reconciliation items added. Select a product above to compare recorded vs physical count.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3 text-center">System Recorded</th>
                  <th className="px-4 py-3 text-center">Physical Count</th>
                  <th className="px-4 py-3 text-center">Difference</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{line.productName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{line.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 font-mono">
                      {line.systemQuantity} {line.unit}
                    </td>
                    <td className="px-4 py-3 text-center w-32">
                      <Input
                        type="number"
                        min={0}
                        value={line.physicalCount}
                        onChange={(e) => handlePhysicalCountChange(idx, Number(e.target.value))}
                        className="text-center font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          line.difference > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : line.difference < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {line.difference > 0 ? `+${line.difference}` : line.difference} {line.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        placeholder="e.g. Scratched panel"
                        value={line.remarks || ''}
                        onChange={(e) => {
                          const updated = [...formData.lines];
                          updated[idx].remarks = e.target.value;
                          setFormData({ ...formData, lines: updated });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          onClick={() => handleSubmit('submitted')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Submitting Adjustment...' : 'Submit for Manager Approval'}
        </Button>
      </div>
    </div>
  );
}

