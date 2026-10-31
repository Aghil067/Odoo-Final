/**
 * InstallationProfitabilityPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Installation Profitability Analysis page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { InstallationProfitability } from '../types/profitability.types';
import { profitabilityService } from '../services/profitabilityService';
import { ProfitabilityTable } from '../components/ProfitabilityTable';

export const InstallationProfitabilityPage: React.FC = () => {
  const [records, setRecords] = useState<InstallationProfitability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await profitabilityService.list();
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load profitability records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Installation Profitability & Job Costing</h1>
        <p className="text-xs text-slate-500">
          Per-installation financial reconciliation of invoiced revenue against verified material, labour, and logistics costs.
        </p>
      </div>

      <ProfitabilityTable profitabilityRecords={records} isLoading={isLoading} />
    </div>
  );
};

