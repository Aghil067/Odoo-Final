/**
 * authService.ts
 * ─────────────────────────────────────────────────────────────
 * AUTH SERVICE INTERFACE
 *
 * This file defines the contract that both:
 *  - MockAuthService (development/testing)
 *  - RealAuthService (production, once backend is ready)
 * must implement.
 *
 * Switching from mock → real authentication requires:
 *  1. Create a new class implementing IAuthService
 *  2. Change the export in providers/AuthProvider.tsx
 *  3. No other file needs to change
 *
 * HOW TOKEN STORAGE WORKS (overview):
 *  Prefer HTTP-only cookies (set by the backend) – they are not
 *  accessible to JavaScript and reduce XSS risk significantly.
 *  If the backend returns tokens in JSON, store them in memory
 *  (module-level variable), NOT localStorage.
 *  This file intentionally does not commit to a storage strategy
 *  until the backend developer confirms the approach.
 */

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
} from '../types/auth.types';

/**
 * The authentication service interface.
 *
 * Every method returns a Promise so it works identically whether
 * the implementation talks to a real API or returns mock data.
 */
export interface IAuthService {
  /**
   * Authenticate with email and password.
   * Throws an Error with a user-friendly message on failure.
   */
  login(request: LoginRequest): Promise<LoginResponse>;

  /**
   * Invalidate the current session.
   * Should clear any stored tokens and call the backend logout endpoint.
   */
  logout(): Promise<void>;

  /**
   * Fetch the currently authenticated user from the server.
   * Returns null if no valid session exists (unauthenticated).
   * Used on application load to restore session state.
   */
  getMe(): Promise<MeResponse | null>;
}

