# Module M01 – Technical Documentation
## Customer & CRM Management (SunPower Solutions)

---

## 1. Module Architecture Overview

Module M01 implements the frontend Customer & CRM foundation for SunPower Solutions' rooftop solar installation operations (~40 installations/month).

It sits directly on top of M00's foundation without altering core RBAC, application layout, or auth contexts:

```
┌────────────────────────────────────────────────────────────────┐
│  Router Layer       /crm, /crm/customers, /crm/enquiries, ...  │
│                     (Gated by ProtectedRoute(customers))       │
├────────────────────────────────────────────────────────────────┤
│  View Layer         CRMDashboardPage, CustomersPage,           │
│                     CustomerCreatePage, CustomerDetailsPage,   │
│                     CustomerEditPage, EnquiriesPage,           │
│                     EnquiryCreatePage, EnquiryDetailsPage,     │
│                     FollowUpsPage                              │
├────────────────────────────────────────────────────────────────┤
│  Component Layer    CustomerTable/DataTable, CustomerForm,    │
│                     EnquiryPipeline, FollowUpForm,             │
│                     ActivityTimeline, Card, Button, Input      │
├────────────────────────────────────────────────────────────────┤
│  Service Layer      customerService.ts, enquiryService.ts,     │
│                     followUpService.ts                         │
├────────────────────────────────────────────────────────────────┤
│  Data Layer         mockData.ts (In-memory reactive store)     │
│                     → Prepared for apiClient.ts replacement    │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. File and Directory Structure

```
d:\hyyydddeee\src\features\crm\
├── components/
│   ├── ActivityTimeline.tsx       # Chronological customer activity timeline
│   ├── CustomerForm.tsx           # Reusable customer form with validation
│   ├── EnquiryForm.tsx            # Solar requirement & lead creation form
│   ├── EnquiryPipeline.tsx        # Interactive visual 8-stage sales pipeline
│   └── FollowUpForm.tsx           # Appointment scheduling and outcome capture
├── data/
│   └── mockData.ts                # Isolated demo data store for customers & leads
├── pages/
│   ├── CRMDashboardPage.tsx       # KPI cards, funnel metrics & quick actions
│   ├── CustomerCreatePage.tsx     # Client registration page
│   ├── CustomerDetailsPage.tsx    # Customer 360 profile with sub-tabs
│   ├── CustomerEditPage.tsx       # Profile editor
│   ├── CustomersPage.tsx          # Data table with multi-filter search
│   ├── EnquiryCreatePage.tsx      # Solar capacity & quote intake
│   ├── EnquiryDetailsPage.tsx     # Pipeline advancement & specification review
│   ├── EnquiriesPage.tsx          # Solar enquiries list table
│   └── FollowUpsPage.tsx          # Overdue, due today & upcoming tasks
├── services/
│   ├── customerService.ts         # List, getById, create, update, activities
│   ├── enquiryService.ts          # List, create, updateStatus, dashboard stats
│   └── followUpService.ts         # List, create, complete, reschedule, cancel
└── types/
    ├── customer.types.ts          # Customer, CustomerSummary, CustomerFormData
    ├── enquiry.types.ts           # Enquiry, SystemType, CapacityOption, Status
    └── followUp.types.ts          # FollowUp, Type, Status, Form interfaces
```

---

## 3. Data Flow & Lifecycle

### 3.1 Customer Data Flow
1. **List & Filter**: `CustomersPage` requests `customerService.list()` with pagination, search keywords, customer type, city, and status.
2. **Registration**: `CustomerCreatePage` invokes `CustomerForm`. On submission, valid data is sent to `customerService.create()` generating unique ID codes (`CUST-XXXX`).
3. **Detail View**: `CustomerDetailsPage` loads customer details alongside linked enquiries and scheduled follow-ups concurrently using `Promise.all()`.

### 3.2 Solar Enquiry Lifecycle
1. **Creation**: `EnquiryCreatePage` captures system requirements (on-grid/off-grid, 1–5 kW or custom capacity, monthly bill, and roof location).
2. **Customer Linkage**: Can select an existing customer or proceed directly.
3. **Pipeline Stages**:
   - `New` → `Contacted` → `Qualified` → `Site Survey Pending` → `Survey Completed` → `Quotation Sent` → `Won` / `Lost`
4. **Transition**: Users can advance stages with one click on `EnquiryPipeline` or provide a detailed lost reason when applicable.

### 3.3 Follow-up Lifecycle
1. Scheduled with customer ID, enquiry reference, date, time, and type (Phone Call, Email, Meeting, Site Visit).
2. Automated classification for Overdue (`followUpDate < today`), Due Today, and Upcoming.
3. Completion requires entering an **Outcome Note** before changing status from `pending` to `completed`.

---

## 4. RBAC & Route Protection Integration

M01 integrates with the M00 RBAC matrix:
- **Routes**: `/crm/*` routes are protected by `<ProtectedRoute module="customers" />`.
- **Technicians & Inventory Managers**: Forbidden from accessing `/crm` (redirected to `/unauthorized`).
- **Surveyors, Installation Managers, Finance Officers**: Granted view access. Create and edit buttons are automatically hidden via `<PermissionGuard module="customers" require="full">`.
- **Admins & Sales Executives**: Granted full access to create, update, and manage customers and enquiries.

---

## 5. Backend Integration Readiness

The service layer functions as an abstraction over API calls. To connect real backend endpoints, replace the mock store with `apiClient` requests in:
- `src/features/crm/services/customerService.ts`
- `src/features/crm/services/enquiryService.ts`
- `src/features/crm/services/followUpService.ts`

No UI component modifications are required.

