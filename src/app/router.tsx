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

// Module M03: Solar Configuration Pages
import { ConfigurationDashboardPage } from '../features/configurations/pages/ConfigurationDashboardPage';
import { ConfigurationsPage } from '../features/configurations/pages/ConfigurationsPage';
import { ConfigurationCreatePage } from '../features/configurations/pages/ConfigurationCreatePage';
import { ConfigurationDetailsPage } from '../features/configurations/pages/ConfigurationDetailsPage';
import { BOMPreviewPage } from '../features/configurations/pages/BOMPreviewPage';
import { TemplatesPage } from '../features/configurations/pages/TemplatesPage';
import { TemplateCreatePage } from '../features/configurations/pages/TemplateCreatePage';
import { TemplateDetailsPage } from '../features/configurations/pages/TemplateDetailsPage';
import { ComponentsPage } from '../features/configurations/pages/ComponentsPage';

// Module M04: Inventory & Warehouse Pages
import { InventoryDashboardPage } from '../features/inventory/pages/InventoryDashboardPage';
import { ProductsPage } from '../features/inventory/pages/ProductsPage';
import { ProductCreatePage } from '../features/inventory/pages/ProductCreatePage';
import { ProductDetailsPage } from '../features/inventory/pages/ProductDetailsPage';
import { WarehousesPage } from '../features/inventory/pages/WarehousesPage';
import { StockOverviewPage } from '../features/inventory/pages/StockOverviewPage';
import { ReceiptsPage } from '../features/inventory/pages/ReceiptsPage';
import { ReceiptCreatePage } from '../features/inventory/pages/ReceiptCreatePage';
import { ReceiptDetailsPage } from '../features/inventory/pages/ReceiptDetailsPage';
import { IssuesPage } from '../features/inventory/pages/IssuesPage';
import { IssueCreatePage } from '../features/inventory/pages/IssueCreatePage';
import { IssueDetailsPage } from '../features/inventory/pages/IssueDetailsPage';
import { TransfersPage } from '../features/inventory/pages/TransfersPage';
import { TransferCreatePage } from '../features/inventory/pages/TransferCreatePage';
import { AdjustmentsPage } from '../features/inventory/pages/AdjustmentsPage';
import { AdjustmentCreatePage } from '../features/inventory/pages/AdjustmentCreatePage';
import { SerialNumbersPage } from '../features/inventory/pages/SerialNumbersPage';
import { SerialNumberDetailsPage } from '../features/inventory/pages/SerialNumberDetailsPage';
import { StockMovementsPage } from '../features/inventory/pages/StockMovementsPage';

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

          // ── Module M03: Solar Configuration ──────────────────────
          {
            element: <ProtectedRoute module="solar_configuration" />,
            children: [
              { path: '/solar-config', element: <Navigate to="/configurations" replace /> },
              { path: '/configurations', element: <ConfigurationDashboardPage /> },
              { path: '/configurations/dashboard', element: <ConfigurationDashboardPage /> },
              { path: '/configurations/list', element: <ConfigurationsPage /> },
              { path: '/configurations/new', element: <ConfigurationCreatePage /> },
              { path: '/configurations/:id', element: <ConfigurationDetailsPage /> },
              { path: '/configurations/:id/bom', element: <BOMPreviewPage /> },
              { path: '/configurations/templates', element: <TemplatesPage /> },
              { path: '/configurations/templates/new', element: <TemplateCreatePage /> },
              { path: '/configurations/templates/:id', element: <TemplateDetailsPage /> },
              { path: '/configurations/components', element: <ComponentsPage /> },
            ],
          },

          // ── Module M04: Inventory & Warehouse ─────────────────────
          {
            element: <ProtectedRoute module="inventory" />,
            children: [
              { path: '/inventory', element: <Navigate to="/inventory/dashboard" replace /> },
              { path: '/inventory/dashboard', element: <InventoryDashboardPage /> },
              { path: '/inventory/products', element: <ProductsPage /> },
              { path: '/inventory/products/new', element: <ProductCreatePage /> },
              { path: '/inventory/products/:id', element: <ProductDetailsPage /> },
              { path: '/inventory/warehouses', element: <WarehousesPage /> },
              { path: '/inventory/stock', element: <StockOverviewPage /> },
              { path: '/inventory/receipts', element: <ReceiptsPage /> },
              { path: '/inventory/receipts/new', element: <ReceiptCreatePage /> },
              { path: '/inventory/receipts/:id', element: <ReceiptDetailsPage /> },
              { path: '/inventory/issues', element: <IssuesPage /> },
              { path: '/inventory/issues/new', element: <IssueCreatePage /> },
              { path: '/inventory/issues/:id', element: <IssueDetailsPage /> },
              { path: '/inventory/transfers', element: <TransfersPage /> },
              { path: '/inventory/transfers/new', element: <TransferCreatePage /> },
              { path: '/inventory/adjustments', element: <AdjustmentsPage /> },
              { path: '/inventory/adjustments/new', element: <AdjustmentCreatePage /> },
              { path: '/inventory/serial-numbers', element: <SerialNumbersPage /> },
              { path: '/inventory/serial-numbers/:id', element: <SerialNumberDetailsPage /> },
              { path: '/inventory/movements', element: <StockMovementsPage /> },
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
