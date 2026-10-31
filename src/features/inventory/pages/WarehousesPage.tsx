/**
 * WarehousesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Warehouse Management Page with storage bays and facility managers.
 */

import { useEffect, useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Search,
  PlusCircle,
  MapPin,
  Phone,
  User,
  Edit2,
  CheckCircle,
  PowerOff,
  X,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { warehouseService } from '../services/warehouseService';
import { WarehouseForm } from '../components/WarehouseForm';
import type { Warehouse, WarehouseFormData } from '../types/warehouse.types';

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await warehouseService.list({ search });
      setWarehouses(res.data);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await warehouseService.toggleStatus(id);
      setWarehouses((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (err) {
      console.error('Failed to toggle warehouse status', err);
    }
  };

  const handleSaveWarehouse = async (data: WarehouseFormData) => {
    try {
      setIsSubmitting(true);
      if (editingWarehouse) {
        const updated = await warehouseService.update(editingWarehouse.id, data);
        setWarehouses((prev) => prev.map((w) => (w.id === editingWarehouse.id ? updated : w)));
      } else {
        const created = await warehouseService.create(data);
        setWarehouses((prev) => [created, ...prev]);
      }
      setShowModal(false);
      setEditingWarehouse(undefined);
    } catch (err) {
      console.error('Failed to save warehouse', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingWarehouse(undefined);
    setShowModal(true);
  };

  const openEditModal = (w: Warehouse) => {
    setEditingWarehouse(w);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Warehouses & Logistics Depots</h1>
          <p className="text-sm text-slate-500">
            Storage locations, transit hubs, and designated equipment staging bays.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Warehouse
          </Button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search by warehouse name, code, city, supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Warehouse Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading facilities...</div>
      ) : warehouses.length === 0 ? (
        <div className="py-16 text-center">
          <WarehouseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No warehouses registered</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add storage facilities to start receiving and organizing hardware stock.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                    {wh.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-400">{wh.warehouseId}</span>
                    <Badge
                      label={wh.status}
                      className={
                        wh.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base">{wh.name}</h3>
                  <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {wh.address}, {wh.city}, {wh.state} - {wh.pincode}
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Supervisor: <strong className="text-slate-700">{wh.contactPerson}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{wh.contactNumber}</span>
                  </div>
                </div>

                {/* Storage Bays list */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Storage Bays ({wh.storageAreas.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.storageAreas.map((sa) => (
                      <span
                        key={sa.id}
                        className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200"
                        title={sa.description}
                      >
                        {sa.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <PermissionGuard module="inventory" require="full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(wh.id)}
                    className="h-8 text-xs text-slate-500"
                  >
                    {wh.status === 'active' ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        Activate
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(wh)}
                    className="h-8 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    Edit Facility
                  </Button>
                </PermissionGuard>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingWarehouse ? 'Edit Warehouse Facility' : 'Register Warehouse Facility'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <WarehouseForm
              initialData={editingWarehouse}
              onSubmit={handleSaveWarehouse}
              onCancel={() => setShowModal(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
