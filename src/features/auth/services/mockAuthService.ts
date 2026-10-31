/**
 * mockAuthService.ts
 * ─────────────────────────────────────────────────────────────
 * ⚠️  DEVELOPMENT / TESTING ONLY
 *
 * This service simulates backend authentication using hard-coded
 * test accounts.  It MUST NOT be used in production.
 *
 * The mock accounts and password defined here are fictional and
 * only exist for UI development and hackathon demonstration.
 *
 * HOW TO SWITCH TO REAL AUTHENTICATION:
 *  Replace the import in src/app/providers/AuthProvider.tsx:
 *    import { mockAuthService as authService } from './mockAuthService';
 *  with:
 *    import { realAuthService as authService } from './realAuthService';
 *
 * Nothing else needs to change – both services implement IAuthService.
 */

import type { IAuthService } from './authService';
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  MeResponse,
  UserRole,
} from '../types/auth.types';

// ─── Development-only password ─────────────────────────────────
/** Single password shared by all mock accounts. Development only. */
const MOCK_PASSWORD = 'Solar@Demo2024';

// ─── Mock user accounts ────────────────────────────────────────
/**
 * One test account per role.
 * These credentials are fictional and for UI development only.
 */
const MOCK_USERS: Record<string, AuthenticatedUser & { password: string }> = {
  'admin@solar-demo.com': {
    id: 'mock-user-001',
    email: 'admin@solar-demo.com',
    name: 'Alex Administrator',
    role: 'admin' as UserRole,
    password: MOCK_PASSWORD,
  },
  'sales@solar-demo.com': {
    id: 'mock-user-002',
    email: 'sales@solar-demo.com',
    name: 'Sam Sales',
    role: 'sales_executive' as UserRole,
    password: MOCK_PASSWORD,
  },
  'surveyor@solar-demo.com': {
    id: 'mock-user-003',
    email: 'surveyor@solar-demo.com',
    name: 'Sara Surveyor',
    role: 'surveyor' as UserRole,
    password: MOCK_PASSWORD,
  },
  'inventory@solar-demo.com': {
    id: 'mock-user-004',
    email: 'inventory@solar-demo.com',
    name: 'Ivan Inventory',
    role: 'inventory_manager' as UserRole,
    password: MOCK_PASSWORD,
  },
  'installation@solar-demo.com': {
    id: 'mock-user-005',
    email: 'installation@solar-demo.com',
    name: 'Iris Installation',
    role: 'installation_manager' as UserRole,
    password: MOCK_PASSWORD,
  },
  'technician@solar-demo.com': {
    id: 'mock-user-006',
    email: 'technician@solar-demo.com',
    name: 'Tom Technician',
    role: 'technician' as UserRole,
    password: MOCK_PASSWORD,
  },
  'finance@solar-demo.com': {
    id: 'mock-user-007',
    email: 'finance@solar-demo.com',
    name: 'Fiona Finance',
    role: 'finance_officer' as UserRole,
    password: MOCK_PASSWORD,
  },
  'service@solar-demo.com': {
    id: 'mock-user-008',
    email: 'service@solar-demo.com',
    name: 'Steve Service',
    role: 'service_manager' as UserRole,
    password: MOCK_PASSWORD,
  },
};

// ─── Public list for the dev credentials panel ─────────────────
/** Exported so the LoginPage dev panel can list all mock accounts. */
export const MOCK_ACCOUNT_LIST = Object.values(MOCK_USERS).map(
  ({ email, role, name }) => ({ email, role, name, password: MOCK_PASSWORD })
);

// ─── In-memory session ─────────────────────────────────────────
/**
 * Simulates a server session.  The current user is stored in memory
 * only – it is lost on page refresh (which is realistic for a
 * session-cookie-based backend).
 *
 * For development convenience, we also persist to sessionStorage
 * so a hot-reload does not log the developer out.
 */
const SESSION_KEY = '__solar_demo_session__';

function saveSession(user: AuthenticatedUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function loadSession(): AuthenticatedUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Service implementation ────────────────────────────────────
/** Simulates network delay for realistic UX testing. */
function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAuthService: IAuthService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    await delay(); // simulate network round-trip

    const candidate = MOCK_USERS[request.email.toLowerCase().trim()];

    if (!candidate || candidate.password !== request.password) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // Extract the user object (omit the password field)
    const { password: _password, ...user } = candidate;

    saveSession(user);

    return {
      // Mock tokens – would be JWTs in production
      accessToken: `mock-access-token-for-${user.id}`,
      expiresIn: 3600,
      user,
    };
  },

  async logout(): Promise<void> {
    await delay(200);
    clearSession();
  },

  async getMe(): Promise<MeResponse | null> {
    await delay(300);
    const user = loadSession();
    return user ? { user } : null;
  },
};

