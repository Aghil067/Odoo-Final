# M00 – Code Explanation
## Solar Installation Management System — Beginner-Friendly Guide

This document explains every major piece of code in M00 in plain language, with real code snippets from the implementation.

---

## 1. What is AuthContext?

**`src/features/auth/context/AuthContext.tsx`**

`AuthContext` is a React "shared storage box" that any component in the app can read from. It holds:
- Who is logged in (`user`)
- Whether a login request is happening right now (`isLoading`)
- Whether the app has finished checking if a session exists (`isInitialized`)
- The last error message from a failed login (`error`)

It also holds functions that components can call:
- `login()` — sign in
- `logout()` — sign out
- `hasPermission(module)` — check if the user can access a module
- `getModulePermission(module)` — get the exact permission level

### Code snippet – creating the context

```typescript
// AuthContext.tsx

// Step 1: Define what data the context will hold
export interface AuthContextValue extends AuthState {
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: ModuleKey) => boolean;
  getModulePermission: (module: ModuleKey) => PermissionLevel;
}

// Step 2: Create the context (starts as null — no data yet)
export const AuthContext = createContext<AuthContextValue | null>(null);
```

`createContext` creates the "box". It starts empty (`null`). The `AuthProvider` component fills it with real data.

### Code snippet – the AuthProvider

```typescript
// AuthContext.tsx

export function AuthProvider({ children, service }: AuthProviderProps) {
  // useState holds the auth state in memory
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });

  // When the app starts, check if a session already exists
  useEffect(() => {
    async function restoreSession() {
      const response = await service.getMe();
      setState((prev) => ({
        ...prev,
        user: response?.user ?? null,
        isInitialized: true, // ← tells ProtectedRoute we are done checking
      }));
    }
    restoreSession();
  }, [service]);

  // Wrap children in the provider so they can read context
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

`useEffect` runs once when the app loads. It calls `service.getMe()` to see if there is an existing session. If yes, it sets the user. Either way, it sets `isInitialized = true` so the rest of the app knows it's safe to check permissions.

---

## 2. What does useAuth do?

**`src/features/auth/hooks/useAuth.ts`**

`useAuth` is a hook — a function that components call to get data from `AuthContext`.

```typescript
// useAuth.ts

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthContext(); // reads from AuthContext
}
```

Usage in a component:

```typescript
function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Hello, {user?.name}</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
```

The hook throws an error if you use it outside `<AuthProvider>`. This prevents silent bugs.

---

## 3. How does ProtectedRoute work?

**`src/components/common/ProtectedRoute.tsx`**

`ProtectedRoute` is a gatekeeper component. It sits between the router and a page, and decides whether the user is allowed to see the page.

```typescript
// ProtectedRoute.tsx

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { user, isInitialized, hasPermission } = useAuth();
  const location = useLocation();

  // Step 1: Not finished loading yet → show spinner
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // Step 2: Not logged in → redirect to /login
  // We save 'location' so after login, we can bring the user back here
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Step 3: Logged in but lacks permission → redirect to /unauthorized
  if (module && !hasPermission(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Step 4: All checks passed → show the actual page
  return <Outlet />;
}
```

`<Outlet />` is a React Router concept — it renders whatever child route is matched. Think of `ProtectedRoute` as a door: it only opens the door (`<Outlet />`) if all checks pass.

In `router.tsx`:

```tsx
// router.tsx

<Route element={<ProtectedRoute module="finance" />}>
  <Route path="/finance" element={<FinancePage />} />
</Route>
```

Here, `ProtectedRoute` checks `hasPermission('finance')` before showing `FinancePage`.

---

## 4. How does PermissionGuard work?

**`src/components/common/PermissionGuard.tsx`**

`PermissionGuard` is for hiding **individual UI elements** (like buttons) based on permissions. It's lighter than `ProtectedRoute` (which is for whole pages).

```typescript
// PermissionGuard.tsx

export function PermissionGuard({ module, require = 'view', children, fallback = null }) {
  const { getModulePermission } = useAuth();
  const actual = getModulePermission(module);

  // If user has no access at all, show the fallback (or nothing)
  if (actual === 'none') return <>{fallback}</>;

  // If user's level is too low, show the fallback
  if (!meetsRequirement(actual, require)) return <>{fallback}</>;

  // Otherwise, show the children
  return <>{children}</>;
}
```

Example usage — show a Delete button only to users with `full` access:

```tsx
<PermissionGuard module="customers" require="full">
  <DeleteButton />
</PermissionGuard>
```

If the user is a Surveyor (who has `view` access to customers), `DeleteButton` is never rendered.

---

## 5. How does the permission matrix work?

**`src/config/permissions.ts`**

The permission matrix is a JavaScript object with two levels of keys:
1. Module name (e.g. `'finance'`)
2. Role name (e.g. `'technician'`)

The value is the permission level.

```typescript
// permissions.ts

export const PERMISSIONS = {
  finance: {
    admin:                'full',
    sales_executive:      'none',  // ← sales cannot see Finance
    technician:           'none',
    finance_officer:      'full',  // ← finance officer has full access
    installation_manager: 'view',
    // ...
  },
  // other modules...
};
```

Helper functions make it easy to query:

```typescript
// "Can the technician access inventory?"
canAccess('inventory', 'technician');    // → true (assigned_only ≠ none)

// "What exact level does the surveyor have for customers?"
getPermission('customers', 'surveyor'); // → 'view'

// "Does the admin have full control of finance?"
hasFull('finance', 'admin');            // → true
```

To change a permission: edit one line in `PERMISSIONS`. The entire UI updates automatically.

---

## 6. How are sidebar items filtered?

**`src/components/layout/Sidebar.tsx`**

The sidebar reads the full list of navigation items from `navigation.ts` and filters out any item the current user cannot access.

```typescript
// Sidebar.tsx

const { hasPermission } = useAuth(); // get the permission check function

// Keep only items where the user has at least 'view' access
const accessibleItems = NAV_ITEMS.filter((item) =>
  hasPermission(item.module) // calls canAccess() internally
);
```

Then it renders only `accessibleItems`:

```tsx
{accessibleItems.map((item) => (
  <NavLink key={item.id} to={item.path}>
    {item.label}
  </NavLink>
))}
```

A Technician who has `none` access to Finance will simply never see the Finance link — `filter()` removed it from the list.

---

## 7. How does login work (end-to-end)?

```
1. User fills form → clicks "Sign in"
2. LoginPage calls:   useAuth().login({ email, password })
3. AuthContext.login calls: service.login({ email, password })
4. MockAuthService:
   - Finds the user in MOCK_USERS by email
   - Compares password
   - If match → saves user to sessionStorage → returns LoginResponse
   - If no match → throws Error('Invalid email or password')
5. AuthContext:
   - On success → sets state.user = response.user
   - On failure → sets state.error = errorMessage, re-throws
6. LoginPage:
   - On success → navigate('/dashboard')
   - On failure → error is displayed via state.error (from AuthContext)
```

The `re-throw` in step 6 is intentional: it lets the page react (disable button, keep form open). The error message is already stored in `AuthContext.error` so components just read it.

---

## 8. How does logout work (end-to-end)?

```
1. User clicks Logout in Topbar
2. Topbar calls: useAuth().logout()
3. AuthContext.logout calls: service.logout()
4. MockAuthService: removes user from sessionStorage
5. AuthContext: sets state.user = null (even if server call fails)
6. React Router: sees user is null → ProtectedRoute redirects to /login
```

Step 5 uses a `finally` block so the user is always logged out locally, even if the server is down.

---

## Summary Table

| File | What it is | One-line purpose |
|---|---|---|
| `auth.types.ts` | TypeScript interfaces | Defines the shape of all auth data |
| `roles.ts` | Config | Display names and badge colours for each role |
| `permissions.ts` | Config | The permission matrix — who can do what |
| `navigation.ts` | Config | Sidebar items linked to module keys |
| `authService.ts` | Interface | Contract for auth services (mock or real) |
| `mockAuthService.ts` | Service | Fake authentication for development |
| `AuthContext.tsx` | React Context | Shared auth state for the whole app |
| `useAuth.ts` | Hook | Easy way to read auth state in components |
| `ProtectedRoute.tsx` | Guard | Protects whole pages from unauthorised access |
| `PermissionGuard.tsx` | Guard | Hides individual UI elements by permission level |
| `Sidebar.tsx` | UI | Shows only the nav items the user can access |
| `router.tsx` | Routing | Defines all app routes with their guards |

