// Session authentication contract. Test doubles live only in src/tests/fixtures.
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

