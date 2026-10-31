/**
 * AdjustmentCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new physical Stock Adjustment.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StockAdjustmentForm } from '../components/StockAdjustmentForm';
import { adjustmentService } from '../services/adjustmentService';
import type { StockAdjustmentFormData } from '../types/stock.types';

export function AdjustmentCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StockAdjustmentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await adjustmentService.create(formData);
      navigate('/inventory/adjustments');
    } catch (err: any) {
      console.error('Failed to create adjustment', err);
      setError(err?.message || 'Failed to submit stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Physical Stock Adjustment</h1>
          <p className="text-sm text-slate-500">
            Reconcile physical stock counts against system quantities or write off damaged items.
          </p>
        </div>
        <Link to="/inventory/adjustments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Adjustments
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <StockAdjustmentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory/adjustments')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

