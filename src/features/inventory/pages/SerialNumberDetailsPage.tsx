/**
 * SerialNumberDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete dossier and movement timeline for an individual serialized hardware unit.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  ShieldCheck,
  Clock,
  ExternalLink,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { serialNumberService } from '../services/serialNumberService';
import type {
  SerialNumberRecord,
  SerialNumberStatus,
} from '../types/serialNumber.types';
import {
  SERIAL_STATUS_LABELS,
  SERIAL_STATUS_COLOURS,
} from '../types/serialNumber.types';
import { PRODUCT_CATEGORY_LABELS } from '../types/product.types';

export function SerialNumberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<SerialNumberRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await serialNumberService.getById(id);
        setRecord(res);
      } catch (err) {
        console.error('Failed to load serial number details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: SerialNumberStatus) => {
    if (!record) return;
    try {
      setIsUpdating(true);
      const updated = await serialNumberService.updateStatus(record.id, newStatus);
      setRecord(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading serial record...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Serial Number Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          No hardware record found matching the specified serial number.
        </p>
        <Link to="/inventory/serial-numbers" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Serial Tracking
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/inventory/serial-numbers">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                {record.serialNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">{record.productName}</h1>
              <Badge
                label={SERIAL_STATUS_LABELS[record.status]}
                className={SERIAL_STATUS_COLOURS[record.status]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <strong>{PRODUCT_CATEGORY_LABELS[record.category]}</strong> · Manufacturer:{' '}
              {record.manufacturer} · Model: {record.modelNumber}
            </p>
          </div>
        </div>

        <PermissionGuard module="inventory" require="full">
          <div className="flex items-center gap-2">
            {record.status !== 'under_service' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('under_service')}
                disabled={isUpdating}
                className="text-orange-700 border-orange-300 hover:bg-orange-50 text-xs"
              >
                <Wrench className="w-3.5 h-3.5 mr-1" />
                Move to RMA / Service
              </Button>
            )}
            {record.status !== 'available' && record.status !== 'installed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('available')}
                disabled={isUpdating}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
              >
                Return to Available Stock
              </Button>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* Product & Current Status Dossier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hardware Specs & Links */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader
            title="Hardware Identification"
            subtitle="Equipment specifications and catalogue reference"
          />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-semibold">Product Name</span>
              <span className="font-semibold text-slate-800">{record.productName}</span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">SKU / Code</span>
              <span className="font-mono font-semibold text-slate-700">{record.sku}</span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Manufacturer</span>
              <span className="text-slate-700">{record.manufacturer}</span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Model Number</span>
              <span className="font-mono text-slate-700">{record.modelNumber}</span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500">Catalogue Dossier:</span>
              <Link
                to={`/inventory/products/${record.productId}`}
                className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
              >
                View Product Specifications
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Current Location & Lifecycle Context */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <CardHeader
            title="Location & Project Assignment"
            subtitle="Real-time physical whereabouts"
          />

          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Facility:{' '}
                <strong>{record.currentWarehouseName || 'Field Installation / Transit'}</strong>
              </span>
            </div>

            {record.currentLocation && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Bay / Shelf:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {record.currentLocation}
                </span>
              </div>
            )}

            {record.linkedInstallationCustomer && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 mt-2">
                <span className="font-bold block">Assigned Rooftop Installation</span>
                <span>Customer: {record.linkedInstallationCustomer}</span>
                {record.linkedInstallationId && (
                  <span className="font-mono block text-[11px] text-blue-700 mt-0.5">
                    Order Ref: {record.linkedInstallationId}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Movement Audit Timeline */}
      <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
        <CardHeader
          title="Serial Movement Ledger"
          subtitle="Chronological custody transfers from initial intake to rooftop commissioning"
        />

        <div className="space-y-4 pt-2">
          {record.movementHistory.map((mov, index) => (
            <div key={mov.id || index} className="flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-1 w-full bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-800 capitalize">
                    {mov.movementType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(mov.date).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                  <span>From: <strong className="text-slate-800">{mov.fromLocation}</strong></span>
                  <span>To: <strong className="text-slate-800">{mov.toLocation}</strong></span>
                  <span>Ref: <code className="text-purple-700 font-bold">{mov.referenceNumber}</code></span>
                  <span>By: {mov.performedBy}</span>
                </div>

                {mov.notes && (
                  <p className="text-slate-500 text-[11px] italic pt-1 border-t border-slate-200/60 mt-1">
                    {mov.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* M07 Warranty Integration Placeholder */}
      <Card className="p-5 bg-amber-50/50 border border-amber-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Warranty & Service Lifecycle (M07 Integration Placeholder)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {record.warrantyStatus ||
            'Manufacturer warranty terms will be activated and governed upon site commissioning in Module M07 (Warranty & Service Management).'}
          {record.warrantyExpiresAt && (
            <span className="block font-semibold text-slate-800 mt-1">
              Factory Coverage Valid Through: {new Date(record.warrantyExpiresAt).toLocaleDateString()}
            </span>
          )}
        </p>
      </Card>
    </div>
  );
}
