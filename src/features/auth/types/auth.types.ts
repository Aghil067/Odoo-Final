/**
 * auth.types.ts
 * ─────────────────────────────────────────────────────────────
 * Central TypeScript interfaces for the authentication system.
 *
 * All API request/response shapes are marked @provisional –
 * confirm with the backend developer before treating them as
 * final contracts.
 *
 * These types are shared across:
 *  - AuthContext
 *  - authService
 *  - ProtectedRoute / PermissionGuard
 *  - API client layer
 */

// ─── User Roles ────────────────────────────────────────────────
/**
 * All valid user roles in the system.
 * Source of truth for role strings – never hard-code strings elsewhere.
 */
export type UserRole =
  | 'admin'
  | 'sales_executive'
  | 'surveyor'
  | 'inventory_manager'
  | 'installation_manager'
  | 'technician'
  | 'finance_officer'
  | 'service_manager';

// ─── Permission Levels ─────────────────────────────────────────
/**
 * Granular permission level for a single module.
 *  full          → view + create + edit + delete
 *  view          → read-only
 *  assigned_only → access limited to records assigned to the user
 *  none          → no access at all
 */
export type PermissionLevel = 'full' | 'view' | 'assigned_only' | 'none';

// ─── Module Keys ───────────────────────────────────────────────
/** All feature modules. Used as keys in the permission matrix. */
export type ModuleKey =
  | 'dashboard'
  | 'customers'
  | 'site_survey'
  | 'solar_configuration'
  | 'inventory'
  | 'installations'
  | 'technicians'
  | 'warranty'
  | 'service_management'
  | 'finance'
  | 'user_management';

// ─── Authenticated User ─────────────────────────────────────────
/**
 * Represents the logged-in user stored in AuthContext.
 * @provisional – field names to be confirmed with backend developer.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Avatar URL – optional; falls back to initials if absent */
  avatarUrl?: string;
}

// ─── Auth State ─────────────────────────────────────────────────
/** Shape of the authentication slice of application state. */
export interface AuthState {
  /** null when not logged in */
  user: AuthenticatedUser | null;
  /** true while a login or session-refresh request is in flight */
  isLoading: boolean;
  /** true once the initial session check has completed */
  isInitialized: boolean;
  /** Human-readable error message from the last failed login */
  error: string | null;
}

// ─── API Request / Response Shapes ────────────────────────────
/**
 * Body sent to POST /api/auth/login
 * @provisional
 */
export interface LoginRequest {
  email: string;
  password: string;
  /** Whether the client should request a long-lived session */
  rememberMe?: boolean;
}

/**
 * Body returned by POST /api/auth/login
 * @provisional
 *
 * NOTE: Prefer HTTP-only cookies for token storage when the backend
 * supports them.  If the backend returns tokens in JSON, store them
 * in memory (not localStorage) to reduce XSS risk.
 */
export interface LoginResponse {
  /** @provisional – backend may omit if using HTTP-only cookies */
  accessToken?: string;
  /** @provisional */
  refreshToken?: string;
  /** @provisional – seconds until accessToken expires */
  expiresIn?: number;
  user: AuthenticatedUser;
}

/**
 * Body returned by GET /api/auth/me
 * @provisional
 */
export interface MeResponse {
  user: AuthenticatedUser;
}

/**
 * Body sent to POST /api/auth/refresh
 * @provisional
 */
export interface RefreshRequest {
  refreshToken: string;
}

/**
 * Body returned by POST /api/auth/refresh
 * @provisional
 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

