/**
 * PlaceholderPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Generic placeholder used for all modules not yet implemented.
 *
 * Displayed for: Customers, Site Survey, Solar Config, Inventory,
 * Installations, Technicians, Warranty, Service, Finance, User Mgmt.
 *
 * Each module will replace this with its real implementation
 * in subsequent sprints (M01, M02, …).
 *
 * Props:
 *  moduleName – display name of the module
 *  moduleKey  – used to show the current user's permission level
 */

import { Construction } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import type { ModuleKey } from '../auth/types/auth.types';

interface PlaceholderPageProps {
  moduleName: string;
  moduleKey: ModuleKey;
}

export function PlaceholderPage({ moduleName, moduleKey }: PlaceholderPageProps) {
  const { getModulePermission } = useAuth();
  const level = getModulePermission(moduleKey);

  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center p-8">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{moduleName}</h2>
      <p className="text-slate-500 max-w-sm mb-4">
        This module is not yet implemented. It will be built in a future sprint.
      </p>
      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm text-slate-600">
        <span>Your access level:</span>
        <span className="font-semibold capitalize">
          {level === 'assigned_only' ? 'Assigned only' : level}
        </span>
      </div>
    </div>
  );
}

