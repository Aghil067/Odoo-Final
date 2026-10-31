/**
 * UnauthorizedPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Displayed when an authenticated user tries to access a module
 * they do not have permission to view.
 */

import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_META } from '../../../config/roles';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-2">
          You do not have permission to access this page.
        </p>
        {user && (
          <p className="text-slate-400 text-sm mb-6">
            Your current role is{' '}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_META[user.role].badgeColour}`}>
              {ROLE_META[user.role].label}
            </span>
            {' '}which does not include this module.
          </p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300
                       rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400
                       transition-colors"
          >
            Go back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                       hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                       transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

