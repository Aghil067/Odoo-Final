/**
 * router.tsx
 * ─────────────────────────────────────────────────────────────
 * Central React Router configuration.
 *
 * ROUTE HIERARCHY:
 *
 *  /login                    → LoginPage (public)
 *  /unauthorized             → UnauthorizedPage (public – shown after auth)
 *  /                         → ProtectedRoute (auth required)
 *    /                       → redirect to /dashboard
 *    AppLayout (shell)
 *      /dashboard            → DashboardPage
 *      /customers            → ProtectedRoute(customers) → PlaceholderPage
 *      /site-survey          → ProtectedRoute(site_survey) → PlaceholderPage
 *      /solar-config         → ProtectedRoute(solar_configuration) → PlaceholderPage
 *      /inventory            → ProtectedRoute(inventory) → PlaceholderPage
 *      /installations        → ProtectedRoute(installations) → PlaceholderPage
 *      /technicians          → ProtectedRoute(technicians) → PlaceholderPage
 *      /warranty             → ProtectedRoute(warranty) → PlaceholderPage
 *      /service              → ProtectedRoute(service_management) → PlaceholderPage
 *      /finance              → ProtectedRoute(finance) → PlaceholderPage
 *      /users                → ProtectedRoute(user_management) → PlaceholderPage
 *  *                         → NotFoundPage
 *
 * Adding a new route:
 *  1. Create the page component in src/features/<module>/
 *  2. Add a ProtectedRoute wrapper with the correct module key
 *  3. Add a nav item in src/config/navigation.ts
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { NotFoundPage } from '../features/auth/pages/NotFoundPage';
import { PlaceholderPage } from '../features/placeholders/PlaceholderPage';

export const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // ── Protected routes (authentication required) ────────────────
  {
    element: <ProtectedRoute />,      // authentication guard only
    children: [
      {
        element: <AppLayout />,       // shared shell
        children: [
          // Root → redirect to dashboard
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Dashboard (all authenticated users can view)
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },

          // Customers & CRM
          {
            element: <ProtectedRoute module="customers" />,
            children: [
              {
                path: '/customers',
                element: <PlaceholderPage moduleName="Customers & CRM" moduleKey="customers" />,
              },
            ],
          },

          // Site Survey
          {
            element: <ProtectedRoute module="site_survey" />,
            children: [
              {
                path: '/site-survey',
                element: <PlaceholderPage moduleName="Site Survey" moduleKey="site_survey" />,
              },
            ],
          },

          // Solar Configuration
          {
            element: <ProtectedRoute module="solar_configuration" />,
            children: [
              {
                path: '/solar-config',
                element: <PlaceholderPage moduleName="Solar Configuration" moduleKey="solar_configuration" />,
              },
            ],
          },

          // Inventory
          {
            element: <ProtectedRoute module="inventory" />,
            children: [
              {
                path: '/inventory',
                element: <PlaceholderPage moduleName="Inventory" moduleKey="inventory" />,
              },
            ],
          },

          // Installations
          {
            element: <ProtectedRoute module="installations" />,
            children: [
              {
                path: '/installations',
                element: <PlaceholderPage moduleName="Installations" moduleKey="installations" />,
              },
            ],
          },

          // Technicians
          {
            element: <ProtectedRoute module="technicians" />,
            children: [
              {
                path: '/technicians',
                element: <PlaceholderPage moduleName="Technicians" moduleKey="technicians" />,
              },
            ],
          },

          // Warranty
          {
            element: <ProtectedRoute module="warranty" />,
            children: [
              {
                path: '/warranty',
                element: <PlaceholderPage moduleName="Warranty" moduleKey="warranty" />,
              },
            ],
          },

          // Service Management
          {
            element: <ProtectedRoute module="service_management" />,
            children: [
              {
                path: '/service',
                element: <PlaceholderPage moduleName="Service Management" moduleKey="service_management" />,
              },
            ],
          },

          // Finance
          {
            element: <ProtectedRoute module="finance" />,
            children: [
              {
                path: '/finance',
                element: <PlaceholderPage moduleName="Finance" moduleKey="finance" />,
              },
            ],
          },

          // User Management (admin only)
          {
            element: <ProtectedRoute module="user_management" />,
            children: [
              {
                path: '/users',
                element: <PlaceholderPage moduleName="User Management" moduleKey="user_management" />,
              },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 catch-all ─────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

