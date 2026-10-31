/**
 * ProductDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Detailed product dossier with technical specs and warehouse balances.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Hash,
  History,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { productService } from '../services/productService';
import { stockService } from '../services/stockService';
import { componentService } from '../../configurations/services/componentService';
import type { InventoryProduct } from '../types/product.types';
import type { StockBalance } from '../types/stock.types';
import type { SystemComponent } from '../../configurations/types/component.types';
import {
  PRODUCT_CATEGORY_LABELS,
  TRACKING_METHOD_LABELS,
  TRACKING_METHOD_COLOURS,
} from '../types/product.types';
import {
  STOCK_STATUS_LABELS,
  STOCK_STATUS_COLOURS,
} from '../types/stock.types';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);
  const [m03Component, setM03Component] = useState<SystemComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const prod = await productService.getById(id);
        setProduct(prod);

        if (prod) {
          const [stockRes, compRes] = await Promise.all([
            stockService.getStockOverview({ search: prod.sku }),
            prod.compatibleComponentId
              ? componentService.getById(prod.compatibleComponentId)
              : Promise.resolve(null),
          ]);
          setStockBalances(stockRes.data.filter((b) => b.productId === prod.id));
          setM03Component(compRes);
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-5xl mx-auto">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested product does not exist in the catalogue.
        </p>
        <Link to="/inventory/products" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const totalOnHand = stockBalances.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const totalAvailable = stockBalances.reduce((acc, curr) => acc + curr.availableQuantity, 0);
  const totalReserved = stockBalances.reduce((acc, curr) => acc + curr.reservedQuantity, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/inventory/products">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                {product.sku}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
              <Badge
                label={product.status}
                className={
                  product.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }
              />
              <Badge
                label={TRACKING_METHOD_LABELS[product.trackingMethod]}
                className={TRACKING_METHOD_COLOURS[product.trackingMethod]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ref: <span className="font-mono">{product.productId}</span> · Category:{' '}
              <strong>{PRODUCT_CATEGORY_LABELS[product.category]}</strong> · Manufacturer:{' '}
              {product.manufacturer} (Model: {product.modelNumber})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {product.trackingMethod === 'serial_tracking' && (
            <Link to={`/inventory/serial-numbers?productId=${product.id}`}>
              <Button variant="outline" size="sm" className="text-purple-700 border-purple-300">
                <Hash className="w-4 h-4 mr-1.5" />
                View Serial Units
              </Button>
            </Link>
          )}
          <Link to={`/inventory/movements?productId=${product.id}`}>
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-1.5" />
              Stock Movements
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock Summary Across Facilities */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total On Hand</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {totalOnHand} {product.uom}
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Available for Dispatch</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {totalAvailable} {product.uom}
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Reserved for Projects</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {totalReserved} {product.uom}
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Reorder Threshold</span>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {product.minimumStockLevel} {product.uom}
          </p>
        </Card>
      </div>

      {/* Warehouse Balances Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <CardHeader
            title="Warehouse Location Balances"
            subtitle="Current stock levels per registered facility and storage bay"
          />
        </div>

        {stockBalances.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active stock balance recorded for this product across warehouses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3">Storage Bay / Location</th>
                  <th className="px-5 py-3 text-center">On Hand</th>
                  <th className="px-5 py-3 text-center">Reserved</th>
                  <th className="px-5 py-3 text-center">Available</th>
                  <th className="px-5 py-3">Stock Status</th>
                  <th className="px-5 py-3">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockBalances.map((sb) => (
                  <tr key={sb.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{sb.warehouseName}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{sb.location}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {sb.totalQuantity} {sb.uom}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium text-amber-700">
                      {sb.reservedQuantity} {sb.uom}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-700">
                      {sb.availableQuantity} {sb.uom}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={STOCK_STATUS_LABELS[sb.status]}
                        className={STOCK_STATUS_COLOURS[sb.status]}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {sb.lastStockTakeDate || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Technical Specifications Grid & M03 BOM Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Specs */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <CardHeader
            title="Technical Hardware Sizing"
            subtitle="Electrical and structural engineering specifications"
          />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-semibold">Rated Power</span>
              <span className="font-semibold text-slate-800 text-sm">
                {product.specs?.ratedPower || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Operating Voltage</span>
              <span className="font-semibold text-slate-800 text-sm">
                {product.specs?.voltage || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Rated Current</span>
              <span className="font-semibold text-slate-800 text-sm">
                {product.specs?.current || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Capacity</span>
              <span className="font-semibold text-slate-800 text-sm">
                {product.specs?.capacity || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Dimensions</span>
              <span className="font-medium text-slate-700">
                {product.specs?.dimensions || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Weight</span>
              <span className="font-medium text-slate-700">
                {product.specs?.weight || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Manufacturer Warranty</span>
              <span className="font-medium text-slate-700">
                {product.specs?.warrantyYears ? `${product.specs.warrantyYears} Years` : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-semibold">Standards / Compliance</span>
              <span className="font-medium text-slate-700">
                {product.specs?.additionalSpecs || '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* M03 Solar Configuration Integration Dossier */}
        <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <CardHeader
            title="M03 System Component Alignment"
            subtitle="Bridge between technical design BOM and physical inventory stock"
          />

          {m03Component ? (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Mapped Component: {m03Component.componentId}
                </span>
                <Badge label="BOM Compatible" className="bg-emerald-100 text-emerald-800" />
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm">{m03Component.name}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {m03Component.specification}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">M03 Baseline Rate:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{(m03Component.estimatedUnitCost || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2 text-center py-6">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Unmapped Product</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                This inventory item is not explicitly bound to an engineering template component. It can be issued manually or earmarked for auxiliary supply.
              </p>
            </div>
          )}

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Commercial Pricing
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₹{(product.purchaseCost || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Selling Price</span>
                <span className="font-mono font-semibold text-emerald-700">
                  ₹{(product.sellingPrice || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Applicable GST</span>
                <span className="font-mono font-semibold text-slate-700">
                  {product.taxRatePercent || 18}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
