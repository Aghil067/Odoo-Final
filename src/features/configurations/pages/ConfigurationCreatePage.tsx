/**
 * ConfigurationCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper hosting the multi-step ConfigurationWizard.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfigurationWizard } from '../components/ConfigurationWizard';

export function ConfigurationCreatePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Solar Configuration</h1>
          <p className="text-sm text-slate-500">
            Select an approved site survey, configure components, and generate the Bill of Materials (BOM).
          </p>
        </div>
        <Link to="/configurations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Configurations
          </Button>
        </Link>
      </div>

      {/* Wizard */}
      <ConfigurationWizard />
    </div>
  );
}

