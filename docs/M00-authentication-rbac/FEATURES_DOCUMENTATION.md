# M00 – Features Documentation
## Solar Installation Management System — Authentication & RBAC

---

## 1. Login Functionality

### What it does
Allows users to authenticate with an email address and password.

### How it works
1. User enters email and password on the Login page.
2. Client-side validation runs immediately on blur/submit.
3. The form is submitted, triggering `useAuth().login()`.
4. A loading spinner replaces the button text while the request is in flight.
5. On success: the user is redirected to the Dashboard (or the page they originally tried to visit).
6. On failure: a red error message appears below the form header.

### Features
- **Show/hide password**: Eye icon toggles password visibility.
- **Remember me**: Checkbox passes a `rememberMe` flag to the auth service (backend will handle session duration).
- **Form validation**: Email format, required fields, minimum password length.
- **Keyboard accessible**: Full tab navigation, visible focus rings, Enter-to-submit.
- **Redirect preservation**: If a user visits `/finance` while unauthenticated, they are redirected to `/login`. After login, they land on `/finance`.
- **Dev credentials panel**: Visible only in development builds (`import.meta.env.PROD === false`). Allows developers to one-click fill in any role's credentials. Hidden in production builds.

---

## 2. Logout Functionality

### What it does
Clears the user's authentication session and returns them to the Login page.

### How it works
1. User clicks the **Logout** button in the top navigation bar.
2. `useAuth().logout()` is called.
3. The auth service clears the session (sessionStorage in mock mode, HTTP-only cookie/token invalidation in production).
4. `AuthContext` sets `user` to `null`.
5. React Router redirects the user to `/login`.

The logout is always performed locally even if the server call fails — the user is never left in a stuck state.

---

## 3. Supported Roles

| Role | Identifier | Description |
|---|---|---|
| Administrator | `admin` | Full access to all modules |
| Sales Executive | `sales_executive` | Customer and sales management |
| Surveyor | `surveyor` | Site survey creation and management |
| Inventory Manager | `inventory_manager` | Stock and warehouse management |
| Installation Manager | `installation_manager` | Planning and overseeing installations |
| Technician | `technician` | Executing assigned tasks |
| Finance Officer | `finance_officer` | Billing and financial reporting |
| Service Manager | `service_manager` | Warranty and service requests |

---

## 4. Permission Levels

| Level | Meaning |
|---|---|
| `full` | View + Create + Edit + Delete |
| `view` | Read-only access |
| `assigned_only` | Access limited to records assigned to the logged-in user |
| `none` | No access — module is hidden from navigation |

> **Note:** `assigned_only` is enforced by the backend. The frontend hides the scope-limiting UI cues, but the backend must filter records appropriately.

---

## 5. Navigation Behaviour

After login, the sidebar shows only the modules the logged-in user can access. The filtering is automatic — it reads from the permission matrix in `config/permissions.ts`.

**Example — Technician role sees:**
- Dashboard
- Site Survey (assigned only)
- Solar Configuration (view)
- Inventory (assigned only)
- Installations (assigned only)
- Technicians (own profile only)
- Warranty (view)
- Service Management (assigned only)

**Does NOT see:**
- Customers & CRM
- Finance
- User Management

The active route is highlighted in the sidebar with a green background.

---

## 6. Unauthorized Access Behaviour

When a user tries to access a restricted URL directly (e.g. a Technician typing `/finance` in the address bar):

1. `ProtectedRoute` checks the user's permission for the `finance` module.
2. The permission is `none` → the route renders `/unauthorized` instead.
3. The Unauthorized page shows the user's current role and two buttons: **Go back** and **Return to Dashboard**.

This guard runs even if the sidebar link is hidden — URL-based access is not possible.

---

## 7. User Experience Design

### Design system
- **Primary colour**: Green (`#16a34a`, `#22c55e`) — solar energy theme
- **Background**: Dark navy (`#0f172a`) for the sidebar and left panel
- **Surface**: White cards with light slate borders
- **Typography**: System sans-serif stack via Tailwind

### Responsive design
- On mobile: sidebar is hidden and accessible via a hamburger menu (slide-in drawer)
- On desktop (≥1024px): sidebar is always visible
- The main content area is always scrollable

### Accessibility
- All interactive elements have accessible labels
- Full keyboard navigation with visible focus rings
- Error messages use `role="alert"` for screen reader announcements
- `aria-invalid` is set on form inputs with validation errors
- `aria-label` on all icon-only buttons

---

## 8. Current Limitations (M00 only)

- **No real backend**: Authentication uses a mock service. Credentials are stored in sessionStorage (not HTTP-only cookies).
- **No password reset**: Forgot password flow is not implemented.
- **No MFA**: Multi-factor authentication is not implemented.
- **No real token refresh**: The mock service does not handle token expiry.
- **Dashboard is a placeholder**: No charts, KPIs, or real-time data. These are M01 scope.
- **All non-dashboard pages are placeholders**: Full module UIs will be built in M01–M10.
- **No user profile editing**: Users cannot change their own name, email, or password in M00.
- **Backend permission enforcement**: Not implemented — the backend developer must add this.

