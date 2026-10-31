/**
 * useAuth.ts
 * ─────────────────────────────────────────────────────────────
 * The primary hook for accessing authentication state and actions.
 *
 * USAGE EXAMPLE:
 *
 *   import { useAuth } from '@/features/auth/hooks/useAuth';
 *
 *   function MyComponent() {
 *     const { user, login, logout, hasPermission } = useAuth();
 *
 *     if (!user) return <p>Not logged in</p>;
 *
 *     return (
 *       <div>
 *         <p>Hello, {user.name}</p>
 *         {hasPermission('finance') && <FinanceLink />}
 *         <button onClick={logout}>Log out</button>
 *       </div>
 *     );
 *   }
 *
 * AVAILABLE VALUES:
 *  user              → AuthenticatedUser | null
 *  isLoading         → boolean (true while login/logout is in flight)
 *  isInitialized     → boolean (true after initial session check)
 *  error             → string | null (last login error message)
 *  login(request)    → Promise<void>
 *  logout()          → Promise<void>
 *  hasPermission(m)  → boolean
 *  getModulePermission(m) → PermissionLevel
 */

import { useAuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';

/**
 * Returns the full authentication context.
 * Must be called inside a component wrapped by <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}

