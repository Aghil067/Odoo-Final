/**
 * DashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * M00 Dashboard – welcome screen after login.
 *
 * NOTE: This is a placeholder.  Dashboard analytics (charts,
 * KPIs, recent activity) will be implemented in M01.
 *
 * Currently displays:
 *  - Personalised welcome message with user name and role
 *  - Summary cards for modules the user can access
 *  - A clear "M00 only" development notice
 */

import { CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';
import { ROLE_META } from '../../config/roles';
import { useAuth } from '../auth/hooks/useAuth';

export function DashboardPage() {
  const { user, hasPermission, getModulePermission } = useAuth();

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];

  // Separate accessible and inaccessible modules for display
  const modules = NAV_ITEMS.filter((item) => item.id !== 'dashboard');
  const accessible = modules.filter((item) => hasPermission(item.module));
  const restricted = modules.filter((item) => !hasPermission(item.module));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-green-400 text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-slate-300 mt-1 text-sm">
              You are signed in as{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${roleMeta.badgeColour}`}>
                {roleMeta.label}
              </span>
            </p>
            <p className="text-slate-400 text-xs mt-1">{roleMeta.description}</p>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Development notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>M00 – Authentication & RBAC Foundation</strong>
        <p className="mt-1 text-blue-600">
          Dashboard analytics will be implemented in Module M01.
          This screen demonstrates role-based access: you can see only the modules your role permits.
        </p>
      </div>

      {/* Accessible modules */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Your accessible modules ({accessible.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accessible.map((item) => {
            const level = getModulePermission(item.module);
            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200
                           hover:border-green-400 hover:shadow-md transition-all duration-150
                           focus:outline-none focus:ring-2 focus:ring-green-500 group"
              >
                <div className="w-9 h-9 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{item.label}</p>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">
                    {level === 'assigned_only' ? 'Assigned only' : level}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Restricted modules */}
      {restricted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Restricted modules ({restricted.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {restricted.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 opacity-60"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-500 text-sm truncate">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">No access</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

