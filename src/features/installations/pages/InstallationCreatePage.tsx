/**
 * InstallationCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper hosting the 5-step Installation Work Order Wizard.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { InstallationWizard } from '../components/InstallationWizard';

export function InstallationCreatePage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/installations"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Work Orders</span>
        </Link>
      </div>

      {/* 5-step wizard component */}
      <InstallationWizard />
    </div>
  );
}

