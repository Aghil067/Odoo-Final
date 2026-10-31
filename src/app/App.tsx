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
import { mockAuthService } from '../features/auth/services/mockAuthService';
import { router } from './router';

export function App() {
  return (
    <AuthProvider service={mockAuthService}>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

