/**
 * WarrantyClaimDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Individual Claim Review & Outcome Dossier Page in M07.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { warrantyClaimService } from '../services/warrantyClaimService';
import { WarrantyClaimReview } from '../components/WarrantyClaimReview';
import { useAuth } from '../../auth/hooks/useAuth';

export const WarrantyClaimDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadClaim = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const c = await warrantyClaimService.getById(id);
      setClaim(c);
    } catch (err) {
      console.error('Failed to load claim', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaim();
  }, [id]);

  const handleReviewSubmit = async (reviewData: any) => {
    if (!id) return;
    await warrantyClaimService.updateReview(id, reviewData);
    await loadClaim();
  };

  const handleResolutionSave = async (resolution: any) => {
    if (!id) return;
    await warrantyClaimService.recordResolution(id, resolution);
    await loadClaim();
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading warranty claim details...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-20 space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="text-base font-bold text-slate-800">Claim Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested claim does not exist or has been removed.</p>
        <Link
          to="/warranty/claims"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims Desk
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WarrantyClaimReview
        claim={claim}
        onReviewSubmit={handleReviewSubmit}
        onResolutionSave={handleResolutionSave}
        userRole={user?.role || 'admin'}
      />
    </div>
  );
};

