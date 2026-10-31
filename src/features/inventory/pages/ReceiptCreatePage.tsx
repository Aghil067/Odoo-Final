/**
 * ReceiptCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new incoming Stock Receipt.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StockReceiptForm } from '../components/StockReceiptForm';
import { receiptService } from '../services/receiptService';
import type { StockReceiptFormData } from '../types/stock.types';

export function ReceiptCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StockReceiptFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await receiptService.create(formData);
      navigate(`/inventory/receipts/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create receipt', err);
      setError(err?.message || 'Failed to process receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Goods Receipt (GRN)</h1>
          <p className="text-sm text-slate-500">
            Intake vendor shipments, verify incoming equipment, and allocate serial numbers.
          </p>
        </div>
        <Link to="/inventory/receipts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Receipts
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <StockReceiptForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory/receipts')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

