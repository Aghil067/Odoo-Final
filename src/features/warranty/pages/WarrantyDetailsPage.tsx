/**
 * WarrantyDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Individual Equipment Warranty Dossier Page in M07.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import type { WarrantyRecord } from '../types/warranty.types';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { warrantyService } from '../services/warrantyService';
import { warrantyClaimService } from '../services/warrantyClaimService';
import { WarrantyDetails } from '../components/WarrantyDetails';
import { useAuth } from '../../auth/hooks/useAuth';

export const WarrantyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [warranty, setWarranty] = useState<WarrantyRecord | null>(null);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [w, cList] = await Promise.all([
        warrantyService.getById(id),
        warrantyClaimService.getClaimsForWarranty(id),
      ]);
      setWarranty(w);
      setClaims(cList);
    } catch (err) {
      console.error('Failed to load warranty dossier', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleActivate = async () => {
    if (!id) return;
    await warrantyService.activate(id, user?.name || 'Admin User');
    await loadData();
  };

  const handleSuspend = async (reason: string) => {
    if (!id) return;
    await warrantyService.suspend(id, reason);
    await loadData();
  };

  const handleResume = async () => {
    if (!id) return;
    await warrantyService.resume(id);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading warranty dossier...
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="text-center py-20 space-y-3">
        <Shield className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="text-base font-bold text-slate-800">Warranty Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested warranty record does not exist or has been removed.</p>
        <Link
          to="/warranty/records"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Warranties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WarrantyDetails
        warranty={warranty}
        claims={claims}
        onActivate={handleActivate}
        onSuspend={handleSuspend}
        onResume={handleResume}
        userRole={user?.role || 'admin'}
      />
    </div>
  );
};
