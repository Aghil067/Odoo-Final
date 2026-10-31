/**
 * WarrantyRecordsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Equipment Warranty Records Ledger in M07.
 */

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyRecord } from '../types/warranty.types';
import { warrantyService } from '../services/warrantyService';
import { WarrantyTable } from '../components/WarrantyTable';

export const WarrantyRecordsPage: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWarranties = async () => {
    try {
      setIsLoading(true);
      const res = await warrantyService.list();
      setWarranties(res.data);
    } catch (err) {
      console.error('Failed to load warranties', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
  }, []);

  const handleQuickActivate = async (id: string) => {
    try {
      await warrantyService.activate(id);
      await loadWarranties();
    } catch (err) {
      alert('Failed to activate warranty.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Equipment Warranty Records</h1>
          <p className="text-xs text-slate-500">
            Master ledger of registered rooftop solar warranties, active coverage, and serial numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWarranties}
            className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/warranty/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Warranty
          </Link>
        </div>
      </div>

      <WarrantyTable
        warranties={warranties}
        onQuickActivate={handleQuickActivate}
        isLoading={isLoading}
      />
    </div>
  );
};
