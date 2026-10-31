# Module M01 – Features Documentation
## Customer & CRM Management Capabilities

---

## 1. CRM Dashboard (`/crm`)

The CRM Dashboard provides a sales operational view designed for SunPower Solutions:
- **KPI Summary Cards**:
  - Total Customers (Active, Inactive, Prospects)
  - Total Enquiries
  - New Enquiries (Awaiting representative contact)
  - Qualified Leads (High potential solar prospects)
  - Follow-ups Due (Displays overdue count in warning color)
  - Won / Converted Enquiries
- **Pipeline Stage Visualizer**:
  - Progress bars displaying distribution across New, Contacted, Qualified, Survey Pending, Survey Done, Quotation Sent, Won, and Lost.
- **Recent Enquiries List**: Direct navigation to recent incoming leads.
- **Upcoming Follow-ups Widget**: Quick view of today's customer interactions.
- **Recently Added Customers**: Fast link to newly registered client profiles.
- **Quick Action Triggers**: Instant buttons to "Add Customer" and "Create Enquiry" (permission guarded).

---

## 2. Customer Management (`/crm/customers`)

- **Listing & Search**:
  - Search by customer name, phone number, or email with immediate responsive table updates.
  - Multi-filtering by Customer Type (`Individual`, `Business`, `Organization`), Status (`Active`, `Inactive`, `Prospect`), and City.
- **Server/Service Pagination**: Clean page switching with record counts.
- **Customer Registration (`/crm/customers/new`)**:
  - Basic details, phone validation (10 digits), optional email validation.
  - Conditional Contact Person and GST Number fields when customer type is Business or Organization.
  - Complete address entry (Line 1, Line 2, City, State, PIN code).
  - Source tracking (Website, Phone Call, Referral, Social Media, Walk-in).
- **Customer Profile (`/crm/customers/:id`)**:
  - Header with customer ID badge and status indicator.
  - Four organized tabs:
    1. **Overview**: Contact numbers, address details, and linked site count.
    2. **Enquiries**: List of all solar enquiries created for this customer.
    3. **Follow-ups**: Scheduled calls, meetings, or site inspections.
    4. **Notes & Timeline**: Comprehensive chronological event history.

---

## 3. Solar Enquiry Management (`/crm/enquiries`)

- **Enquiry Listing**:
  - Overview of all prospective solar jobs with capacity, location, lead source, and assigned representative.
  - Filter by Status and Solar System Type (On-grid vs Off-grid).
- **Enquiry Creation (`/crm/enquiries/new`)**:
  - Link to an existing customer or type in new lead contact information.
  - Solar specifications: System Type (On-grid / Off-grid), Capacity (1 kW, 2 kW, 3 kW, 4 kW, 5 kW, or Custom kW), Property Type (Residential / Commercial).
  - Monthly electricity bill input (helpful for solar capacity sizing).
  - Rooftop site location and specific customer notes.
- **Enquiry Details & Pipeline Management (`/crm/enquiries/:id`)**:
  - **Interactive 8-Stage Pipeline**: Visual stage stepper allowing one-click advancement through the sales cycle.
  - **Change Status Action**: Modal dropdown with mandatory Lost Reason entry for lost deals.
  - **Schedule Follow-up**: Link follow-ups directly to specific enquiries.
  - **Conversion Alert**: Prominent confirmation banner when a lead is marked Won.

---

## 4. Follow-up Management (`/crm/follow-ups`)

- **Task Filters**:
  - Quick pills: `All Tasks`, `Due Today`, `Upcoming`, `Overdue`.
- **Status Tracking**:
  - Identifies pending vs completed appointments.
  - Visual red warning tags for overdue tasks.
- **Completion Workflow**:
  - Clicking "Complete" displays a required Outcome Note field (summarizing conversation and next steps) before resolving the task.
- **Reschedule & Cancel**: Representatives can adjust meeting dates or cancel invalid appointments.

---

## 5. Role-Based Access Control Summary

| Role | Module Access | Actions Permitted |
|---|---|---|
| **Admin** | Full Access | View, Create, Edit Customers, Enquiries, Follow-ups |
| **Sales Executive** | Full Access | View, Create, Edit Customers, Enquiries, Follow-ups |
| **Surveyor** | View-Only | View all records, cannot create or modify |
| **Installation Manager** | View-Only | View all records, cannot create or modify |
| **Finance Officer** | View-Only | View all records, cannot create or modify |
| **Service Manager** | View-Only | View all records, cannot create or modify |
| **Inventory Manager** | No Access | Access Denied (`/unauthorized`) |
| **Technician** | No Access | Access Denied (`/unauthorized`) |

---

## 6. Current Boundaries & Future Modules

- **Site Survey Execution**: M01 records "Site Survey Pending" status in the pipeline, but does not perform the survey (handled in M02).
- **Solar Engineering & BoM**: Sizing guidance is captured, but detailed configuration occurs in M03.
- **Physical Installation**: Converted enquiries will trigger installation job creation in M05.

