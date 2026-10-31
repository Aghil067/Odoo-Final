/**
 * auth.test.tsx
 * ─────────────────────────────────────────────────────────────
 * Tests for the authentication system (M00).
 *
 * Test cases:
 *  1. Successful mock login (admin)
 *  2. Invalid credentials return error
 *  3. Logout clears auth state
 *  4. Session restore (getMe) returns user from sessionStorage
 *  5. ProtectedRoute redirects unauthenticated users to /login
 *  6. ProtectedRoute renders children when authenticated
 *  7. ProtectedRoute redirects to /unauthorized when lacking permission
 *  8. Permission helpers: hasPermission returns correct values
 *  9. getModulePermission returns correct level
 * 10. Sidebar filters nav items by role
 *
 * Framework: Vitest + React Testing Library
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../features/auth/context/AuthContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import { mockAuthService, MOCK_ACCOUNT_LIST } from '../features/auth/services/mockAuthService';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { canAccess, getPermission } from '../config/permissions';

// ─── Helpers ────────────────────────────────────────────────────

/** Renders children inside AuthProvider (using mock service) + MemoryRouter. */
function renderWithAuth(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
    <AuthProvider service={mockAuthService}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  );
}

/** A simple component that displays auth state for testing. */
function AuthDisplay() {
  const { user, error, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'idle'}</span>
    </div>
  );
}

/** A simple component that triggers login, swallowing re-thrown errors. */
function LoginTrigger({ email, password }: { email: string; password: string }) {
  const { login, logout } = useAuth();
  return (
    <>
      <button
        onClick={() =>
          login({ email, password }).catch(() => {
            /* AuthContext re-throws for page-level error handling;
               in tests we swallow it – the error state is checked via AuthDisplay */
          })
        }
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </>
  );
}

// Clear sessionStorage between tests
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

// ─── Test suites ────────────────────────────────────────────────

describe('MockAuthService', () => {
  it('1. Successful login returns admin user', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    const response = await mockAuthService.login({ email: admin.email, password: admin.password });
    expect(response.user.role).toBe('admin');
    expect(response.user.email).toBe('admin@solar-demo.com');
  });

  it('2. Invalid credentials throw an error', async () => {
    await expect(
      mockAuthService.login({ email: 'wrong@example.com', password: 'badpass' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('3. Logout clears the session', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    await mockAuthService.login({ email: admin.email, password: admin.password });
    await mockAuthService.logout();
    const me = await mockAuthService.getMe();
    expect(me).toBeNull();
  });

  it('4. getMe restores session from sessionStorage', async () => {
    const sales = MOCK_ACCOUNT_LIST.find((a) => a.role === 'sales_executive')!;
    await mockAuthService.login({ email: sales.email, password: sales.password });
    const me = await mockAuthService.getMe();
    expect(me?.user.role).toBe('sales_executive');
  });
});

describe('AuthContext – state management', () => {
  it('5. User is null before login', async () => {
    renderWithAuth(
      <>
        <AuthDisplay />
      </>
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });

  it('6. Login sets user in context', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    renderWithAuth(
      <>
        <AuthDisplay />
        <LoginTrigger email={admin.email} password={admin.password} />
      </>
    );
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('admin@solar-demo.com')
    );
    expect(screen.getByTestId('role').textContent).toBe('admin');
  });

  it('7. Invalid login sets error in context', async () => {
    renderWithAuth(
      <>
        <AuthDisplay />
        <LoginTrigger email="bad@email.com" password="wrong" />
      </>
    );
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toContain('Invalid email or password')
    );
  });

  it('8. Logout clears user from context', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    renderWithAuth(
      <>
        <AuthDisplay />
        <LoginTrigger email={admin.email} password={admin.password} />
      </>
    );
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('admin@solar-demo.com')
    );
    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });
});

describe('Permission helpers', () => {
  it('9. Admin has full access to all modules', () => {
    const modules = [
      'dashboard', 'customers', 'site_survey', 'solar_configuration',
      'inventory', 'installations', 'technicians', 'warranty',
      'service_management', 'finance', 'user_management',
    ] as const;
    modules.forEach((mod) => {
      expect(getPermission(mod, 'admin')).toBe('full');
    });
  });

  it('10. Finance officer cannot access user_management', () => {
    expect(canAccess('user_management', 'finance_officer')).toBe(false);
    expect(getPermission('user_management', 'finance_officer')).toBe('none');
  });

  it('11. Sales executive has full access to customers', () => {
    expect(getPermission('customers', 'sales_executive')).toBe('full');
  });

  it('12. Technician has assigned_only access to installations', () => {
    expect(getPermission('installations', 'technician')).toBe('assigned_only');
  });

  it('13. Inventory manager has no access to customers', () => {
    expect(canAccess('customers', 'inventory_manager')).toBe(false);
  });
});

describe('ProtectedRoute', () => {
  it('14. Redirects unauthenticated user to /login', async () => {
    const { container } = render(
      <AuthProvider service={mockAuthService}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('Login Page');
    });
  });

  it('15. Renders child route when user is authenticated', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    // Pre-populate session
    await mockAuthService.login({ email: admin.email, password: admin.password });

    const { container } = render(
      <AuthProvider service={mockAuthService}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('Dashboard Content');
    });
  });

  it('16. Redirects to /unauthorized when user lacks module permission', async () => {
    const finance = MOCK_ACCOUNT_LIST.find((a) => a.role === 'finance_officer')!;
    await mockAuthService.login({ email: finance.email, password: finance.password });

    const { container } = render(
      <AuthProvider service={mockAuthService}>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedRoute module="user_management" />}>
                <Route path="/users" element={<div>Users Content</div>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('Unauthorized Page');
    });
  });
});

describe('PermissionGuard', () => {
  it('17. Shows children when user has sufficient permission', async () => {
    const admin = MOCK_ACCOUNT_LIST.find((a) => a.role === 'admin')!;
    await mockAuthService.login({ email: admin.email, password: admin.password });

    const { container } = render(
      <AuthProvider service={mockAuthService}>
        <MemoryRouter>
          <PermissionGuard module="finance" require="full">
            <span>Finance Content</span>
          </PermissionGuard>
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('Finance Content');
    });
  });

  it('18. Shows fallback when user lacks permission', async () => {
    const sales = MOCK_ACCOUNT_LIST.find((a) => a.role === 'sales_executive')!;
    await mockAuthService.login({ email: sales.email, password: sales.password });

    const { container } = render(
      <AuthProvider service={mockAuthService}>
        <MemoryRouter>
          <PermissionGuard module="finance" require="full" fallback={<span>No Access</span>}>
            <span>Finance Content</span>
          </PermissionGuard>
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('No Access');
      expect(container.textContent).not.toContain('Finance Content');
    });
  });
});

describe('MOCK_ACCOUNT_LIST', () => {
  it('19. Contains one account per role (8 total)', () => {
    expect(MOCK_ACCOUNT_LIST).toHaveLength(8);
    const roles = MOCK_ACCOUNT_LIST.map((a) => a.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('sales_executive');
    expect(roles).toContain('surveyor');
    expect(roles).toContain('inventory_manager');
    expect(roles).toContain('installation_manager');
    expect(roles).toContain('technician');
    expect(roles).toContain('finance_officer');
    expect(roles).toContain('service_manager');
  });
});
