# M00 – Backend Integration Guide
## Solar Installation Management System

> **Status:** Frontend-only (M00). Backend integration is pending.
> All API contracts below are **provisional** until confirmed with the backend developer.

---

## 1. Proposed API Endpoints

### `POST /api/auth/login`
Authenticate a user with email and password.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "rememberMe": false
}
```

**Success response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Alex Administrator",
    "role": "admin",
    "avatarUrl": null
  },
  "accessToken": "eyJhbGci...",
  "expiresIn": 3600
}
```
> **Note:** If using HTTP-only cookies, `accessToken` and `expiresIn` may be omitted from the JSON response body. The backend should set a `Set-Cookie` header instead. HTTP-only cookies are strongly preferred for security.

**Error response (401):**
```json
{
  "message": "Invalid email or password."
}
```

---

### `POST /api/auth/logout`
Invalidate the current session.

**Request:** No body required (session identified by cookie or Authorization header).

**Response (200):**
```json
{
  "message": "Logged out successfully."
}
```

---

### `GET /api/auth/me`
Return the currently authenticated user.

**Request:** No body. Requires valid session (cookie or Authorization header).

**Success response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Alex Administrator",
    "role": "admin",
    "avatarUrl": null
  }
}
```

**Unauthenticated response (401):**
```json
{
  "message": "Not authenticated."
}
```

Called by `AuthProvider` on every application load to restore the user's session after a page refresh.

---

### `POST /api/auth/refresh` *(if using refresh tokens)*
Exchange a refresh token for a new access token.

**Request body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Success response (200):**
```json
{
  "accessToken": "eyJhbGci...",
  "expiresIn": 3600
}
```

---

## 2. TypeScript Interfaces (provisional)

These are defined in `src/features/auth/types/auth.types.ts`:

```typescript
// The role identifiers the backend must use
type UserRole =
  | 'admin'
  | 'sales_executive'
  | 'surveyor'
  | 'inventory_manager'
  | 'installation_manager'
  | 'technician'
  | 'finance_officer'
  | 'service_manager';

// User object returned by the backend
interface AuthenticatedUser {
  id: string;         // backend user ID (UUID recommended)
  email: string;
  name: string;       // display name
  role: UserRole;     // must match one of the above strings exactly
  avatarUrl?: string; // optional – falls back to initials
}

// Login request body
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Login response body
interface LoginResponse {
  user: AuthenticatedUser;
  accessToken?: string;  // omit if using HTTP-only cookies
  expiresIn?: number;    // seconds until token expiry
  refreshToken?: string; // omit if using HTTP-only cookies
}

// GET /api/auth/me response body
interface MeResponse {
  user: AuthenticatedUser;
}
```

---

## 3. Integration Points in the Frontend

### Step 1: Create `realAuthService.ts`

Create `src/features/auth/services/realAuthService.ts` implementing `IAuthService`:

```typescript
import { apiClient } from '../../../services/apiClient';
import type { IAuthService } from './authService';
import type { LoginRequest, LoginResponse, MeResponse } from '../types/auth.types';

export const realAuthService: IAuthService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', request);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<MeResponse | null> {
    try {
      const { data } = await apiClient.get<MeResponse>('/auth/me');
      return data;
    } catch {
      return null; // 401 = no session
    }
  },
};
```

### Step 2: Swap the service in `App.tsx`

```typescript
// App.tsx – change this line:
import { mockAuthService } from '../features/auth/services/mockAuthService';
// to:
import { realAuthService } from '../features/auth/services/realAuthService';

// Then change:
<AuthProvider service={mockAuthService}>
// to:
<AuthProvider service={realAuthService}>
```

**No other files need to change.**

### Step 3: Set the API base URL

In a `.env` file (create at `d:\hyyydddeee\.env`):
```
VITE_API_BASE_URL=https://api.your-backend.example.com
```

For local development:
```
VITE_API_BASE_URL=http://localhost:8000
```

### Step 4: Implement token refresh (if not using HTTP-only cookies)

In `src/services/apiClient.ts`, implement the response interceptor to:
- Detect 401 responses
- Call `POST /api/auth/refresh`
- Retry the original request with the new token
- If refresh fails, call `logout()` and redirect to `/login`

---

## 4. Permission Data from Backend

Currently, permissions are defined entirely in the frontend (`config/permissions.ts`). This approach is acceptable for M00 but has limitations:

- If a user's role changes in the backend, the frontend does not know until the next login.
- The frontend cannot be the security boundary.

### Future consideration: Backend-driven permissions

The backend could return permissions as part of the `GET /api/auth/me` response:

```json
{
  "user": {
    "id": "...",
    "role": "admin"
  },
  "permissions": {
    "dashboard": "full",
    "customers": "full",
    "finance": "full"
    // ...
  }
}
```

The frontend `AuthContext` would then store these permissions and use them instead of (or in addition to) the static matrix.

**Decision required: confirm with backend developer whether permissions are role-based (static matrix is fine) or user-specific (backend must return per-user permissions).**

---

## 5. Questions to Confirm with the Backend Developer

| # | Question | Impact |
|---|---|---|
| 1 | Will you use HTTP-only cookies or JSON tokens? | Token storage strategy in frontend |
| 2 | What is the exact `role` string format? | Must match `UserRole` union type exactly |
| 3 | Will permissions be role-based (static) or user-specific (dynamic)? | May need to update `MeResponse` interface |
| 4 | What is the session/token lifetime? | Token refresh implementation |
| 5 | Will you use refresh tokens? | Implement `POST /api/auth/refresh` interceptor |
| 6 | What is the API base URL and CORS configuration? | `VITE_API_BASE_URL` and cookie `SameSite` policy |
| 7 | Should the frontend send `rememberMe` as a boolean or as a duration? | Adjust `LoginRequest.rememberMe` type |
| 8 | Will `avatarUrl` be a full URL or a relative path? | Adjust image rendering in `Topbar` |
| 9 | What is the error response shape for 401/403? | Improve error message display |
| 10 | Will there be server-side permission filtering for `assigned_only`? | Frontend can add visual cues; backend must enforce |

---

## 6. Frontend / Backend Responsibility Split

| Responsibility | Frontend | Backend |
|---|---|---|
| Show/hide UI by role | ✅ | ❌ |
| Block navigation to restricted routes | ✅ | ❌ |
| Validate login credentials | ❌ | ✅ |
| Issue and validate JWT/session | ❌ | ✅ |
| Enforce API endpoint access | ❌ | ✅ |
| Filter `assigned_only` records | UI hint only | ✅ Must enforce |
| Return 401 for unauthenticated requests | ❌ | ✅ |
| Return 403 for insufficient permissions | ❌ | ✅ |
| Hash and store passwords | ❌ Never | ✅ |
| Rate-limit login attempts | ❌ | ✅ |

