/**
 * apiClient.ts
 * ─────────────────────────────────────────────────────────────
 * Centralised HTTP client for all API communication.
 *
 * STATUS: Stub – ready for backend integration.
 *
 * Currently this file configures an Axios instance.  Once the
 * backend is available:
 *  1. Set VITE_API_BASE_URL in .env
 *  2. Implement request/response interceptors (token injection,
 *     token refresh on 401, error normalisation)
 *  3. All feature services import this instance instead of
 *     calling fetch() directly
 *
 * WHY AXIOS:
 *  - Automatic JSON serialisation/deserialisation
 *  - Interceptors for auth headers and token refresh
 *  - Consistent error objects across all requests
 *  - Easy to mock in tests
 */

import axios from 'axios';

/**
 * Base URL read from the Vite environment variable.
 * Set VITE_API_BASE_URL=https://your-api.example.com in .env
 *
 * Falls back to '/api' so requests work behind a reverse proxy
 * during local development.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Shared Axios instance used by all services. */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Send cookies with every request (required for HTTP-only session cookies).
  withCredentials: true,
  timeout: 15_000, // 15 seconds
});

// ─── Request interceptor ───────────────────────────────────────
/**
 * Inject the access token into every request.
 *
 * TODO (backend integration):
 *  If the backend uses HTTP-only cookies, this interceptor may not
 *  be needed.  If it returns tokens in JSON, store them in a module-
 *  level variable here and inject them in the Authorization header.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Placeholder: inject token from memory when available
    // const token = getStoredAccessToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────
/**
 * Global error handling:
 *  - 401 → redirect to login / attempt token refresh
 *  - 403 → redirect to /unauthorized
 *  - 5xx → show generic server error message
 *
 * TODO (backend integration): implement token refresh logic here.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Placeholder – implement when backend is integrated
    return Promise.reject(error);
  }
);

