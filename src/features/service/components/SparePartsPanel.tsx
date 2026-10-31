/**
 * SparePartsPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * Spare parts and replacement hardware panel for Module M08.
 * Integrates directly with M04 Inventory & Warehouse records.
 */

import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SparePartRequirement } from '../types/serviceTask.types';
import { productService } from '../../inventory/services/productService';
import { serialNumberService } from '../../inventory/services/serialNumberService';

interface SparePartsPanelProps {
  spareParts: SparePartRequirement[];
  onRequestPart: (part: SparePartRequirement) => Promise<void>;
  isReadOnly?: boolean;
}

export const SparePartsPanel: React.FC<SparePartsPanelProps> = ({
  spareParts,
  onRequestPart,
  isReadOnly = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [availableSerials, setAvailableSerials] = useState<any[]>([]);

  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedSerial, setSelectedSerial] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [pRes, sRes] = await Promise.all([
          productService.list(),
          serialNumberService.list({ status: 'available' }),
        ]);
        setProducts(pRes.data || []);
        setAvailableSerials(sRes.data || []);
      } catch (err) {
        console.error('Failed to load spare parts options', err);
      }
    }
    loadOptions();
  }, []);

  const handleProductSelect = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProductId(prod.id);
      setProductName(prod.name);
      setSku(prod.sku);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    try {
      setIsSubmitting(true);
      const newPart: SparePartRequirement = {
        id: `sp-${Date.now()}`,
        productId: productId || 'custom-part',
        productName,
        sku: sku || 'SPARE-GENERIC',
        quantityRequired: qty,
        quantityUsed: 0,
        serialNumber: selectedSerial || undefined,
        warehouseName: 'Central Bengaluru Warehouse',
        issueReference: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        remarks,
      };
      await onRequestPart(newPart);
      setShowAddForm(false);
      setProductName('');
      setRemarks('');
      setSelectedSerial('');
    } catch (err) {
      alert('Failed to requisition spare parts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-600" />
            Spare Parts & Replacement Allocation (M04 Inventory)
          </h3>
          <p className="text-xs text-slate-500">
            Requisition parts from warehouse depots. Stock deduction is executed through the backend inventory system.
          </p>
        </div>

        {!isReadOnly && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Requisition Spare Part
          </button>
        )}
      </div>

      {/* Advisory notice */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Inventory Governance Notice:</span> Actual stock balances and stock issues are governed by M04 Inventory. Any serialized equipment allocated must come from verified warehouse stock.
        </p>
      </div>

      {/* Requisition Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-800">Requisition Hardware Component from M04 Warehouse</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Hardware / Spare Part</label>
              <select
                value={productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity Required</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Available Serial (if serialized)</label>
              <select
                value={selectedSerial}
                onChange={(e) => setSelectedSerial(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
              >
                <option value="">-- Select Serial (Optional) --</option>
                {availableSerials.map((s) => (
                  <option key={s.id} value={s.serialNumber}>
                    {s.serialNumber} ({s.productName})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-medium text-slate-700 mb-1">Requisition Justification / Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="State why this component is required for service restoration..."
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !productName}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold"
            >
              Submit Requisition
            </button>
          </div>
        </form>
      )}

      {/* Parts List */}
      {spareParts.length === 0 ? (
        <p className="text-center py-6 text-xs text-slate-400">No spare parts requisitioned or used for this task.</p>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
          {spareParts.map((sp) => (
            <div key={sp.id} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">{sp.productName}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  SKU: {sp.sku} {sp.serialNumber ? `• Serial: ${sp.serialNumber}` : ''} • Depot: {sp.warehouseName || 'Central Bengaluru'}
                </div>
                {sp.remarks && <p className="text-[11px] text-slate-600 italic mt-0.5">{sp.remarks}</p>}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-slate-700">
                  Qty Req: <span className="font-bold">{sp.quantityRequired}</span>
                </span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Requisitioned
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

