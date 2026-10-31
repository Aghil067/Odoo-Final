/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────
 * Central authentication context for the entire application.
 *
 * WHAT THIS FILE DOES:
 *  Creates a React Context that holds:
 *   - The currently logged-in user (or null)
 *   - Loading and error states
 *   - login() and logout() actions
 *   - hasPermission() helper used by guards
 *
 * HOW TO USE:
 *  1. Wrap your app in <AuthProvider> (done in App.tsx)
 *  2. In any component: const { user, login, logout } = useAuth();
 *  3. To check permissions: const { hasPermission } = useAuth();
 *     hasPermission('inventory') → true | false
 *
 * ARCHITECTURE NOTE:
 *  AuthContext does not know about MockAuthService or RealAuthService.
 *  It only calls the IAuthService interface.  The concrete service is
 *  injected via the AuthProvider 'service' prop.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { canAccess } from '../../../config/permissions';
import type { IAuthService } from '../services/authService';
import type {
  AuthState,
  LoginRequest,
  ModuleKey,
  PermissionLevel,
} from '../types/auth.types';
import { getPermission } from '../../../config/permissions';

// ─── Context value type ─────────────────────────────────────────
export interface AuthContextValue extends AuthState {
  /** Attempt to log in with the given credentials. */
  login: (request: LoginRequest) => Promise<void>;
  /** Log out the current user and clear all auth state. */
  logout: () => Promise<void>;
  /**
   * Returns true if the current user can access the given module.
   * Always returns false if no user is logged in.
   */
  hasPermission: (module: ModuleKey) => boolean;
  /**
   * Returns the exact permission level for the current user's role.
   * Returns 'none' if no user is logged in.
   */
  getModulePermission: (module: ModuleKey) => PermissionLevel;
}

// ─── Create context ─────────────────────────────────────────────
/** Internal context – components should use useAuth(), not this directly. */
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
  /** Injected authentication service (mock or real). */
  service: IAuthService;
}

/**
 * AuthProvider
 *
 * Wrap the entire application in this component so that all
 * child components can access authentication state via useAuth().
 *
 * On mount, it calls service.getMe() to restore any existing
 * session (e.g. after a page refresh).
 */
export function AuthProvider({ children, service }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false, // becomes true after the initial session check
    error: null,
  });

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false; // prevent state updates if component unmounts

    async function restoreSession() {
      try {
        const response = await service.getMe();
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            user: response?.user ?? null,
            isInitialized: true,
          }));
        }
      } catch {
        // No valid session – that is fine, just mark as initialized
        if (!cancelled) {
          setState((prev) => ({ ...prev, isInitialized: true }));
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [service]);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(
    async (request: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await service.login(request);
        setState((prev) => ({
          ...prev,
          user: response.user,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please try again.';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          user: null,
        }));
        throw err; // re-throw so the LoginPage can react
      }
    },
    [service]
  );

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await service.logout();
    } finally {
      // Always clear local state, even if the server call fails
      setState({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    }
  }, [service]);

  // ── Permission helpers ────────────────────────────────────────
  const hasPermission = useCallback(
    (module: ModuleKey): boolean => {
      if (!state.user) return false;
      return canAccess(module, state.user.role);
    },
    [state.user]
  );

  const getModulePermission = useCallback(
    (module: ModuleKey): PermissionLevel => {
      if (!state.user) return 'none';
      return getPermission(module, state.user.role);
    },
    [state.user]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    hasPermission,
    getModulePermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Internal hook (not exported from here) ───────────────────
/**
 * Raw context accessor – export useAuth from hooks/useAuth.ts instead.
 * This separation makes the hook easy to find and document.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
