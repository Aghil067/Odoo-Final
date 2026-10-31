/**
 * SurveyCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page to create and dispatch a new site survey request.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SurveyForm } from '../components/SurveyForm';
import { surveyService } from '../services/surveyService';
import type { CreateSurveyRequestData } from '../types/survey.types';

export function SurveyCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateSurveyRequestData) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await surveyService.create(data);
      navigate(`/surveys/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create survey request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedule Site Survey</h1>
          <p className="text-sm text-slate-500">
            Dispatch a field surveyor to conduct technical measurements and shadow evaluations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <SurveyForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

