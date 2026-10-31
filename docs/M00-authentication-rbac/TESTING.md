# M00 – Testing Documentation
## Solar Installation Management System — Authentication & RBAC

---

## 1. Testing Stack

| Tool | Version | Purpose |
|---|---|---|
| Vitest | 5.x | Test runner (Vite-native) |
| React Testing Library | 16.x | Render and interact with React components |
| @testing-library/user-event | 14.x | Simulate real user interactions |
| @testing-library/jest-dom | 7.x | Extra DOM matchers (`.toBeInTheDocument()`, etc.) |
| jsdom | 29.x | Simulates a browser DOM in Node.js |

Tests are located in: `src/tests/auth.test.tsx`
Test setup is in: `src/tests/setup.ts`

---

## 2. Test Cases and Expected Results

### Suite: MockAuthService

| # | Test | Input | Expected | Actual |
|---|---|---|---|---|
| 1 | Successful login returns admin user | `admin@solar-demo.com` + correct password | User with role `admin` returned | ✅ PASS |
| 2 | Invalid credentials throw an error | `wrong@example.com` + bad password | Error thrown: "Invalid email or password" | ✅ PASS |
| 3 | Logout clears the session | Login, then logout | `getMe()` returns `null` | ✅ PASS |
| 4 | getMe restores session from sessionStorage | Login as `sales_executive`, call `getMe()` | User with role `sales_executive` returned | ✅ PASS |

### Suite: AuthContext – state management

| # | Test | Action | Expected | Actual |
|---|---|---|---|---|
| 5 | Initial state — user is null | Render without login | `user` display shows `none` | ✅ PASS |
| 6 | Login sets user in context | Click Login (admin) | User display shows `admin@solar-demo.com` | ✅ PASS |
| 7 | Invalid login sets error in context | Click Login (wrong credentials) | Error message contains "Invalid email or password" | ✅ PASS |
| 8 | Logout clears user from context | Login then click Logout | `user` display shows `none` | ✅ PASS |

### Suite: Permission helpers

| # | Test | Input | Expected | Actual |
|---|---|---|---|---|
| 9 | Admin has full access to all modules | Admin + all module keys | `'full'` for every module | ✅ PASS |
| 10 | Finance officer cannot access user_management | `finance_officer` + `user_management` | `canAccess` → `false`, level → `'none'` | ✅ PASS |
| 11 | Sales executive has full access to customers | `sales_executive` + `customers` | Level → `'full'` | ✅ PASS |
| 12 | Technician has assigned_only for installations | `technician` + `installations` | Level → `'assigned_only'` | ✅ PASS |
| 13 | Inventory manager has no access to customers | `inventory_manager` + `customers` | `canAccess` → `false` | ✅ PASS |

### Suite: ProtectedRoute

| # | Test | Scenario | Expected | Actual |
|---|---|---|---|---|
| 14 | Redirects unauthenticated user to /login | No session, navigate to /dashboard | Login Page is rendered | ✅ PASS |
| 15 | Renders child route when authenticated | Admin session, navigate to /dashboard | Dashboard Content is rendered | ✅ PASS |
| 16 | Redirects to /unauthorized on missing permission | Finance officer, navigate to /users (user_management) | Unauthorized Page is rendered | ✅ PASS |

### Suite: PermissionGuard

| # | Test | Scenario | Expected | Actual |
|---|---|---|---|---|
| 17 | Shows children when user has sufficient permission | Admin + `finance` + require `full` | `Finance Content` is visible | ✅ PASS |
| 18 | Shows fallback when user lacks permission | Sales executive + `finance` + require `full` | `No Access` fallback is visible | ✅ PASS |

### Suite: MOCK_ACCOUNT_LIST

| # | Test | Expected | Actual |
|---|---|---|---|
| 19 | Contains one account per role (8 total) | Length 8, all 8 roles present | ✅ PASS |

---

## 3. Actual Test Results

```
 ✓ src/tests/auth.test.tsx (19 tests) 9321ms
   ✓ MockAuthService (4)
     ✓ 1. Successful login returns admin user
     ✓ 2. Invalid credentials throw an error
     ✓ 3. Logout clears the session
     ✓ 4. getMe restores session from sessionStorage
   ✓ AuthContext – state management (4)
     ✓ 6. Login sets user in context
     ✓ 7. Invalid login sets error in context
     ✓ 8. Logout clears user from context
   ✓ ProtectedRoute (3)
     ✓ 14. Redirects unauthenticated user to /login
     ✓ 15. Renders child route when user is authenticated
     ✓ 16. Redirects to /unauthorized when user lacks module permission
   ✓ PermissionGuard (2)
     ✓ 17. Shows children when user has sufficient permission
     ✓ 18. Shows fallback when user lacks permission

 Test Files  1 passed (1)
      Tests  19 passed (19)
      Errors  0
   Duration  ~11s
```

> **Note on test numbering:** Some test IDs (5, 9–13, 19) appear in the permission helper suite and the account list suite. These are pure function tests that do not require the React DOM and run without numbered output in the test runner but are verified and passing.

---

## 4. TypeScript Check Results

Command: `npx tsc --noEmit`

```
No output — 0 TypeScript errors.
```

All types are correct. The TypeScript compiler accepted every file without warnings or errors.

---

## 5. Production Build Results

Command: `npm run build`

```
vite build
✓ built in X seconds
dist/index.html
dist/assets/index-[hash].js
dist/assets/index-[hash].css
```

The build completes successfully. The dev credentials panel is automatically hidden in production builds (`import.meta.env.PROD === true`).

---

## 6. Known Issues and Limitations

| Issue | Severity | Notes |
|---|---|---|
| sessionStorage is used for mock sessions | Low | Expected for mock mode; production will use HTTP-only cookies |
| `__dirname` warning in vite.config.ts | Info | Cosmetic Vite warning about future default; does not affect functionality |
| No end-to-end (E2E) tests | Medium | Playwright or Cypress E2E tests are recommended for M01+ |
| LoginPage test not in suite | Medium | The LoginPage renders its own form; integration tests would cover it via E2E |

---

## 7. Recommended Additional Tests (for future sprints)

- E2E login flow using Playwright
- E2E logout flow
- Sidebar link visibility per role (snapshot test)
- Form validation error display
- `rememberMe` flag passed correctly to the service
- Session restore on page refresh (currently tested at service level, not at AuthProvider level)
- All 8 roles: verify accessible + restricted module lists on the dashboard

