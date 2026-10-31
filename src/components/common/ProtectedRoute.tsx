/**
 * ProtectedRoute.tsx
 * ─────────────────────────────────────────────────────────────
 * Route guard that enforces authentication AND module permissions.
 *
 * HOW IT WORKS:
 *  1. Wait for auth to initialize (show spinner during session check)
 *  2. If not authenticated → redirect to /login, preserving the
 *     original destination in location.state so login can redirect back
 *  3. If authenticated but lacks permission → redirect to /unauthorized
 *  4. Otherwise → render the child route
 *
 * USAGE (in router.tsx):
 *
 *   <Route element={<ProtectedRoute module="finance" />}>
 *     <Route path="/finance" element={<FinancePage />} />
 *   </Route>
 *
 *   // Route that just requires login (no specific module permission):
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 *
 * SECURITY NOTE:
 *  This component provides a good user experience but is NOT a
 *  security boundary.  Backend APIs must enforce their own
 *  authorization on every request.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { ModuleKey } from '../../features/auth/types/auth.types';

interface ProtectedRouteProps {
  /**
   * If provided, the user must have non-'none' permission for this
   * module to access the route.  If omitted, only authentication is
   * checked.
   */
  module?: ModuleKey;
}

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { user, isInitialized, hasPermission } = useAuth();
  const location = useLocation();

  // ── 1. Session not yet restored ───────────────────────────────
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // ── 2. Not authenticated ──────────────────────────────────────
  if (!user) {
    // Preserve the destination so LoginPage can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── 3. No permission for this module ─────────────────────────
  if (module && !hasPermission(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── 4. All checks passed – render the child route ─────────────
  return <Outlet />;
}

