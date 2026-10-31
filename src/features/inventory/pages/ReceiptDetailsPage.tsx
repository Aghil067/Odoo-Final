/**
 * ReceiptDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Detailed view of a Goods Receipt Note (GRN) with serialized allocations.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  Calendar,
  Building,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { receiptService } from '../services/receiptService';
import type { StockReceipt, ReceiptStatus } from '../types/stock.types';
import {
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_COLOURS,
} from '../types/stock.types';
import { PRODUCT_CATEGORY_LABELS } from '../types/product.types';

export function ReceiptDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<StockReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await receiptService.getById(id);
        setReceipt(res);
      } catch (err) {
        console.error('Failed to load receipt details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: ReceiptStatus) => {
    if (!receipt) return;
    try {
      setStatusUpdating(true);
      const updated = await receiptService.updateStatus(receipt.id, newStatus);
      setReceipt(updated);
    } catch (err) {
      console.error('Failed to update receipt status', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading receipt record...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Receipt Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested goods receipt note does not exist.
        </p>
        <Link to="/inventory/receipts" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Receipts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/inventory/receipts">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {receipt.receiptNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">Goods Receipt Note</h1>
              <Badge
                label={RECEIPT_STATUS_LABELS[receipt.status]}
                className={RECEIPT_STATUS_COLOURS[receipt.status]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Received on {receipt.receiptDate} · Received by: {receipt.receivedBy}
            </p>
          </div>
        </div>

        <PermissionGuard module="inventory" require="full">
          <div className="flex items-center gap-2">
            {receipt.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('received')}
                disabled={statusUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm Received
              </Button>
            )}
            {receipt.status !== 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
                disabled={statusUpdating}
                className="text-red-600 hover:bg-red-50"
              >
                Cancel Receipt
              </Button>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Supplier Details" subtitle="Vendor consignment documentation" />
          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>
                Vendor: <strong>{receipt.supplierName}</strong>
              </span>
            </div>
            {receipt.supplierReference && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Invoice / DC Ref:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {receipt.supplierReference}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Date: {receipt.receiptDate}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader title="Destination Warehouse" subtitle="Receiving facility storage" />
          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-400" />
              <span>
                Facility: <strong>{receipt.destinationWarehouseName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Intake Operator: {receipt.receivedBy}</span>
            </div>
            {receipt.notes && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">
                Notes: {receipt.notes}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <CardHeader
            title="Received Consignment Items"
            subtitle={`${receipt.totalItems} line items (${receipt.totalQuantity} total units)`}
          />
          {receipt.totalCost && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Consignment Valuation</span>
              <span className="text-lg font-bold text-slate-800 font-mono">
                ₹{receipt.totalCost.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-12 text-center">#</th>
                <th className="px-5 py-3">Product Name & Category</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Unit Rate (₹)</th>
                <th className="px-5 py-3 text-right">Line Total (₹)</th>
                <th className="px-5 py-3">Allocated Serial Numbers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.lines.map((line, index) => (
                <tr key={line.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/inventory/products/${line.productId}`}
                      className="font-semibold text-slate-800 hover:text-emerald-700"
                    >
                      {line.productName}
                    </Link>
                    <span className="block text-xs text-slate-400">
                      {PRODUCT_CATEGORY_LABELS[line.category]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                    {line.sku}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                    {line.quantityReceived} {line.unit}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">
                    {line.purchaseCost ? `₹${line.purchaseCost.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-slate-800">
                    {line.lineTotal ? `₹${line.lineTotal.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {line.serialNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {line.serialNumbers.map((sn) => (
                          <Link
                            key={sn}
                            to={`/inventory/serial-numbers?search=${sn}`}
                            className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 hover:bg-purple-100"
                          >
                            {sn}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No serial tracking</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
