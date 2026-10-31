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

// Module M05: Installation Management Pages
import { InstallationDashboardPage } from '../features/installations/pages/InstallationDashboardPage';
import { InstallationsPage } from '../features/installations/pages/InstallationsPage';
import { InstallationCreatePage } from '../features/installations/pages/InstallationCreatePage';
import { InstallationDetailsPage } from '../features/installations/pages/InstallationDetailsPage';
import { InstallationSchedulePage } from '../features/installations/pages/InstallationSchedulePage';
import { InstallationExecutionPage } from '../features/installations/pages/InstallationExecutionPage';
import { InstallationCompletionPage } from '../features/installations/pages/InstallationCompletionPage';

// Module M06: Technician Management Pages
import { TechnicianDashboardPage } from '../features/technicians/pages/TechnicianDashboardPage';
import { TechniciansPage } from '../features/technicians/pages/TechniciansPage';
import { TechnicianCreatePage } from '../features/technicians/pages/TechnicianCreatePage';
import { TechnicianDetailsPage } from '../features/technicians/pages/TechnicianDetailsPage';
import { TechnicianTeamsPage } from '../features/technicians/pages/TechnicianTeamsPage';
import { TechnicianAvailabilityPage } from '../features/technicians/pages/TechnicianAvailabilityPage';
import { AssignmentsPage } from '../features/technicians/pages/AssignmentsPage';
import { MyAssignmentsPage } from '../features/technicians/pages/MyAssignmentsPage';

// Module M07: Warranty Management Pages
import { WarrantyDashboardPage } from '../features/warranty/pages/WarrantyDashboardPage';
import { WarrantyPoliciesPage } from '../features/warranty/pages/WarrantyPoliciesPage';
import { WarrantyPolicyCreatePage } from '../features/warranty/pages/WarrantyPolicyCreatePage';
import { WarrantyRecordsPage } from '../features/warranty/pages/WarrantyRecordsPage';
import { WarrantyRegisterPage } from '../features/warranty/pages/WarrantyRegisterPage';
import { WarrantyDetailsPage } from '../features/warranty/pages/WarrantyDetailsPage';
import { ExpiringWarrantiesPage } from '../features/warranty/pages/ExpiringWarrantiesPage';
import { WarrantyClaimsPage } from '../features/warranty/pages/WarrantyClaimsPage';
import { WarrantyClaimCreatePage } from '../features/warranty/pages/WarrantyClaimCreatePage';
import { WarrantyClaimDetailsPage } from '../features/warranty/pages/WarrantyClaimDetailsPage';

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

          // ── Module M05: Installation Management ───────────────────
          {
            element: <ProtectedRoute module="installations" />,
            children: [
              { path: '/installations', element: <InstallationsPage /> },
              { path: '/installations/dashboard', element: <InstallationDashboardPage /> },
              { path: '/installations/new', element: <InstallationCreatePage /> },
              { path: '/installations/schedule', element: <InstallationSchedulePage /> },
              { path: '/installations/:id', element: <InstallationDetailsPage /> },
              { path: '/installations/:id/edit', element: <InstallationCreatePage /> },
              { path: '/installations/:id/execution', element: <InstallationExecutionPage /> },
              { path: '/installations/:id/completion', element: <InstallationCompletionPage /> },
            ],
          },

          // ── Module M06: Technician Management ─────────────────────
          {
            element: <ProtectedRoute module="technicians" />,
            children: [
              { path: '/technicians', element: <TechniciansPage /> },
              { path: '/technicians/dashboard', element: <TechnicianDashboardPage /> },
              { path: '/technicians/new', element: <TechnicianCreatePage /> },
              { path: '/technicians/:id', element: <TechnicianDetailsPage /> },
              { path: '/technicians/:id/edit', element: <TechnicianCreatePage /> },
              { path: '/technicians/teams', element: <TechnicianTeamsPage /> },
              { path: '/technicians/availability', element: <TechnicianAvailabilityPage /> },
              { path: '/technicians/assignments', element: <AssignmentsPage /> },
              { path: '/technicians/my-assignments', element: <MyAssignmentsPage /> },
            ],
          },

          // ── Module M07: Warranty Management ───────────────────────
          {
            element: <ProtectedRoute module="warranty" />,
            children: [
              { path: '/warranty', element: <Navigate to="/warranty/dashboard" replace /> },
              { path: '/warranty/dashboard', element: <WarrantyDashboardPage /> },
              { path: '/warranty/policies', element: <WarrantyPoliciesPage /> },
              { path: '/warranty/policies/new', element: <WarrantyPolicyCreatePage /> },
              { path: '/warranty/records', element: <WarrantyRecordsPage /> },
              { path: '/warranty/register', element: <WarrantyRegisterPage /> },
              { path: '/warranty/:id', element: <WarrantyDetailsPage /> },
              { path: '/warranty/expiring', element: <ExpiringWarrantiesPage /> },
              { path: '/warranty/claims', element: <WarrantyClaimsPage /> },
              { path: '/warranty/claims/new', element: <WarrantyClaimCreatePage /> },
              { path: '/warranty/claims/:id', element: <WarrantyClaimDetailsPage /> },
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
