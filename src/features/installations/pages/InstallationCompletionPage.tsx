/**
 * InstallationCompletionPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Completion dossier, electrical test results, customer sign-off,
 * and installation manager verification page.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Installation } from '../types/installation.types';
import type { InstallationExecutionData, InstallationCompletion } from '../types/execution.types';
import { installationService } from '../services/installationService';
import { installationExecutionService } from '../services/installationExecutionService';
import { InstallationCompletionForm } from '../components/InstallationCompletionForm';
import { Button } from '../../../components/ui/Button';

export function InstallationCompletionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [installation, setInstallation] = useState<Installation | null>(null);
  const [execution, setExecution] = useState<InstallationExecutionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [inst, exec] = await Promise.all([
          installationService.getById(id),
          installationExecutionService.getExecution(id),
        ]);
        setInstallation(inst);
        setExecution(exec);
      } catch (err) {
        console.error('Failed to load installation completion dossier', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Loading completion dossier...
      </div>
    );
  }

  if (!installation || !execution) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 space-y-3">
        <p>Installation record not found.</p>
        <Link to="/installations">
          <Button size="sm" variant="outline">
            Return to Work Orders
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmitCompletion = async (
    data: Omit<InstallationCompletion, 'submittedDate' | 'reviewStatus'>
  ) => {
    const updated = await installationExecutionService.submitCompletion(installation.id, data);
    setInstallation(updated);
    const refreshedExec = await installationExecutionService.getExecution(installation.id);
    setExecution(refreshedExec);
    navigate(`/installations/${installation.id}`);
  };

  const handleReviewCompletion = async (
    decision: 'approved' | 'rejected',
    remarks: string
  ) => {
    const updated = await installationExecutionService.reviewCompletion(
      installation.id,
      decision,
      remarks,
      'Kavita Menon'
    );
    setInstallation(updated);
    const refreshedExec = await installationExecutionService.getExecution(installation.id);
    setExecution(refreshedExec);
    navigate(`/installations/${installation.id}`);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div>
        <Link
          to={`/installations/${installation.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Installation Dossier ({installation.installationId})</span>
        </Link>
      </div>

      {/* Completion form component */}
      <InstallationCompletionForm
        existingCompletion={execution.completion}
        onSubmitCompletion={handleSubmitCompletion}
        onReviewCompletion={handleReviewCompletion}
        defaultCustomerName={installation.customerName}
        currentUserName="Ramesh Patel"
        isManager={true}
        canSubmit={installation.status !== 'verified' && installation.status !== 'cancelled'}
      />
    </div>
  );
}

