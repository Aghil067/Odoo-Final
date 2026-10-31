/**
 * WarrantyInfoPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * Warranty verification & eligibility preview panel in Module M08.
 * Integrates directly with M07 Warranty Management records.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, AlertCircle } from 'lucide-react';
import type { ServiceWarrantyIndicator } from '../types/serviceTicket.types';
import { WarrantyIndicatorBadge } from './ServiceStatusBadge';

interface WarrantyInfoPanelProps {
  indicator: ServiceWarrantyIndicator;
  warrantyId?: string;
  warrantyRef?: string;
  warrantyStatus?: string;
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  warrantyCoverageType?: string;
  warrantyCoverageDescription?: string;
}

export const WarrantyInfoPanel: React.FC<WarrantyInfoPanelProps> = ({
  indicator,
  warrantyId,
  warrantyRef,
  warrantyStatus,
  warrantyStartDate,
  warrantyExpiryDate,
  warrantyCoverageType,
  warrantyCoverageDescription,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Warranty Coverage Status (M07 Integration)
          </h4>
        </div>
        <WarrantyIndicatorBadge indicator={indicator} />
      </div>

      {indicator === 'none' || indicator === 'unavailable' ? (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            No active warranty record found for this product/serial in M07. This service request will be handled as out-of-warranty chargeable repair unless approved by manager.
          </span>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Warranty Record</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {warrantyRef || 'WAR-REGISTERED'}
              </span>
              {warrantyStatus && (
                <span className="text-[10px] text-slate-500 capitalize block mt-0.5">
                  ({warrantyStatus})
                </span>
              )}
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Coverage Type</span>
              <span className="font-semibold text-slate-800 mt-0.5 block capitalize">
                {warrantyCoverageType || 'Manufacturer Warranty'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Start Date</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {warrantyStartDate || 'Upon Commissioning'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Expiry Date</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {warrantyExpiryDate || 'Pending'}
              </span>
            </div>
          </div>

          {warrantyCoverageDescription && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">
              <span className="font-semibold text-slate-700">Coverage Terms: </span>
              {warrantyCoverageDescription}
            </div>
          )}

          {warrantyId && (
            <div className="flex justify-end pt-1">
              <Link
                to={`/warranty/${warrantyId}`}
                className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-semibold hover:underline"
              >
                Inspect Warranty Dossier in M07 <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
