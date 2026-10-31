/**
 * TemplateCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new reusable system template.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { TemplateForm } from '../components/TemplateForm';
import { templateService } from '../services/templateService';
import type { TemplateFormData } from '../types/template.types';

export function TemplateCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: TemplateFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await templateService.create(formData);
      navigate(`/configurations/templates/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create template', err);
      setError(err?.message || 'Failed to save template. Please review all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New System Template</h1>
          <p className="text-sm text-slate-500">
            Define standard component assemblies and technical sizing for fast configuration.
          </p>
        </div>
        <Link to="/configurations/templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Templates
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <TemplateForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/configurations/templates')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

