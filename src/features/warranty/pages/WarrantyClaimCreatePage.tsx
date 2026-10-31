/**
 * WarrantyClaimCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for filing a Warranty Claim in M07.
 */

import React from 'react';
import type { WarrantyClaimFormData } from '../types/warrantyClaim.types';
import { warrantyClaimService } from '../services/warrantyClaimService';
import { WarrantyClaimForm } from '../components/WarrantyClaimForm';

export const WarrantyClaimCreatePage: React.FC = () => {
  const handleSubmit = async (data: WarrantyClaimFormData) => {
    await warrantyClaimService.create(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">File Warranty Claim</h1>
        <p className="text-xs text-slate-500">
          Report defective solar inverters, batteries, or damaged panels under covered warranty.
        </p>
      </div>

      <WarrantyClaimForm onSubmit={handleSubmit} />
    </div>
  );
};

