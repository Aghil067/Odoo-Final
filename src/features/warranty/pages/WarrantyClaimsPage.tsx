/**
 * WarrantyClaimsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Claims Ledger Page in M07: Warranty Management.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { warrantyClaimService } from '../services/warrantyClaimService';
import { WarrantyClaimTable } from '../components/WarrantyClaimTable';

export const WarrantyClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClaims = async () => {
    try {
      setIsLoading(true);
      const res = await warrantyClaimService.list();
      setClaims(res.data);
    } catch (err) {
      console.error('Failed to load warranty claims', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Warranty Claims Desk
          </h1>
          <p className="text-xs text-slate-500">
            Review hardware defects, verify eligibility checklists, approve replacement units, and track repairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadClaims}
            className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/warranty/claims/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            File New Claim
          </Link>
        </div>
      </div>

      <WarrantyClaimTable claims={claims} isLoading={isLoading} />
    </div>
  );
};

