/**
 * TransferCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new inter-warehouse Stock Transfer.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StockTransferForm } from '../components/StockTransferForm';
import { transferService } from '../services/transferService';
import type { StockTransferFormData } from '../types/stock.types';

export function TransferCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StockTransferFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await transferService.create(formData);
      navigate('/inventory/transfers');
    } catch (err: any) {
      console.error('Failed to create transfer', err);
      setError(err?.message || 'Failed to dispatch transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Inter-Warehouse Stock Transfer</h1>
          <p className="text-sm text-slate-500">
            Relocate stock and serialized inventory from one facility to another.
          </p>
        </div>
        <Link to="/inventory/transfers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Transfers
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <StockTransferForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory/transfers')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

