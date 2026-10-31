/**
 * IssueCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new outgoing Stock Issue.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StockIssueForm } from '../components/StockIssueForm';
import { issueService } from '../services/issueService';
import type { StockIssueFormData } from '../types/stock.types';

export function IssueCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StockIssueFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await issueService.create(formData);
      navigate(`/inventory/issues/${created.id}`);
    } catch (err: any) {
      console.error('Failed to issue stock', err);
      setError(err?.message || 'Failed to dispatch stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Material Dispatch (Issue)</h1>
          <p className="text-sm text-slate-500">
            Allocate and issue hardware from warehouse stock for site installations or field maintenance.
          </p>
        </div>
        <Link to="/inventory/issues">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Issues
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <StockIssueForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory/issues')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

