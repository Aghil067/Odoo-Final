/**
 * WarrantyPolicyCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for creating a new Warranty Policy in M07.
 */

import React from 'react';
import type { WarrantyPolicyFormData } from '../types/warrantyPolicy.types';
import { warrantyPolicyService } from '../services/warrantyPolicyService';
import { WarrantyPolicyForm } from '../components/WarrantyPolicyForm';

export const WarrantyPolicyCreatePage: React.FC = () => {
  const handleCreate = async (data: WarrantyPolicyFormData) => {
    await warrantyPolicyService.create(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Define New Warranty Policy</h1>
        <p className="text-xs text-slate-500">
          Configure coverage durations, exclusions, activation criteria, and equipment rules.
        </p>
      </div>

      <WarrantyPolicyForm onSubmit={handleCreate} />
    </div>
  );
};

