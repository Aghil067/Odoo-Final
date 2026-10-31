/**
 * StockIssueForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Outgoing Stock Issue form with serial selection and available stock validation.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Hash, CheckSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { stockService } from '../services/stockService';
import { serialNumberService } from '../services/serialNumberService';
import type { InventoryProduct } from '../types/product.types';
import type { Warehouse } from '../types/warehouse.types';
import type { StockBalance } from '../types/stock.types';
import type {
  StockIssueFormData,
  StockIssueLine,
  IssuePurpose,
  IssueStatus,
} from '../types/stock.types';
import { ISSUE_PURPOSE_LABELS } from '../types/stock.types';

interface StockIssueFormProps {
  onSubmit: (data: StockIssueFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockIssueForm({ onSubmit, onCancel, isLoading }: StockIssueFormProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);
  const [availableSerialsMap, setAvailableSerialsMap] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<StockIssueFormData>({
    issueDate: new Date().toISOString().split('T')[0],
    sourceWarehouseId: '',
    purpose: 'installation',
    referenceType: 'installation_order',
    referenceId: 'INS-2026-001',
    issuedTo: 'Ramesh Patel (Technician)',
    notes: '',
    lines: [],
    status: 'issued',
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
        setFormData((prev) => ({ ...prev, sourceWarehouseId: whRes.data[0].id }));
      }
    }
    loadAux();
  }, []);

  // Fetch available serial numbers when source warehouse or line products change
  useEffect(() => {
    async function loadSerials() {
      if (!formData.sourceWarehouseId) return;
      const serialMap: Record<string, string[]> = {};
      for (const line of formData.lines) {
        if (line.trackingMethod === 'serial_tracking') {
          const serials = await serialNumberService.getAvailableSerialsForProduct(
            line.productId,
            formData.sourceWarehouseId
          );
          serialMap[line.productId] = serials;
        }
      }
      setAvailableSerialsMap(serialMap);
    }
    loadSerials();
  }, [formData.sourceWarehouseId, formData.lines.length]);

  const handleAddLine = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check stock balance in selected warehouse
    const balance = stockBalances.find(
      (b) => b.productId === prod.id && b.warehouseId === formData.sourceWarehouseId
    );
    const availableQuantity = balance?.availableQuantity ?? 0;

    const newLine: Omit<StockIssueLine, 'id'> = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      availableQuantity,
      quantityToIssue: 1,
      unit: prod.uom,
      trackingMethod: prod.trackingMethod,
      selectedSerialNumbers: [],
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
    line.quantityToIssue = Math.max(1, qty);
    setFormData({ ...formData, lines: updated });
  };

  const handleToggleSerial = (lineIndex: number, serial: string) => {
    const updated = [...formData.lines];
    const line = updated[lineIndex];
    if (line.selectedSerialNumbers.includes(serial)) {
      line.selectedSerialNumbers = line.selectedSerialNumbers.filter((s) => s !== serial);
    } else {
      if (line.selectedSerialNumbers.length >= line.quantityToIssue) {
        return; // Already matched required quantity
      }
      line.selectedSerialNumbers.push(serial);
    }
    setFormData({ ...formData, lines: updated });
  };

  const validate = (): boolean => {
    if (!formData.sourceWarehouseId) {
      setErrors('Source warehouse is required.');
      return false;
    }
    if (!formData.issuedTo.trim()) {
      setErrors('Issued To field (technician, customer, or department) is required.');
      return false;
    }
    if (formData.lines.length === 0) {
      setErrors('Please add at least one line item to issue.');
      return false;
    }

    for (let i = 0; i < formData.lines.length; i++) {
      const line = formData.lines[i];
      if (line.quantityToIssue > line.availableQuantity) {
        setErrors(
          `Line #${i + 1} (${line.productName}) requests ${line.quantityToIssue} units, but only ${
            line.availableQuantity
          } are available in this warehouse.`
        );
        return false;
      }
      if (line.trackingMethod === 'serial_tracking') {
        if (line.selectedSerialNumbers.length !== line.quantityToIssue) {
          setErrors(
            `Line #${i + 1} (${line.productName}) requires ${line.quantityToIssue} serial number(s) to be selected, but ${
              line.selectedSerialNumbers.length
            } selected.`
          );
          return false;
        }
      }
    }

    setErrors(null);
    return true;
  };

  const handleSubmit = async (status: IssueStatus) => {
    formData.status = status;
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          Dispatch & Issue Context
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Issue Date *"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
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
              label="Issue Purpose *"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value as IssuePurpose })}
              options={Object.entries(ISSUE_PURPOSE_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>

          <div>
            <Select
              label="Reference Document Type"
              value={formData.referenceType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  referenceType: e.target.value as 'installation_order' | 'service_ticket' | 'manual' | 'other',
                })
              }
              options={[
                { value: 'installation_order', label: 'Installation Order (BOM / Project)' },
                { value: 'service_ticket', label: 'Service / Warranty Ticket' },
                { value: 'manual', label: 'Manual Request' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Reference ID / Work Order #"
              placeholder="e.g. INS-2026-001 or SRV-104"
              value={formData.referenceId || ''}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="Issued To (Technician / Site) *"
              placeholder="e.g. Ramesh Patel (Lead Tech) / Rajesh Kumar"
              value={formData.issuedTo}
              onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <Textarea
              label="Issue Notes / Gate Pass Info"
              placeholder="Vehicle dispatch notes, installation kit packaging checklist..."
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
            <h3 className="text-base font-bold text-slate-800">Dispatch Line Items</h3>
            <p className="text-xs text-slate-500">
              Verify warehouse availability and select registered serial numbers for tracked equipment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={[
                { value: '', label: 'Select Product to Issue...' },
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
              Add Product
            </Button>
          </div>
        </div>

        {formData.lines.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No products added for issue. Select a product above to add a line item.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.lines.map((line, idx) => {
              const availableSerials = availableSerialsMap[line.productId] || [];
              const isShortage = line.quantityToIssue > line.availableQuantity;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isShortage
                      ? 'bg-red-50/50 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
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

                    <div className="flex items-center gap-4">
                      <div className="text-xs text-right">
                        <span className="text-slate-400 block">Warehouse Stock</span>
                        <span
                          className={`font-bold ${
                            line.availableQuantity > 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {line.availableQuantity} {line.unit} available
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-500 hover:text-red-700 p-1 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Quantity to Issue ({line.unit}) *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={line.quantityToIssue}
                        onChange={(e) => handleLineQtyChange(idx, Number(e.target.value))}
                        error={isShortage ? 'Exceeds stock in warehouse' : undefined}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">Line Remarks</label>
                      <Input
                        placeholder="e.g. For Inverter DC String 1"
                        value={line.remarks || ''}
                        onChange={(e) => {
                          const updated = [...formData.lines];
                          updated[idx].remarks = e.target.value;
                          setFormData({ ...formData, lines: updated });
                        }}
                      />
                    </div>
                  </div>

                  {/* Serial Number Selection for Serial-tracked Items */}
                  {line.trackingMethod === 'serial_tracking' && (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-purple-700" />
                          <span>
                            Select Serials ({line.selectedSerialNumbers.length} / {line.quantityToIssue})
                          </span>
                        </div>
                        <span className="text-[11px] text-purple-600">
                          {availableSerials.length} units available in this facility
                        </span>
                      </div>

                      {availableSerials.length === 0 ? (
                        <p className="text-xs text-amber-700 italic">
                          No serial numbers currently available in {formData.sourceWarehouseId}. Stock may need to be received or transferred first.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {availableSerials.map((sn) => {
                            const isSelected = line.selectedSerialNumbers.includes(sn);
                            return (
                              <button
                                key={sn}
                                type="button"
                                onClick={() => handleToggleSerial(idx, sn)}
                                className={`px-2.5 py-1 rounded text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white border-purple-700'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                                }`}
                              >
                                <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                {sn}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {errors && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errors}</span>
        </div>
      )}

      {/* Action Controls */}
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
          onClick={() => handleSubmit('issued')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Issuing Hardware...' : 'Confirm Stock Issue'}
        </Button>
      </div>
    </div>
  );
}

