/**
 * SurveyExecutionPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page loaded when a surveyor records on-site physical inspection findings.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SurveyExecutionForm } from '../components/SurveyExecutionForm';
import { surveyService } from '../services/surveyService';
import type { Survey, SurveyExecutionData } from '../types/survey.types';

export function SurveyExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await surveyService.getById(id);
        setSurvey(data);
      } catch (err) {
        console.error('Failed to load survey for execution', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (data: SurveyExecutionData) => {
    if (!id) return;
    try {
      setIsSaving(true);
      setError(null);
      await surveyService.saveExecution(id, data);
      navigate(`/surveys/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save survey findings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-sm text-slate-500">Loading inspection form...</div>;
  }

  if (!survey) {
    return <div className="p-16 text-center text-sm text-slate-500">Survey record not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Record Site Inspection Findings</h1>
          <p className="text-sm text-slate-500">
            {survey.surveyId} • {survey.customerName} ({survey.siteName})
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <SurveyExecutionForm survey={survey} onSubmit={handleSubmit} isLoading={isSaving} />
    </div>
  );
}

