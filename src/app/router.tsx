/**
 * router.tsx
 * ─────────────────────────────────────────────────────────────
 * Central React Router configuration updated for M02 Site Survey routes.
 */

import {lazy} from 'react';
import {RouteErrorPage} from '../components/common/RouteErrorPage';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
const DashboardPage=lazy(()=>import('../features/dashboard/DashboardPage').then(module=>({default:module.DashboardPage})));
import { LoginPage } from '../features/auth/pages/LoginPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { NotFoundPage } from '../features/auth/pages/NotFoundPage';
const UsersPage=lazy(()=>import('../features/users/UsersPage').then(module=>({default:module.UsersPage})));

// Module M01: CRM Pages
const CRMDashboardPage=lazy(()=>import('../features/crm/pages/CRMDashboardPage').then(module=>({default:module.CRMDashboardPage})));
const CustomersPage=lazy(()=>import('../features/crm/pages/CustomersPage').then(module=>({default:module.CustomersPage})));
const CustomerCreatePage=lazy(()=>import('../features/crm/pages/CustomerCreatePage').then(module=>({default:module.CustomerCreatePage})));
const CustomerDetailsPage=lazy(()=>import('../features/crm/pages/CustomerDetailsPage').then(module=>({default:module.CustomerDetailsPage})));
const CustomerEditPage=lazy(()=>import('../features/crm/pages/CustomerEditPage').then(module=>({default:module.CustomerEditPage})));
const EnquiriesPage=lazy(()=>import('../features/crm/pages/EnquiriesPage').then(module=>({default:module.EnquiriesPage})));
const EnquiryCreatePage=lazy(()=>import('../features/crm/pages/EnquiryCreatePage').then(module=>({default:module.EnquiryCreatePage})));
const EnquiryDetailsPage=lazy(()=>import('../features/crm/pages/EnquiryDetailsPage').then(module=>({default:module.EnquiryDetailsPage})));
const FollowUpsPage=lazy(()=>import('../features/crm/pages/FollowUpsPage').then(module=>({default:module.FollowUpsPage})));

// Module M02: Survey Pages
const SurveyDashboardPage=lazy(()=>import('../features/surveys/pages/SurveyDashboardPage').then(module=>({default:module.SurveyDashboardPage})));
const SurveysPage=lazy(()=>import('../features/surveys/pages/SurveysPage').then(module=>({default:module.SurveysPage})));
const SurveyCreatePage=lazy(()=>import('../features/surveys/pages/SurveyCreatePage').then(module=>({default:module.SurveyCreatePage})));
const SurveyDetailsPage=lazy(()=>import('../features/surveys/pages/SurveyDetailsPage').then(module=>({default:module.SurveyDetailsPage})));
const SurveyExecutionPage=lazy(()=>import('../features/surveys/pages/SurveyExecutionPage').then(module=>({default:module.SurveyExecutionPage})));
const SurveyApprovalPage=lazy(()=>import('../features/surveys/pages/SurveyApprovalPage').then(module=>({default:module.SurveyApprovalPage})));

// Module M03: Solar Configuration Pages
const ConfigurationDashboardPage=lazy(()=>import('../features/configurations/pages/ConfigurationDashboardPage').then(module=>({default:module.ConfigurationDashboardPage})));
const ConfigurationsPage=lazy(()=>import('../features/configurations/pages/ConfigurationsPage').then(module=>({default:module.ConfigurationsPage})));
const ConfigurationCreatePage=lazy(()=>import('../features/configurations/pages/ConfigurationCreatePage').then(module=>({default:module.ConfigurationCreatePage})));
const ConfigurationDetailsPage=lazy(()=>import('../features/configurations/pages/ConfigurationDetailsPage').then(module=>({default:module.ConfigurationDetailsPage})));
const BOMPreviewPage=lazy(()=>import('../features/configurations/pages/BOMPreviewPage').then(module=>({default:module.BOMPreviewPage})));
const TemplatesPage=lazy(()=>import('../features/configurations/pages/TemplatesPage').then(module=>({default:module.TemplatesPage})));
const TemplateCreatePage=lazy(()=>import('../features/configurations/pages/TemplateCreatePage').then(module=>({default:module.TemplateCreatePage})));
const TemplateDetailsPage=lazy(()=>import('../features/configurations/pages/TemplateDetailsPage').then(module=>({default:module.TemplateDetailsPage})));
const ComponentsPage=lazy(()=>import('../features/configurations/pages/ComponentsPage').then(module=>({default:module.ComponentsPage})));

// Module M04: Inventory & Warehouse Pages
const InventoryDashboardPage=lazy(()=>import('../features/inventory/pages/InventoryDashboardPage').then(module=>({default:module.InventoryDashboardPage})));
const ProductsPage=lazy(()=>import('../features/inventory/pages/ProductsPage').then(module=>({default:module.ProductsPage})));
const ProductCreatePage=lazy(()=>import('../features/inventory/pages/ProductCreatePage').then(module=>({default:module.ProductCreatePage})));
const ProductDetailsPage=lazy(()=>import('../features/inventory/pages/ProductDetailsPage').then(module=>({default:module.ProductDetailsPage})));
const WarehousesPage=lazy(()=>import('../features/inventory/pages/WarehousesPage').then(module=>({default:module.WarehousesPage})));
const StockOverviewPage=lazy(()=>import('../features/inventory/pages/StockOverviewPage').then(module=>({default:module.StockOverviewPage})));
const ReceiptsPage=lazy(()=>import('../features/inventory/pages/ReceiptsPage').then(module=>({default:module.ReceiptsPage})));
const ReceiptCreatePage=lazy(()=>import('../features/inventory/pages/ReceiptCreatePage').then(module=>({default:module.ReceiptCreatePage})));
const ReceiptDetailsPage=lazy(()=>import('../features/inventory/pages/ReceiptDetailsPage').then(module=>({default:module.ReceiptDetailsPage})));
const IssuesPage=lazy(()=>import('../features/inventory/pages/IssuesPage').then(module=>({default:module.IssuesPage})));
const IssueCreatePage=lazy(()=>import('../features/inventory/pages/IssueCreatePage').then(module=>({default:module.IssueCreatePage})));
const IssueDetailsPage=lazy(()=>import('../features/inventory/pages/IssueDetailsPage').then(module=>({default:module.IssueDetailsPage})));
const TransfersPage=lazy(()=>import('../features/inventory/pages/TransfersPage').then(module=>({default:module.TransfersPage})));
const TransferCreatePage=lazy(()=>import('../features/inventory/pages/TransferCreatePage').then(module=>({default:module.TransferCreatePage})));
const AdjustmentsPage=lazy(()=>import('../features/inventory/pages/AdjustmentsPage').then(module=>({default:module.AdjustmentsPage})));
const AdjustmentCreatePage=lazy(()=>import('../features/inventory/pages/AdjustmentCreatePage').then(module=>({default:module.AdjustmentCreatePage})));
const SerialNumbersPage=lazy(()=>import('../features/inventory/pages/SerialNumbersPage').then(module=>({default:module.SerialNumbersPage})));
const SerialNumberDetailsPage=lazy(()=>import('../features/inventory/pages/SerialNumberDetailsPage').then(module=>({default:module.SerialNumberDetailsPage})));
const StockMovementsPage=lazy(()=>import('../features/inventory/pages/StockMovementsPage').then(module=>({default:module.StockMovementsPage})));
const StockOperationDetailsPage=lazy(()=>import('../features/inventory/pages/StockOperationDetailsPage').then(module=>({default:module.StockOperationDetailsPage})));

// Module M05: Installation Management Pages
const InstallationDashboardPage=lazy(()=>import('../features/installations/pages/InstallationDashboardPage').then(module=>({default:module.InstallationDashboardPage})));
const InstallationMapPage=lazy(()=>import('../features/installations/pages/InstallationMapPage').then(module=>({default:module.InstallationMapPage})));
const InstallationsPage=lazy(()=>import('../features/installations/pages/InstallationsPage').then(module=>({default:module.InstallationsPage})));
const InstallationCreatePage=lazy(()=>import('../features/installations/pages/InstallationCreatePage').then(module=>({default:module.InstallationCreatePage})));
const InstallationDetailsPage=lazy(()=>import('../features/installations/pages/InstallationDetailsPage').then(module=>({default:module.InstallationDetailsPage})));
const InstallationSchedulePage=lazy(()=>import('../features/installations/pages/InstallationSchedulePage').then(module=>({default:module.InstallationSchedulePage})));
const InstallationExecutionPage=lazy(()=>import('../features/installations/pages/InstallationExecutionPage').then(module=>({default:module.InstallationExecutionPage})));
const InstallationCompletionPage=lazy(()=>import('../features/installations/pages/InstallationCompletionPage').then(module=>({default:module.InstallationCompletionPage})));

// Module M06: Technician Management Pages
const TechnicianDashboardPage=lazy(()=>import('../features/technicians/pages/TechnicianDashboardPage').then(module=>({default:module.TechnicianDashboardPage})));
const TechniciansPage=lazy(()=>import('../features/technicians/pages/TechniciansPage').then(module=>({default:module.TechniciansPage})));
const TechnicianCreatePage=lazy(()=>import('../features/technicians/pages/TechnicianCreatePage').then(module=>({default:module.TechnicianCreatePage})));
const TechnicianDetailsPage=lazy(()=>import('../features/technicians/pages/TechnicianDetailsPage').then(module=>({default:module.TechnicianDetailsPage})));
const TechnicianTeamsPage=lazy(()=>import('../features/technicians/pages/TechnicianTeamsPage').then(module=>({default:module.TechnicianTeamsPage})));
const TechnicianAvailabilityPage=lazy(()=>import('../features/technicians/pages/TechnicianAvailabilityPage').then(module=>({default:module.TechnicianAvailabilityPage})));
const AssignmentsPage=lazy(()=>import('../features/technicians/pages/AssignmentsPage').then(module=>({default:module.AssignmentsPage})));
const MyAssignmentsPage=lazy(()=>import('../features/technicians/pages/MyAssignmentsPage').then(module=>({default:module.MyAssignmentsPage})));

// Module M07: Warranty Management Pages
const WarrantyDashboardPage=lazy(()=>import('../features/warranty/pages/WarrantyDashboardPage').then(module=>({default:module.WarrantyDashboardPage})));
const WarrantyPoliciesPage=lazy(()=>import('../features/warranty/pages/WarrantyPoliciesPage').then(module=>({default:module.WarrantyPoliciesPage})));
const WarrantyPolicyCreatePage=lazy(()=>import('../features/warranty/pages/WarrantyPolicyCreatePage').then(module=>({default:module.WarrantyPolicyCreatePage})));
const WarrantyRecordsPage=lazy(()=>import('../features/warranty/pages/WarrantyRecordsPage').then(module=>({default:module.WarrantyRecordsPage})));
const WarrantyRegisterPage=lazy(()=>import('../features/warranty/pages/WarrantyRegisterPage').then(module=>({default:module.WarrantyRegisterPage})));
const WarrantyDetailsPage=lazy(()=>import('../features/warranty/pages/WarrantyDetailsPage').then(module=>({default:module.WarrantyDetailsPage})));
const ExpiringWarrantiesPage=lazy(()=>import('../features/warranty/pages/ExpiringWarrantiesPage').then(module=>({default:module.ExpiringWarrantiesPage})));
const WarrantyClaimsPage=lazy(()=>import('../features/warranty/pages/WarrantyClaimsPage').then(module=>({default:module.WarrantyClaimsPage})));
const WarrantyClaimCreatePage=lazy(()=>import('../features/warranty/pages/WarrantyClaimCreatePage').then(module=>({default:module.WarrantyClaimCreatePage})));
const WarrantyClaimDetailsPage=lazy(()=>import('../features/warranty/pages/WarrantyClaimDetailsPage').then(module=>({default:module.WarrantyClaimDetailsPage})));

// Module M08: Service Management Pages
const ServiceDashboardPage=lazy(()=>import('../features/service/pages/ServiceDashboardPage').then(module=>({default:module.ServiceDashboardPage})));
const ServiceTicketsPage=lazy(()=>import('../features/service/pages/ServiceTicketsPage').then(module=>({default:module.ServiceTicketsPage})));
const ServiceTicketCreatePage=lazy(()=>import('../features/service/pages/ServiceTicketCreatePage').then(module=>({default:module.ServiceTicketCreatePage})));
const ServiceTicketDetailsPage=lazy(()=>import('../features/service/pages/ServiceTicketDetailsPage').then(module=>({default:module.ServiceTicketDetailsPage})));
const ServiceTasksPage=lazy(()=>import('../features/service/pages/ServiceTasksPage').then(module=>({default:module.ServiceTasksPage})));
const ServiceTaskDetailsPage=lazy(()=>import('../features/service/pages/ServiceTaskDetailsPage').then(module=>({default:module.ServiceTaskDetailsPage})));
const ServiceAssignmentsPage=lazy(()=>import('../features/service/pages/ServiceAssignmentsPage').then(module=>({default:module.ServiceAssignmentsPage})));
const MyServiceTasksPage=lazy(()=>import('../features/service/pages/MyServiceTasksPage').then(module=>({default:module.MyServiceTasksPage})));
const ServiceHistoryPage=lazy(()=>import('../features/service/pages/ServiceHistoryPage').then(module=>({default:module.ServiceHistoryPage})));
const ServiceMaintenancePage=lazy(()=>import('../features/service/pages/ServiceMaintenancePage').then(module=>({default:module.ServiceMaintenancePage})));
const ServiceSlaPoliciesPage=lazy(()=>import('../features/service/pages/ServiceSlaPoliciesPage').then(module=>({default:module.ServiceSlaPoliciesPage})));

// Module M09: Finance & Accounting Pages
const FinanceDashboardPage=lazy(()=>import('../features/finance/pages/FinanceDashboardPage').then(module=>({default:module.FinanceDashboardPage})));
const FinanceRecordsPage=lazy(()=>import('../features/finance/pages/FinanceRecordsPage').then(module=>({default:module.FinanceRecordsPage})));
const FinanceDocumentPage=lazy(()=>import('../features/finance/pages/FinanceDocumentPage').then(module=>({default:module.FinanceDocumentPage})));
const FinanceQuotationEditorPage=lazy(()=>import('../features/finance/pages/FinanceQuotationEditorPage').then(module=>({default:module.FinanceQuotationEditorPage})));
const FinanceRequestCreatePage=lazy(()=>import('../features/finance/pages/FinanceRequestCreatePage').then(module=>({default:module.FinanceRequestCreatePage})));
const FinancePricingPage=lazy(()=>import('../features/finance/pages/FinancePricingPage').then(module=>({default:module.FinancePricingPage})));
const FinanceAccessPage=lazy(()=>import('../features/finance/pages/FinanceAccessPage').then(module=>({default:module.FinanceAccessPage})));
const InvoicesPage=lazy(()=>import('../features/finance/pages/InvoicesPage').then(module=>({default:module.InvoicesPage})));
const InvoiceCreatePage=lazy(()=>import('../features/finance/pages/InvoiceCreatePage').then(module=>({default:module.InvoiceCreatePage})));
const InvoiceEditPage=lazy(()=>import('../features/finance/pages/InvoiceEditPage').then(module=>({default:module.InvoiceEditPage})));
const InvoiceDetailsPage=lazy(()=>import('../features/finance/pages/InvoiceDetailsPage').then(module=>({default:module.InvoiceDetailsPage})));
const PaymentsPage=lazy(()=>import('../features/finance/pages/PaymentsPage').then(module=>({default:module.PaymentsPage})));
const ExpensesPage=lazy(()=>import('../features/finance/pages/ExpensesPage').then(module=>({default:module.ExpensesPage})));
const TechnicianPaymentsPage=lazy(()=>import('../features/finance/pages/TechnicianPaymentsPage').then(module=>({default:module.TechnicianPaymentsPage})));
const InstallationProfitabilityPage=lazy(()=>import('../features/finance/pages/InstallationProfitabilityPage').then(module=>({default:module.InstallationProfitabilityPage})));
const SubsidiesPage=lazy(()=>import('../features/finance/pages/SubsidiesPage').then(module=>({default:module.SubsidiesPage})));
const FinanceReportsPage=lazy(()=>import('../features/finance/pages/FinanceReportsPage').then(module=>({default:module.FinanceReportsPage})));

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
    errorElement:<RouteErrorPage/>,
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
            errorElement:<RouteErrorPage/>,
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
              { path: '/crm/enquiries/:id/edit', element: <EnquiryCreatePage /> },
              { path: '/crm/follow-ups', element: <FollowUpsPage /> },
            ],
          },

          // ── Module M02: Site Survey Management ────────────────────
          {
            element: <ProtectedRoute module="site_survey" />,
            errorElement:<RouteErrorPage/>,
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
            errorElement:<RouteErrorPage/>,
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
            errorElement:<RouteErrorPage/>,
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
              { path: '/inventory/operations/:id', element: <StockOperationDetailsPage /> },
            ],
          },

          // ── Module M05: Installation Management ───────────────────
          {
            element: <ProtectedRoute module="installations" />,
            errorElement:<RouteErrorPage/>,
            children: [
              { path: '/installations', element: <InstallationsPage /> },
              { path: '/installations/dashboard', element: <InstallationDashboardPage /> },
              { path: '/installations/map', element: <InstallationMapPage /> },
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
            errorElement:<RouteErrorPage/>,
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
            errorElement:<RouteErrorPage/>,
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

          // ── Module M08: Service Management ───────────────────────
          {
            element: <ProtectedRoute module="service_management" />,
            errorElement:<RouteErrorPage/>,
            children: [
              { path: '/service', element: <Navigate to="/service/dashboard" replace /> },
              { path: '/service/dashboard', element: <ServiceDashboardPage /> },
              { path: '/service/tickets', element: <ServiceTicketsPage /> },
              { path: '/service/tickets/new', element: <ServiceTicketCreatePage /> },
              { path: '/service/tickets/:id', element: <ServiceTicketDetailsPage /> },
              { path: '/service/tasks', element: <ServiceTasksPage /> },
              { path: '/service/tasks/:id', element: <ServiceTaskDetailsPage /> },
              { path: '/service/assignments', element: <ServiceAssignmentsPage /> },
              { path: '/service/my-tasks', element: <MyServiceTasksPage /> },
              { path: '/service/history', element: <ServiceHistoryPage /> },
              { path: '/service/maintenance', element: <ServiceMaintenancePage /> },
              { path: '/service/sla-policies', element: <ServiceSlaPoliciesPage /> },
            ],
          },

          // ── Module M09: Finance & Accounting ──────────────────────
          {
            element: <ProtectedRoute module="finance" />,
            errorElement:<RouteErrorPage/>,
            children: [
              { path: '/finance', element: <Navigate to="/finance/dashboard" replace /> },
              { path: '/finance/dashboard', element: <FinanceDashboardPage /> },
              { path: '/finance/quotations', element: <FinanceRecordsPage group="quotations" /> },
              { path: '/finance/quotations/new', element: <FinanceQuotationEditorPage /> },
              { path: '/finance/quotations/:id/edit', element: <FinanceQuotationEditorPage mode="edit" /> },
              { path: '/finance/quotations/:id/revise', element: <FinanceQuotationEditorPage mode="revise" /> },
              { path: '/finance/orders', element: <FinanceRecordsPage group="orders" /> },
              { path: '/finance/credit-notes', element: <FinanceRecordsPage group="credit-notes" /> },
              { path: '/finance/refunds', element: <FinanceRecordsPage group="refunds" /> },
              { path: '/finance/service-charges', element: <FinanceRecordsPage group="service-charges" /> },
              { path: '/finance/documents/:group/:id', element: <FinanceDocumentPage /> },
              { path: '/finance/new/:group', element: <FinanceRequestCreatePage /> },
              { path: '/finance/pricing', element: <FinancePricingPage /> },
              { path: '/finance/access', element: <FinanceAccessPage /> },
              { path: '/finance/invoices', element: <InvoicesPage /> },
              { path: '/finance/invoices/new', element: <InvoiceCreatePage /> },
              { path: '/finance/invoices/:id', element: <InvoiceDetailsPage /> },
              { path: '/finance/invoices/:id/edit', element: <InvoiceEditPage /> },
              { path: '/finance/payments', element: <PaymentsPage /> },
              { path: '/finance/expenses', element: <ExpensesPage /> },
              { path: '/finance/technician-payments', element: <TechnicianPaymentsPage /> },
              { path: '/finance/profitability', element: <InstallationProfitabilityPage /> },
              { path: '/finance/subsidies', element: <SubsidiesPage /> },
              { path: '/finance/reports', element: <FinanceReportsPage /> },
            ],
          },

          // User Management (admin only)
          {
            element: <ProtectedRoute module="user_management" />,
            errorElement:<RouteErrorPage/>,
            children: [
              {
                path: '/users',
                element: <UsersPage />,
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
