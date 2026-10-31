/**
 * BOMPreviewPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Printable & exportable engineering Bill of Materials (BOM) view.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { configurationService } from '../services/configurationService';
import type { BillOfMaterials } from '../types/configuration.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';
import { SYSTEM_TYPE_LABELS } from '../../crm/types/enquiry.types';

export function BOMPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [bom, setBom] = useState<BillOfMaterials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBOM() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await configurationService.generateBOM(id);
        setBom(data);
      } catch (err) {
        console.error('Failed to generate BOM', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBOM();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500 max-w-4xl mx-auto">
        Generating Bill of Materials...
      </div>
    );
  }

  if (!bom) {
    return (
      <div className="py-20 text-center max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">BOM Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          Could not generate a Bill of Materials for the specified configuration.
        </p>
        <Link to="/configurations" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Configurations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden pb-3 border-b border-slate-200">
        <Link to={`/configurations/${bom.configurationId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Configuration
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
      <div className="bg-white p-8 sm:p-12 border border-slate-200 rounded-xl shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xl tracking-tight">
              <Zap className="w-6 h-6 fill-amber-500" />
              <span>SUNPOWER SOLUTIONS</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rooftop Solar EPC & System Engineering Division
            </p>
            <p className="text-xs text-slate-400">
              ISO 9001:2015 Certified Installation Practice
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
              Bill of Materials (BOM)
            </h1>
            <p className="text-xs font-mono font-bold text-slate-700">
              BOM Ref: <span className="text-amber-700">{bom.bomId}</span>
            </p>
            <p className="text-xs text-slate-500">
              Generated: {new Date(bom.generatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Project & Sizing Meta Grid */}
        <div className="grid grid-cols-2 gap-6 my-6 text-xs text-slate-700 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Customer & Installation Site
            </p>
            <p className="font-bold text-sm text-slate-900">{bom.customerName}</p>
            <p className="text-slate-600 leading-relaxed">{bom.siteLocation}</p>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Technical Sizing
            </p>
            <p className="font-bold text-sm text-slate-900">
              {bom.ratedCapacity} kW · {SYSTEM_TYPE_LABELS[bom.systemType]}
            </p>
            <p className="text-slate-500">
              Configuration: <span className="font-medium text-slate-700">{bom.configurationName}</span>
            </p>
          </div>
        </div>

        {/* Components Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase text-[10px] tracking-wider bg-slate-50/80">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description / Specification</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Est. Unit (₹)</th>
                <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bom.lines.map((line) => (
                <tr key={line.itemNumber} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-500">
                    {line.itemNumber}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">
                    {COMPONENT_CATEGORY_LABELS[line.category]}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900">{line.componentName}</p>
                    {line.modelNumber && (
                      <p className="font-mono text-[10px] text-slate-400">Model: {line.modelNumber}</p>
                    )}
                    {line.specification && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{line.specification}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                    {line.requiredQuantity} {line.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {line.estimatedUnitCost ? `₹${line.estimatedUnitCost.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {line.estimatedLineTotal ? `₹${line.estimatedLineTotal.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                    {line.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold text-slate-900 text-xs bg-slate-50">
                <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">
                  Total Bill of Materials ({bom.totalItems} line items):
                </td>
                <td className="py-3 px-3 text-center">{bom.totalQuantity} units</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-right font-mono text-sm text-amber-700">
                  ₹{bom.totalEstimatedCost.toLocaleString()}
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Engineering Disclaimer */}
        <div className="mt-8 p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Engineering & Procurement Disclaimer
          </p>
          <p>
            This Bill of Materials specifies the mandatory technical equipment approved for the solar installation. Component quantities are derived from structural and electrical calculations from the site survey. Physical dispatch and inventory allocations will be finalized under <strong>Module M04 (Inventory & Warehouse)</strong>. Unit rates are technical baseline estimates for quotation guidance and exclude taxes/transport.
          </p>
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-slate-200 text-xs">
          <div>
            <div className="border-b border-slate-400 w-48 mb-2"></div>
            <p className="font-bold text-slate-800">Design Engineer</p>
            <p className="text-slate-400">Technical Configuration Division</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="border-b border-slate-400 w-48 mb-2"></div>
            <p className="font-bold text-slate-800">Project / Installation Manager</p>
            <p className="text-slate-400">Approved for Quotation & Procurement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
