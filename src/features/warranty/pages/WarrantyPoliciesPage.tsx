/**
 * WarrantyPoliciesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Catalogue page for Warranty Policies in M07.
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyPolicy, PolicyStatus } from '../types/warrantyPolicy.types';
import { warrantyPolicyService } from '../services/warrantyPolicyService';
import { WarrantyPolicyTable } from '../components/WarrantyPolicyTable';

export const WarrantyPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<WarrantyPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPolicies = async () => {
    try {
      setIsLoading(true);
      const res = await warrantyPolicyService.list();
      setPolicies(res.data);
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleToggleStatus = async (id: string, newStatus: PolicyStatus) => {
    try {
      await warrantyPolicyService.toggleStatus(id, newStatus);
      await loadPolicies();
    } catch (err) {
      alert('Failed to update policy status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warranty Policies Catalogue</h1>
          <p className="text-xs text-slate-500">
            Define duration limits, manufacturer terms, activation conditions, and replacement rules.
          </p>
        </div>

        <Link
          to="/warranty/policies/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Warranty Policy
        </Link>
      </div>

      <WarrantyPolicyTable
        policies={policies}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />
    </div>
  );
};
