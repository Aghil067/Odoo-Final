/**
 * router.tsx
 * ─────────────────────────────────────────────────────────────
 * Central React Router configuration updated for M02 Site Survey routes.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { NotFoundPage } from '../features/auth/pages/NotFoundPage';
import { PlaceholderPage } from '../features/placeholders/PlaceholderPage';

// Module M01: CRM Pages
import { CRMDashboardPage } from '../features/crm/pages/CRMDashboardPage';
import { CustomersPage } from '../features/crm/pages/CustomersPage';
import { CustomerCreatePage } from '../features/crm/pages/CustomerCreatePage';
import { CustomerDetailsPage } from '../features/crm/pages/CustomerDetailsPage';
import { CustomerEditPage } from '../features/crm/pages/CustomerEditPage';
import { EnquiriesPage } from '../features/crm/pages/EnquiriesPage';
import { EnquiryCreatePage } from '../features/crm/pages/EnquiryCreatePage';
import { EnquiryDetailsPage } from '../features/crm/pages/EnquiryDetailsPage';
import { FollowUpsPage } from '../features/crm/pages/FollowUpsPage';

// Module M02: Survey Pages
import { SurveyDashboardPage } from '../features/surveys/pages/SurveyDashboardPage';
import { SurveysPage } from '../features/surveys/pages/SurveysPage';
import { SurveyCreatePage } from '../features/surveys/pages/SurveyCreatePage';
import { SurveyDetailsPage } from '../features/surveys/pages/SurveyDetailsPage';
import { SurveyExecutionPage } from '../features/surveys/pages/SurveyExecutionPage';
import { SurveyApprovalPage } from '../features/surveys/pages/SurveyApprovalPage';

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
    element: <ProtectedRoute />, // authentication guard only
    children: [
      {
        element: <AppLayout />, // shared shell
        children: [
          // Root → redirect to dashboard
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Dashboard (all authenticated users can view)
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },

          // ── Module M01: Customers & CRM ───────────────────────────
          {
            element: <ProtectedRoute module="customers" />,
            children: [
              { path: '/customers', element: <Navigate to="/crm" replace /> },
              { path: '/crm', element: <CRMDashboardPage /> },
              { path: '/crm/customers', element: <CustomersPage /> },
              { path: '/crm/customers/new', element: <CustomerCreatePage /> },
              { path: '/crm/customers/:id', element: <CustomerDetailsPage /> },
              { path: '/crm/customers/:id/edit', element: <CustomerEditPage /> },
              { path: '/crm/enquiries', element: <EnquiriesPage /> },
              { path: '/crm/enquiries/new', element: <EnquiryCreatePage /> },
              { path: '/crm/enquiries/:id', element: <EnquiryDetailsPage /> },
              { path: '/crm/follow-ups', element: <FollowUpsPage /> },
            ],
          },

          // ── Module M02: Site Survey Management ────────────────────
          {
            element: <ProtectedRoute module="site_survey" />,
            children: [
              { path: '/site-survey', element: <Navigate to="/surveys/dashboard" replace /> },
              { path: '/surveys', element: <SurveysPage /> },
              { path: '/surveys/dashboard', element: <SurveyDashboardPage /> },
              { path: '/surveys/new', element: <SurveyCreatePage /> },
              { path: '/surveys/:id', element: <SurveyDetailsPage /> },
              { path: '/surveys/:id/edit', element: <SurveyExecutionPage /> },
              { path: '/surveys/approvals', element: <SurveyApprovalPage /> },
            ],
          },

          // ── Placeholder Modules ──────────────────────────────────
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
