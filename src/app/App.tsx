/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────
 * Application root.
 *
 * Renders:
 *  AuthProvider  → wraps the entire app with auth context
 *    RouterProvider → provides React Router routing
 *
 * The AuthProvider receives the mockAuthService.
 * To switch to a real API service:
 *  1. Implement IAuthService in a new realAuthService.ts
 *  2. Replace the import below
 */

import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { realAuthService } from '../features/auth/services/realAuthService';
import { router } from './router';
import {ApiErrorBanner} from '../components/common/ApiErrorBanner';

export function App() {
  return (
    <AuthProvider service={realAuthService}>
      <ApiErrorBanner />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

