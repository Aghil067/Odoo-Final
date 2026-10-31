/**
 * InvoiceForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive Customer Invoice Creation & Editing Form in Module M09.
 * Integrates with M01 Customer Records and M05 Installation Projects.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import type { InvoiceFormData } from '../types/invoice.types';
import { customerService } from '../../crm/services/customerService';
import { installationService } from '../../installations/services/installationService';

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  hsnSacCode: string;
}

interface InvoiceFormProps {
  initialData?: InvoiceFormData;
  isEditing?: boolean;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  isEditing = false,
  onSubmit,
}) => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [customerGst, setCustomerGst] = useState(initialData?.customerGst || '');

  const [installationId, setInstallationId] = useState(initialData?.installationId || '');
  const [installationRef, setInstallationRef] = useState(initialData?.installationRef || '');
  const [systemCapacity, setSystemCapacity] = useState(initialData?.systemCapacity || '');
  const [systemType, setSystemType] = useState(initialData?.systemType || '');

  const [invoiceDate, setInvoiceDate] = useState(
    initialData?.invoiceDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const [items, setItems] = useState<LineItemInput[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          hsnSacCode: i.hsnSacCode || '',
        }))
      : [
          {
            description: 'Mono PERC Solar PV Modules (Certified Tier 1)',
            quantity: 10,
            unitPrice: 15000,
            hsnSacCode: '85414011',
          },
          {
            description: 'Solar On-Grid Inverter with Remote Wi-Fi Telemetry',
            quantity: 1,
            unitPrice: 55000,
            hsnSacCode: '85044090',
          },
          {
            description: 'Anodized Aluminum Mounting Structure & Roof Anchoring Kit',
            quantity: 1,
            unitPrice: 32000,
            hsnSacCode: '76109090',
          },
          {
            description: 'Turnkey Rooftop Installation, Commissioning & Liaison',
            quantity: 1,
            unitPrice: 20000,
            hsnSacCode: '995461',
          },
        ]
  );

  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate ?? 12);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    initialData?.discountType || 'fixed'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [terms, setTerms] = useState(
    initialData?.terms ||
      'Payment due within 15 days of invoice date. 5-year workmanship warranty included.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrerequisites() {
      try {
        const [cRes, iRes] = await Promise.all([
          customerService.list(),
          installationService.list(),
        ]);
        setCustomers(cRes.data || []);
        setInstallations(Array.isArray(iRes) ? iRes : (iRes as any).data || []);
      } catch (err) {
        console.error('Failed to load customers/installations', err);
      }
    }
    loadPrerequisites();
  }, []);

  // When customer changes
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerPhone(found.phone || '');
      setCustomerEmail(found.email || '');
      setCustomerAddress(
        [found.addressLine1, found.city, found.state, found.pinCode]
          .filter(Boolean)
          .join(', ')
      );
      setCustomerGst(found.gstNumber || '');

      // Suggest matching installation if any
      const matchingInst = installations.find((i) => i.customerId === found.id);
      if (matchingInst) {
        setInstallationId(matchingInst.id);
        setInstallationRef(matchingInst.installationId);
        setSystemCapacity(matchingInst.systemCapacity || '');
        setSystemType(matchingInst.systemType || '');
      }
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof LineItemInput, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, hsnSacCode: '' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (discountValue || 0)) / 100);
  } else {
    discountAmount = discountValue || 0;
  }

  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleSubmit = async (saveAsDraft: boolean) => {
    setError(null);

    if (!customerName.trim()) {
      setError('Please select or specify a customer name.');
      return;
    }

    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      setError('All invoice line items must have a description.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        customerGst,
        installationId,
        installationRef,
        systemCapacity,
        systemType,
        invoiceDate,
        dueDate,
        items,
        taxRate,
        discountType,
        discountValue,
        notes,
        terms,
        saveAsDraft,
      });
      navigate('/finance/invoices');
    } catch (err: any) {
      setError(err?.message || 'Failed to save customer invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/finance/invoices')}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEditing ? 'Edit Customer Invoice' : 'Create Solar Customer Invoice'}
            </h1>
            <p className="text-xs text-slate-500">
              Generate standardized tax invoice with line item breakdown and GST calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Issue Invoice'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Customer & Project Association */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Customer & Project Association (M01 / M05)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Customer (M01) <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">-- Choose existing customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.customerId || c.city || 'Client'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Full Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Phone</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Linked Installation (M05)</label>
            <select
              value={installationId}
              onChange={(e) => {
                setInstallationId(e.target.value);
                const inst = installations.find((i) => i.id === e.target.value);
                if (inst) {
                  setInstallationRef(inst.installationId);
                  setSystemCapacity(inst.systemCapacity || '');
                  setSystemType(inst.systemType || '');
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">-- Non-Project Direct Service --</option>
              {installations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.installationId} — {i.title || i.customerName} ({i.systemCapacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">System Capacity</label>
            <input
              type="text"
              value={systemCapacity}
              onChange={(e) => setSystemCapacity(e.target.value)}
              placeholder="e.g. 5 kW On-Grid"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer GSTIN (If Business)</label>
            <input
              type="text"
              value={customerGst}
              onChange={(e) => setCustomerGst(e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">Billing Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Full site installation & invoicing address"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Dates & Line Items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">Invoice Items & Terms</h3>

          <div className="flex items-center gap-3 text-xs">
            <div>
              <span className="text-slate-500 mr-1.5">Invoice Date:</span>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Due Date:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Table */}
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-12 gap-2 text-slate-500 font-semibold px-2">
            <span className="col-span-5">Description of Supply / Work</span>
            <span className="col-span-2 text-center">HSN/SAC</span>
            <span className="col-span-1 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price (₹)</span>
            <span className="col-span-1 text-right">Amount (₹)</span>
            <span className="col-span-1 text-center">Action</span>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
              <input
                type="text"
                required
                value={item.description}
                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                placeholder="Product/service description..."
                className="col-span-5 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                value={item.hsnSacCode}
                onChange={(e) => handleItemChange(idx, 'hsnSacCode', e.target.value)}
                placeholder="85414011"
                className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-center font-mono"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                className="col-span-1 px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-center"
              />
              <input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                className="col-span-2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-right font-mono"
              />
              <span className="col-span-1 text-right font-mono font-semibold text-slate-900 pr-1">
                ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
              </span>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1.5 text-xs text-green-700 font-semibold hover:bg-green-50 rounded-lg border border-dashed border-green-300 flex items-center gap-1 transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line Item
          </button>
        </div>

        {/* Calculations / Summary Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-100">
          <div className="sm:w-1/2 space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Invoice Remarks & Payment Terms</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific milestone breakdown or customer notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Standard Terms & Conditions</label>
              <input
                type="text"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment due in 15 days..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="sm:w-72 space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">GST Rate:</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Solar Components)</option>
                <option value={12}>12% (Composite Works)</option>
                <option value={18}>18% (Standard Services)</option>
              </select>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Tax ({taxRate}%):</span>
              <span className="font-mono text-slate-800">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <span className="text-slate-600">Discount:</span>
              <div className="flex items-center gap-1 w-36">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="px-1 py-0.5 border border-slate-300 rounded text-[11px] bg-white"
                >
                  <option value="fixed">₹</option>
                  <option value="percentage">%</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-2 py-0.5 border border-slate-300 rounded text-right font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-2">
              <span>Total Amount:</span>
              <span className="font-mono text-green-700">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
