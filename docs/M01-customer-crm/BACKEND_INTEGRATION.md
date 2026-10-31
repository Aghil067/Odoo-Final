# Module M01 – Backend Integration Specification
## Customer & CRM API Contracts (Provisional)

> **Notice:** The endpoints, schemas, and parameter formats below are proposals for discussion with the backend developer.

---

## 1. Proposed Endpoints

### 1.1 Customer Endpoints

| Method | Endpoint | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/customers` | Query customers with search and pagination | `customers:view` |
| `POST` | `/api/customers` | Register a new customer | `customers:full` |
| `GET` | `/api/customers/:id` | Get complete customer profile by ID | `customers:view` |
| `PUT` | `/api/customers/:id` | Update customer profile details | `customers:full` |
| `GET` | `/api/customers/:id/activity` | Get chronological activity events | `customers:view` |

#### `POST /api/customers` Request Payload
```json
{
  "customerType": "business",
  "fullName": "SunBright Solutions Pvt Ltd",
  "contactPerson": "Priya Menon",
  "phone": "9988776655",
  "alternatePhone": "9988776644",
  "email": "contact@sunbright.com",
  "gstNumber": "32AAAAA0000A1Z5",
  "addressLine1": "45 Commercial Road",
  "addressLine2": "Suite 201",
  "city": "Kochi",
  "state": "Kerala",
  "pinCode": "682001",
  "country": "India",
  "source": "website",
  "notes": "Interested in 20kW rooftop solar.",
  "status": "prospect"
}
```

---

### 1.2 Solar Enquiry Endpoints

| Method | Endpoint | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/enquiries` | Query solar enquiries with filters | `customers:view` |
| `POST` | `/api/enquiries` | Create a new solar lead/enquiry | `customers:full` |
| `GET` | `/api/enquiries/:id` | Get enquiry details & solar specs | `customers:view` |
| `PUT` | `/api/enquiries/:id` | Edit enquiry information | `customers:full` |
| `PATCH` | `/api/enquiries/:id/status` | Update pipeline stage or mark won/lost | `customers:full` |
| `GET` | `/api/enquiries/stats` | Pipeline funnel & dashboard metrics | `customers:view` |

#### `POST /api/enquiries` Request Payload
```json
{
  "customerId": "cust-001",
  "customerName": "Rajesh Kumar",
  "customerPhone": "9876543210",
  "customerEmail": "rajesh@gmail.com",
  "systemType": "on_grid",
  "capacityOption": "3kw",
  "propertyType": "residential",
  "installationLocation": "12, MG Road, Kochi",
  "monthlyElectricityBill": 3500,
  "requirements": "Rooftop monocrystalline panels requested.",
  "leadSource": "referral",
  "assignedTo": "user-sales-01",
  "enquiryDate": "2026-10-31",
  "nextFollowUpDate": "2026-11-03",
  "priority": "high",
  "status": "new"
}
```

#### `PATCH /api/enquiries/:id/status` Request Payload
```json
{
  "status": "lost",
  "lostReason": "Selected competitor due to shorter timeline."
}
```

---

### 1.3 Follow-up Endpoints

| Method | Endpoint | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/follow-ups` | List follow-ups (`today`, `overdue`, `upcoming`) | `customers:view` |
| `POST` | `/api/follow-ups` | Schedule a customer follow-up | `customers:full` |
| `PATCH` | `/api/follow-ups/:id/complete` | Complete with mandatory outcome note | `customers:full` |
| `PATCH` | `/api/follow-ups/:id/reschedule` | Reschedule date and time | `customers:full` |
| `PATCH` | `/api/follow-ups/:id/cancel` | Cancel scheduled task | `customers:full` |

#### `PATCH /api/follow-ups/:id/complete` Request Payload
```json
{
  "outcomeNote": "Spoke with client. Confirmed site survey visit for Tuesday morning."
}
```

---

## 2. Key Questions for Backend Team

1. **Auto-Generated IDs**: Should customer IDs (`CUST-XXXX`) and enquiry IDs (`ENQ-XXXX`) be assigned by a database sequence or UUIDs formatted by the API layer?
2. **Server-Side Search**: Will text search on customers use PostgreSQL Full-Text Search or simple `ILIKE` across `fullName`, `phone`, and `email`?
3. **Pipeline Automated Events**: When an enquiry transitions to `site_survey_pending`, should the backend automatically create a pending task in Module M02 (Site Survey)?
4. **GST Validation**: Should the backend validate the GSTIN format against government GST APIs or use regex validation?
5. **Activity Log Storage**: Will customer events be generated via database triggers or an event-sourcing bus?

