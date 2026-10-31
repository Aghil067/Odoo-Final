/**
 * ProductsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Product Catalogue table with comprehensive category & tracking filters.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  PlusCircle,
  CheckCircle,
  PowerOff,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { productService } from '../services/productService';
import type {
  InventoryProduct,
  ProductCategory,
  TrackingMethod,
  ProductStatus,
} from '../types/product.types';
import {
  PRODUCT_CATEGORY_LABELS,
  TRACKING_METHOD_LABELS,
  TRACKING_METHOD_COLOURS,
} from '../types/product.types';

export function ProductsPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod | ''>('');
  const [status, setStatus] = useState<ProductStatus | ''>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await productService.list({
        search,
        category: category || undefined,
        trackingMethod: trackingMethod || undefined,
        status: status || undefined,
        pageSize: 50,
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category, trackingMethod, status]);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await productService.toggleStatus(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to toggle product status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Catalogue</h1>
          <p className="text-sm text-slate-500">
            Solar PV modules, inverters, storage batteries, protection switchgear, and structural kits.
          </p>
        </div>

        <PermissionGuard module="inventory" require="full">
          <Link to="/inventory/products/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Product
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by SKU, product name, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
              options={[
                { value: '', label: 'All Categories' },
                ...Object.entries(PRODUCT_CATEGORY_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              value={trackingMethod}
              onChange={(e) => setTrackingMethod(e.target.value as TrackingMethod | '')}
              options={[
                { value: '', label: 'All Tracking Methods' },
                ...Object.entries(TRACKING_METHOD_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Product Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || category || trackingMethod || status
                ? 'Try adjusting your search filters.'
                : 'Get started by creating your first solar equipment product in the catalogue.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ref / ID</th>
                  <th className="px-5 py-3.5">Product Name & Model</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Manufacturer</th>
                  <th className="px-5 py-3.5 text-center">UOM</th>
                  <th className="px-5 py-3.5">Tracking</th>
                  <th className="px-5 py-3.5 text-center">Min Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {prod.sku}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {prod.productId}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/inventory/products/${prod.id}`}
                        className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors block"
                      >
                        {prod.name}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">{prod.modelNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {PRODUCT_CATEGORY_LABELS[prod.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700">
                      {prod.manufacturer}
                    </td>
                    <td className="px-5 py-4 text-center text-xs font-semibold text-slate-800">
                      {prod.uom}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={TRACKING_METHOD_LABELS[prod.trackingMethod]}
                        className={TRACKING_METHOD_COLOURS[prod.trackingMethod]}
                      />
                    </td>
                    <td className="px-5 py-4 text-center text-xs font-mono font-bold text-slate-700">
                      {prod.minimumStockLevel}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={prod.status}
                        className={
                          prod.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PermissionGuard module="inventory" require="full">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(prod.id)}
                            className="h-8 text-xs text-slate-500"
                          >
                            {prod.status === 'active' ? (
                              <PowerOff className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </Button>
                        </PermissionGuard>

                        <Link to={`/inventory/products/${prod.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            View
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
