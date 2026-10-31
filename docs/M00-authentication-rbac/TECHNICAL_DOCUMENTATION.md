# M00 – Technical Documentation
## Solar Installation Management System — Authentication & RBAC Foundation

---

## 1. Architecture Overview

M00 establishes the **authentication foundation** on which all future modules (M01–Mxx) will be built. It follows a **layered architecture**:

```
┌──────────────────────────────────────────────────────┐
│  UI Layer          Pages, Layout, Guards              │
├──────────────────────────────────────────────────────┤
│  State Layer       AuthContext, useAuth hook          │
├──────────────────────────────────────────────────────┤
│  Service Layer     IAuthService interface             │
│                    ├── MockAuthService (dev)          │
│                    └── RealAuthService (future)       │
├──────────────────────────────────────────────────────┤
│  Config Layer      roles.ts, permissions.ts,          │
│                    navigation.ts                      │
├──────────────────────────────────────────────────────┤
│  API Layer         apiClient.ts (Axios stub)          │
└──────────────────────────────────────────────────────┘
```

The key design principle: **no layer talks to a layer more than one step away**. Components use `useAuth`, which reads from `AuthContext`, which calls `IAuthService`. Components never call services directly.

---

## 2. Project Folder Structure

```
d:\hyyydddeee\
├── index.html
├── vite.config.ts
├── tsconfig.app.json
├── package.json
├── docs/
│   └── M00-authentication-rbac/
│       ├── TECHNICAL_DOCUMENTATION.md   ← this file
│       ├── FEATURES_DOCUMENTATION.md
│       ├── CODE_EXPLANATION.md
│       ├── BACKEND_INTEGRATION.md
│       └── TESTING.md
└── src/
    ├── main.tsx                         Entry point
    ├── styles/
    │   └── index.css                    Tailwind CSS import
    ├── app/
    │   ├── App.tsx                      Root component
    │   └── router.tsx                   All route definitions
    ├── config/
    │   ├── roles.ts                     Role metadata (labels, badge colours)
    │   ├── permissions.ts               Permission matrix
    │   └── navigation.ts                Sidebar nav items
    ├── components/
    │   ├── common/
    │   │   ├── ProtectedRoute.tsx       Authentication + module guard
    │   │   └── PermissionGuard.tsx      Inline permission guard
    │   └── layout/
    │       ├── AppLayout.tsx            App shell (sidebar + topbar)
    │       ├── Sidebar.tsx              Role-filtered navigation
    │       └── Topbar.tsx               Page title, user info, logout
    ├── features/
    │   ├── auth/
    │   │   ├── context/
    │   │   │   └── AuthContext.tsx      AuthProvider + useAuthContext
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts           Public hook
    │   │   ├── pages/
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── UnauthorizedPage.tsx
    │   │   │   └── NotFoundPage.tsx
    │   │   ├── services/
    │   │   │   ├── authService.ts       IAuthService interface
    │   │   │   └── mockAuthService.ts   Development implementation
    │   │   └── types/
    │   │       └── auth.types.ts        All TypeScript interfaces
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx        Welcome screen (M00 version)
    │   └── placeholders/
    │       └── PlaceholderPage.tsx      Future module placeholder
    ├── services/
    │   └── apiClient.ts                 Axios instance (backend-ready stub)
    └── tests/
        ├── setup.ts                     jest-dom setup
        └── auth.test.tsx                All M00 tests (19 cases)
```

---

## 3. Technologies Used

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component library |
| TypeScript | 7 | Type safety, catch bugs at compile time |
| Vite | 8 | Build tool, dev server, HMR |
| Tailwind CSS | 4 | Utility-first CSS (via `@tailwindcss/vite`) |
| React Router DOM | 7 | Client-side routing and navigation |
| Lucide React | latest | Clean, consistent icon set |
| Axios | 1.x | HTTP client (configured but unused until backend) |
| Vitest | 5 | Test runner (Vite-native, fast) |
| React Testing Library | 16 | Component testing in a real DOM |

**Why not Redux?** Authentication state is global but simple. React Context API is sufficient and avoids adding a heavy dependency.

**Why Axios over fetch?** Axios provides interceptors for token injection and refresh, consistent error objects, and request timeout support — all needed for production backend integration.

---

## 4. Authentication Flow

### 4.1 Login Flow

```
User enters credentials → LoginPage calls useAuth().login()
  → AuthContext.login() calls IAuthService.login()
    → MockAuthService: validates credentials, saves to sessionStorage
    → AuthContext: sets user in state
  → React Router redirects to /dashboard (or original destination)
```

### 4.2 Session Restore (page refresh)

```
App mounts → AuthProvider calls service.getMe()
  → MockAuthService: reads sessionStorage
  → AuthContext: sets isInitialized = true
    → if user found: user is restored, redirected to requested page
    → if no user: redirected to /login
```

### 4.3 Logout Flow

```
User clicks Logout → useAuth().logout()
  → AuthContext.logout() calls IAuthService.logout()
    → MockAuthService: clears sessionStorage
    → AuthContext: resets user to null
  → React Router redirects to /login
```

---

## 5. Role and Permission Architecture

### 5.1 Single Source of Truth

All permission data lives in three files:

| File | Contains |
|---|---|
| `auth.types.ts` | `UserRole` union type, `PermissionLevel` type, `ModuleKey` type |
| `config/roles.ts` | Display labels and badge colours per role |
| `config/permissions.ts` | The full permission matrix + helper functions |

**Never hard-code role strings or permission checks in components.** Always use the exported helpers.

### 5.2 Permission Matrix

The `PERMISSIONS` constant in `permissions.ts` is a nested record:

```typescript
PERMISSIONS[moduleKey][userRole] → PermissionLevel
```

Helper functions:
- `getPermission(module, role)` → `PermissionLevel`
- `canAccess(module, role)` → `boolean` (true if not 'none')
- `hasFull(module, role)` → `boolean`
- `isAssignedOnly(module, role)` → `boolean`

### 5.3 'assigned_only' Semantics

Frontend: Shows the module link and page but adds a visual indicator that scope is limited.
Backend: **Must filter records** to only those assigned to the requesting user. The frontend cannot enforce this.

---

## 6. Route Protection

Routes are protected at two levels:

### Level 1 – Authentication guard
```tsx
<Route element={<ProtectedRoute />}>
  {/* All routes here require login */}
</Route>
```

### Level 2 – Module permission guard
```tsx
<Route element={<ProtectedRoute module="finance" />}>
  <Route path="/finance" element={<FinancePage />} />
</Route>
```

If the user:
- Is not authenticated → redirected to `/login` (with `state.from` preserved)
- Is authenticated but lacks permission → redirected to `/unauthorized`
- Has permission → route renders normally

Directly entering a restricted URL is caught by `ProtectedRoute` — hiding sidebar links alone is not sufficient.

---

## 7. Component Responsibilities

| Component | Responsibility |
|---|---|
| `AuthProvider` | Holds auth state, exposes login/logout/permission helpers |
| `useAuth` | Public hook for accessing auth context |
| `ProtectedRoute` | Redirects unauthenticated or unauthorised users |
| `PermissionGuard` | Conditionally renders UI elements by permission level |
| `AppLayout` | Shell: sidebar + topbar + page outlet |
| `Sidebar` | Filters nav items by user role, highlights active route |
| `Topbar` | Shows page title, user info (name, role badge), logout |
| `LoginPage` | Email/password form, validation, dev credentials panel |
| `DashboardPage` | Welcome screen with accessible/restricted module overview |
| `PlaceholderPage` | Stub for unimplemented modules |
| `UnauthorizedPage` | Access denied screen with back/dashboard navigation |
| `NotFoundPage` | 404 page |

---

## 8. State Management

Authentication state (`AuthState`) is managed in `AuthContext`:

```typescript
interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
```

`isInitialized` is set to `true` after the first `getMe()` call resolves. `ProtectedRoute` shows a spinner until `isInitialized` is true, preventing a flash-of-login-redirect on page refresh.

No other global state management library is used for M00.

---

## 9. API Integration Architecture

The `IAuthService` interface defines three methods:
- `login(request)` → `Promise<LoginResponse>`
- `logout()` → `Promise<void>`
- `getMe()` → `Promise<MeResponse | null>`

`MockAuthService` implements this interface for development. `RealAuthService` (to be written by the backend developer or when integrating) will implement the same interface using `apiClient.ts`.

`AuthProvider` receives the service as a prop:
```tsx
<AuthProvider service={mockAuthService}>
```

Switching to production: change one import in `App.tsx`.

---

## 10. Security Limitations

> **Important for hackathon judges and developers:**

Frontend route guards and permission checks are **UX improvements, not security boundaries**.

- Any user who can open DevTools can modify JavaScript state.
- sessionStorage can be read by any script on the page.
- The permission matrix enforces nothing server-side.

**The backend developer must:**
- Validate JWT / session tokens on every protected endpoint.
- Check the user's role/permissions on every API call.
- Return 401 for unauthenticated requests.
- Return 403 for authorised users accessing forbidden resources.
- Filter 'assigned_only' records server-side.

---

## 11. How Future Modules Will Use This Foundation

Every new module follows this checklist:

1. **Add a `ModuleKey`** to `auth.types.ts`.
2. **Add permissions** to `permissions.ts` (no other file changes for permissions).
3. **Add a nav item** to `navigation.ts`.
4. **Create the feature folder** in `src/features/<module>/`.
5. **Add a protected route** in `router.tsx`:
   ```tsx
   <Route element={<ProtectedRoute module="my_module" />}>
     <Route path="/my-module" element={<MyModulePage />} />
   </Route>
   ```
6. **Use `useAuth()`** in page components for user data and permission checks.
7. **Use `PermissionGuard`** to conditionally render create/edit/delete buttons.
8. **Call `apiClient`** for all HTTP requests.

No changes to `AuthContext`, `ProtectedRoute`, or the auth service are required for adding a new module.

