# M01 frontend API contract — for Abisha

Backend source root: `E:\Downloads\odoo-hackathon-24hrs`. This is the implemented `/api` contract, not a request to build a second frontend. JSON examples below are illustrative documentation only; no example records or accounts are inserted by the application or during verification.

## Transport and authentication

Local base URL: `http://localhost:3000/api`. Configure backend `APP_ORIGIN` to your exact frontend origin (`http://localhost:5173` by default). Use `credentials: 'include'` on **every** request. Browser fetch provides Origin automatically; API tools must explicitly send the configured Origin on POST/PATCH. All POST/PATCH calls require `Content-Type: application/json`.

1. POST `/auth/login` with email/password. Save the returned `csrfToken` in memory.
2. Every later POST/PATCH also sends `X-CSRF-Token`.
3. On page reload GET `/auth/me` to restore the public user and CSRF token.
4. POST `/auth/logout` with `{}` and the CSRF header. Clear frontend user state.

The browser holds the HttpOnly session cookie; frontend code must not read or copy it. Never put session tokens/passwords in localStorage. API responses set `Cache-Control: no-store`. Cookies use SameSite=lax by default and Secure in production. See README for cross-site hosting limitations.

```ts
let csrfToken: string | undefined;
const baseUrl = 'http://localhost:3000/api';
async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(baseUrl + path, {
    method, credentials: 'include',
    headers: method === 'GET' ? {} : {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw result.error;
  return result as T;
}
// After login or /me: csrfToken = response.data.csrfToken.
```

GET endpoints need no CSRF token. POST login needs trusted Origin but no preexisting session/CSRF. Authentication errors are 401; role/CSRF/origin errors 403. Four non-sales roles may log in but cannot load CRM pages. Render record-not-found on 404 and refresh/edit-conflict UI on 409. Do not blindly retry writes after a network timeout.

## Shared TypeScript response types

These types describe serialized JSON. ISODateTime includes timezone (outputs are UTC); UUID and DecimalString are strings. Decimal outputs may omit trailing zeros, so format for display rather than string-comparing amounts.

```ts
type UUID = string;
type ISODateTime = string;
type DecimalString = string;
type Role = 'ADMIN' | 'SALES' | 'TECHNICIAN' | 'WAREHOUSE' | 'SUPPORT' | 'FINANCE';
type CustomerType = 'INDIVIDUAL' | 'BUSINESS';
type LeadSource = 'WEBSITE' | 'PHONE' | 'WALK_IN' | 'REFERRAL' | 'OTHER';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SURVEY_REQUESTED' | 'LOST' | 'DISQUALIFIED';
type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type SystemType = 'ON_GRID' | 'OFF_GRID' | 'UNDECIDED';
type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'FOLLOW_UP';
interface PublicUser { id: UUID; name: string; email: string; role: Role }
interface Pagination { page: number; pageSize: number; totalItems: number; totalPages: number }
interface Success<T> { data: T }
interface Page<T> extends Success<T[]> { pagination: Pagination }
interface ApiFailure { error: { code: string; message: string; details?: {field: string; message: string}[]; requestId: UUID } }
interface DuplicateWarning {
  code: 'POSSIBLE_DUPLICATE'; message: string;
  matches: Pick<Customer, 'id' | 'reference' | 'name'>[];
}
interface CustomerWriteResult extends Success<Customer> { warnings: DuplicateWarning[] }
interface Customer {
  id: UUID; reference: string; type: CustomerType; name: string;
  phone: string; normalizedPhone: string; email: string | null;
  companyName: string | null; notes: string | null;
  isArchived: boolean; archivedAt: ISODateTime | null; version: number;
  createdById: UUID; createdAt: ISODateTime; updatedAt: ISODateTime;
}
interface Site {
  id: UUID; customerId: UUID; name: string;
  addressLine1: string; addressLine2: string | null;
  city: string; state: string; postalCode: string; country: string;
  landmark: string | null; propertyNotes: string | null;
  latitude: DecimalString | null; longitude: DecimalString | null;
  version: number; createdAt: ISODateTime; updatedAt: ISODateTime;
}
interface Lead {
  id: UUID; reference: string; customerId: UUID; siteId: UUID;
  source: LeadSource; status: LeadStatus; priority: LeadPriority;
  requestedCapacityKw: DecimalString | null; preferredSystemType: SystemType;
  monthlyElectricityBill: DecimalString | null;
  assignedToId: UUID | null; createdById: UUID;
  qualificationNotes: string | null; nextFollowUpAt: ISODateTime | null;
  closedReason: string | null; version: number;
  createdAt: ISODateTime; updatedAt: ISODateTime;
}
interface LeadActivity {
  id: UUID; leadId: UUID; actorId: UUID; type: ActivityType;
  description: string; createdAt: ISODateTime;
}
interface LeadStatusHistory {
  id: UUID; leadId: UUID; actorId: UUID; fromStatus: LeadStatus | null;
  toStatus: LeadStatus; reason: string | null; createdAt: ISODateTime;
}
interface LeadListItem extends Lead {
  customer: Pick<Customer, 'id' | 'reference' | 'name'>;
  site: Pick<Site, 'id' | 'name'>; assignedTo: PublicUser | null;
}
interface CustomerDetail extends Customer {
  sites: Site[]; leads: Lead[]; sitesPagination: Pagination; leadsPagination: Pagination;
}
interface LeadDetail extends Lead {
  customer: Customer; site: Site; assignedTo: PublicUser | null; createdBy: PublicUser;
  activities: (LeadActivity & {actor: PublicUser})[];
  statusHistory: (LeadStatusHistory & {actor: PublicUser})[];
  activitiesPagination: Pagination; historyPagination: Pagination;
}
interface FollowUpPreview {
  id: UUID; reference: string; customerId: UUID;
  nextFollowUpAt: ISODateTime | null; assignedToId: UUID | null;
}
interface CrmSummary {
  asOf: ISODateTime; upcomingUntil: ISODateTime;
  totalCustomers: number; totalLeads: number; newLeads: number;
  qualifiedLeads: number; surveyRequests: number; lostLeads: number;
  leadsByStatus: {status: LeadStatus; count: number}[];
  leadsBySource: {source: LeadSource; count: number}[];
  upcomingFollowUps: {total: number; items: FollowUpPreview[]};
  overdueFollowUps: {total: number; items: FollowUpPreview[]};
  qualifiedEver: number; qualificationConversionRate: number;
}
```

## Input types and validation

```ts
interface CreateCustomer {
  name: string; phone: string; type?: CustomerType; // default INDIVIDUAL
  email?: string | null; companyName?: string | null; notes?: string | null;
}
type UpdateCustomer = Partial<CreateCustomer> & {version: number};
interface SiteFields {
  name: string; addressLine1: string; addressLine2?: string | null;
  city: string; state: string; postalCode: string; country: string;
  landmark?: string | null; propertyNotes?: string | null;
  latitude?: number | null; longitude?: number | null;
}
type UpdateSite = Partial<SiteFields> & {version: number};
interface LeadFields {
  source: LeadSource; priority?: LeadPriority;
  requestedCapacityKw?: DecimalString | null; preferredSystemType?: SystemType;
  monthlyElectricityBill?: DecimalString | null;
  qualificationNotes?: string | null; nextFollowUpAt?: ISODateTime | null;
}
interface CreateLead extends LeadFields { customerId: UUID; siteId: UUID; assignedToId?: UUID | null }
type UpdateLead = Partial<LeadFields> & {siteId?: UUID; version: number};
interface StatusInput { status: LeadStatus; version: number; reason?: string | null }
interface AssignInput { assignedToId: UUID | null; version: number }
interface ActivityInput { type: ActivityType; description: string }
```

Rules:

- Required strings are trimmed/nonempty. Unknown keys are rejected. Optional nullable fields use null to clear; omission preserves the current value on PATCH. PATCH requires at least one editable field besides version. Create defaults never overwrite omitted PATCH fields.
- Customer name <=160; phone <=40 and valid under libphonenumber; email <=254 and valid; company <=160; notes <=5000. Email is lowercased. International phone format is recommended; default parsing country is configured by backend (IN initially). Phone extensions are rejected.
- Site name <=160; address lines <=250; city/state <=100; postalCode <=20; valid country alpha-2 code; landmark <=250; notes <=5000. Provide both coordinates together as numbers, max six fractional digits, latitude -90..90 and longitude -180..180; omit both if unknown, or clear both with null. Never fabricate a coordinate.
- Capacity: positive string, at most seven integer and three fractional digits. Bill: nonnegative string, at most twelve integer and two fractional digits. No exponent notation, commas, currency symbols or leading zero padding. E.g. `"5.25"`, `"4500.00"`; JSON numeric inputs are rejected for these fields.
- Qualification notes/activity description <=5000. Closing/reopening reason <=2000. Dates must be ISO with timezone; new follow-up schedules must be future instants. Default lead priority MEDIUM, system UNDECIDED and status NEW.
- Customer/site/lead ownership identifiers and actors are server-controlled. Status changes use the status endpoint, assignment changes use assign. Always use the version returned by the most recent fetch/write.

## Endpoint and response matrix

All CRM endpoints require ADMIN or SALES and enforce record access. `/crm/salespeople` additionally requires ADMIN.

| Method and path | Request | Response data | HTTP |
|---|---|---|---|
| GET `/health` | none; public | `{status:'ok',module:'M01'}` | 200 |
| POST `/auth/login` | `{email,password}` | `{user:PublicUser,csrfToken:string,expiresAt:ISODateTime}` | 200 |
| GET `/auth/me` | cookie | `{user:PublicUser,csrfToken:string}` | 200 |
| POST `/auth/logout` | `{}` | `{loggedOut:true}` | 200 |
| POST `/customers` | CreateCustomer | Customer; top-level warnings | 201 |
| GET `/customers` | customer filters below | Customer[] + pagination | 200 |
| GET `/customers/:id` | UUID | CustomerDetail | 200 |
| PATCH `/customers/:id` | UpdateCustomer | Customer; top-level warnings | 200 |
| POST `/customers/:id/archive` | `{version:number}` | Customer | 200 |
| POST `/customers/:id/sites` | SiteFields | Site | 201 |
| GET `/customers/:id/sites` | page/pageSize | Site[] + pagination | 200 |
| GET `/sites/:id` | UUID | Site | 200 |
| PATCH `/sites/:id` | UpdateSite | Site | 200 |
| POST `/leads` | CreateLead | Lead | 201 |
| GET `/leads` | lead filters below | LeadListItem[] + pagination | 200 |
| GET `/leads/:id` | UUID | LeadDetail | 200 |
| PATCH `/leads/:id` | UpdateLead | Lead | 200 |
| POST `/leads/:id/assign` | AssignInput | Lead | 200 |
| POST `/leads/:id/status` | StatusInput | Lead | 200 |
| POST `/leads/:id/activities` | ActivityInput | LeadActivity | 201 |
| GET `/leads/:id/activities` | page/pageSize | `(LeadActivity & {actor:PublicUser})[]` + pagination | 200 |
| GET `/leads/:id/history` | page/pageSize | `(LeadStatusHistory & {actor:PublicUser})[]` + pagination | 200 |
| GET `/crm/summary` | none | CrmSummary | 200 |
| GET `/crm/salespeople` | page/pageSize, q? | `{id,name,email}[]` + pagination | 200 |

## Filters, sorting and pagination

All list endpoints default page=1, pageSize=20, max pageSize=100. Empty results have `data:[]`, `totalItems:0`, `totalPages:0`. Business/timeline lists sort newest createdAt then UUID descending; salesperson picker sorts name then UUID ascending. Sorting is not client-configurable. Query values are strings; enum matching is case-sensitive.

Customers: `q` (1–160 chars: name/reference/company/email/original phone, plus exact normalized phone when parseable), `type`, `archived=true|false` (default false; true returns only archived customers).

Leads: `q` (reference/customer name/site name/qualification notes), `status`, `source`, `priority`, `customerId`, `siteId`, `assignedToId`, `followUp=upcoming|overdue`. Upcoming is next seven rolling days; both follow-up filters exclude LOST/DISQUALIFIED. Filters intersect; impossible combinations return empty results. No unassigned-only filter is currently provided. All filters remain inside the caller's scope.

Customer details embed at most 20 sites and visible leads; use `/customers/:id/sites` and `/leads?customerId=:id` for more. Lead details embed at most 20 activities and 20 history rows; use their paginated endpoints for more. Do not assume embedded arrays are the entire timeline.

```json
{
  "data": [],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0 }
}
```

## JSON examples

IDs, names and timestamps are illustrative. Replace IDs with actual API results. No sample accounts exist. The example phone uses the reserved US fictional number block. Follow-up example dates must be changed to a future date when submitting later.

### Login and session recovery

POST `/api/auth/login`:

```json
{ "email": "operator@example.com", "password": "<your actual provisioned password>" }
```

```json
{
  "data": {
    "user": { "id": "11111111-1111-4111-8111-111111111111", "name": "Operator", "email": "operator@example.com", "role": "ADMIN" },
    "csrfToken": "<64 lowercase hexadecimal characters returned by the backend>",
    "expiresAt": "2026-11-01T04:00:00.000Z"
  }
}
```

GET `/api/auth/me` returns the same user/CSRF properties without expiresAt. POST `/api/auth/logout` with `{}` returns `{"data":{"loggedOut":true}}`.

### Create and edit a customer

POST `/api/customers`:

```json
{ "name": "Example Customer", "type": "INDIVIDUAL", "phone": "+12025550123", "email": "customer@example.com" }
```

201 response:

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "reference": "CUS-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "type": "INDIVIDUAL", "name": "Example Customer",
    "phone": "+12025550123", "normalizedPhone": "+12025550123",
    "email": "customer@example.com", "companyName": null, "notes": null,
    "isArchived": false, "archivedAt": null, "version": 1,
    "createdById": "11111111-1111-4111-8111-111111111111",
    "createdAt": "2026-10-31T20:00:00.000Z", "updatedAt": "2026-10-31T20:00:00.000Z"
  },
  "warnings": []
}
```

PATCH `/api/customers/22222222-2222-4222-8222-222222222222`:

```json
{ "version": 1, "notes": "Customer requested an initial sales call." }
```

Response is the same Customer shape with saved notes, version=2, new updatedAt and top-level warnings. Any warning contains at most ten visible matching IDs/references/names. A warning does not undo creation; show it as a review prompt without automatic merging. Archive with `{"version":2}` at `/customers/:id/archive` only once no active leads remain; response updates isArchived, archivedAt and version.

### Create a physical site

POST `/api/customers/22222222-2222-4222-8222-222222222222/sites`:

```json
{
  "name": "Main property", "addressLine1": "123 Example Street",
  "city": "Washington", "state": "DC", "postalCode": "20001", "country": "US"
}
```

201 response (unknown coordinates remain null):

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333", "customerId": "22222222-2222-4222-8222-222222222222",
    "name": "Main property", "addressLine1": "123 Example Street", "addressLine2": null,
    "city": "Washington", "state": "DC", "postalCode": "20001", "country": "US",
    "landmark": null, "propertyNotes": null, "latitude": null, "longitude": null,
    "version": 1, "createdAt": "2026-10-31T20:01:00.000Z", "updatedAt": "2026-10-31T20:01:00.000Z"
  }
}
```

PATCH `/api/sites/:id` with `{"version":1,"propertyNotes":"Customer owns the property."}` returns Site with version=2. Site/customer IDs cannot be changed.

### Create a lead

POST `/api/leads`:

```json
{
  "customerId": "22222222-2222-4222-8222-222222222222", "siteId": "33333333-3333-4333-8333-333333333333",
  "source": "PHONE", "requestedCapacityKw": "5.25", "preferredSystemType": "ON_GRID",
  "monthlyElectricityBill": "4500.00", "nextFollowUpAt": "2026-11-02T10:00:00+05:30"
}
```

201 response (ADMIN creates an unassigned lead by default):

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444", "reference": "LED-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "customerId": "22222222-2222-4222-8222-222222222222", "siteId": "33333333-3333-4333-8333-333333333333",
    "source": "PHONE", "status": "NEW", "priority": "MEDIUM", "requestedCapacityKw": "5.25",
    "preferredSystemType": "ON_GRID", "monthlyElectricityBill": "4500",
    "assignedToId": null, "createdById": "11111111-1111-4111-8111-111111111111",
    "qualificationNotes": null, "nextFollowUpAt": "2026-11-02T04:30:00.000Z", "closedReason": null,
    "version": 1, "createdAt": "2026-10-31T20:02:00.000Z", "updatedAt": "2026-10-31T20:02:00.000Z"
  }
}
```

### Assign a salesperson and update status

ADMIN fetches GET `/api/crm/salespeople?page=1&pageSize=20`:

```json
{
  "data": [{ "id": "55555555-5555-4555-8555-555555555555", "name": "Sales Representative", "email": "sales@example.com" }],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 }
}
```

POST `/api/leads/44444444-4444-4444-8444-444444444444/assign`:

```json
{ "version": 1, "assignedToId": "55555555-5555-4555-8555-555555555555" }
```

200 response:

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444", "reference": "LED-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "customerId": "22222222-2222-4222-8222-222222222222", "siteId": "33333333-3333-4333-8333-333333333333",
    "source": "PHONE", "status": "NEW", "priority": "MEDIUM", "requestedCapacityKw": "5.25",
    "preferredSystemType": "ON_GRID", "monthlyElectricityBill": "4500",
    "assignedToId": "55555555-5555-4555-8555-555555555555", "createdById": "11111111-1111-4111-8111-111111111111",
    "qualificationNotes": null, "nextFollowUpAt": "2026-11-02T04:30:00.000Z", "closedReason": null,
    "version": 2, "createdAt": "2026-10-31T20:02:00.000Z", "updatedAt": "2026-10-31T20:04:00.000Z"
  }
}
```

ADMIN may send null to unassign. SALES may only assign self within existing scope. The assignment creates a persisted NOTE.

POST `/api/leads/44444444-4444-4444-8444-444444444444/status`:

```json
{ "version": 2, "status": "CONTACTED", "reason": "Initial sales call completed." }
```

200 response:

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444", "reference": "LED-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "customerId": "22222222-2222-4222-8222-222222222222", "siteId": "33333333-3333-4333-8333-333333333333",
    "source": "PHONE", "status": "CONTACTED", "priority": "MEDIUM", "requestedCapacityKw": "5.25",
    "preferredSystemType": "ON_GRID", "monthlyElectricityBill": "4500",
    "assignedToId": "55555555-5555-4555-8555-555555555555", "createdById": "11111111-1111-4111-8111-111111111111",
    "qualificationNotes": null, "nextFollowUpAt": "2026-11-02T04:30:00.000Z", "closedReason": null,
    "version": 3, "createdAt": "2026-10-31T20:02:00.000Z", "updatedAt": "2026-10-31T20:05:00.000Z"
  }
}
```

A corresponding real history row is inserted. Next PATCH the lead with `{"version":3,"qualificationNotes":"Interested in a rooftop system; requested a survey."}` (returns version=4), then POST status `{"version":4,"status":"QUALIFIED"}` (returns version=5). A subsequent SURVEY_REQUESTED transition returns version=6; it does not create or approve a technical survey.

Close with `{"version":6,"status":"LOST","reason":"Customer postponed the project."}`; reopen only as ADMIN with current version, status CONTACTED and a reason. Always use real versions returned by the API, not the illustrative sequence if other edits occurred.

### Activity and scheduling

POST `/api/leads/:id/activities`:

```json
{ "type": "CALL", "description": "Discussed the customer's installation goals." }
```

201 response:

```json
{
  "data": {
    "id": "66666666-6666-4666-8666-666666666666", "leadId": "44444444-4444-4444-8444-444444444444",
    "actorId": "11111111-1111-4111-8111-111111111111", "type": "CALL",
    "description": "Discussed the customer's installation goals.", "createdAt": "2026-10-31T20:03:00.000Z"
  }
}
```

Activity creation does not increment the lead version. To schedule use PATCH `/api/leads/:id` with `{"version":3,"nextFollowUpAt":"2026-11-03T10:00:00+05:30"}`. Clearing uses null. Each schedule edit saves a FOLLOW_UP activity; adding a FOLLOW_UP activity directly does not schedule anything.

### Fetch a lead detail page

GET `/api/leads/44444444-4444-4444-8444-444444444444` returns `Success<LeadDetail>`. This standalone example represents a newly created, unassigned lead before subsequent edits:

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444", "reference": "LED-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "customerId": "22222222-2222-4222-8222-222222222222", "siteId": "33333333-3333-4333-8333-333333333333",
    "source": "PHONE", "status": "NEW", "priority": "MEDIUM", "requestedCapacityKw": "5.25",
    "preferredSystemType": "ON_GRID", "monthlyElectricityBill": "4500", "assignedToId": null,
    "createdById": "11111111-1111-4111-8111-111111111111", "qualificationNotes": null,
    "nextFollowUpAt": "2026-11-02T04:30:00.000Z", "closedReason": null, "version": 1,
    "createdAt": "2026-10-31T20:02:00.000Z", "updatedAt": "2026-10-31T20:02:00.000Z",
    "customer": {
      "id": "22222222-2222-4222-8222-222222222222", "reference": "CUS-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "type": "INDIVIDUAL", "name": "Example Customer", "phone": "+12025550123", "normalizedPhone": "+12025550123",
      "email": "customer@example.com", "companyName": null, "notes": null, "isArchived": false, "archivedAt": null,
      "version": 1, "createdById": "11111111-1111-4111-8111-111111111111",
      "createdAt": "2026-10-31T20:00:00.000Z", "updatedAt": "2026-10-31T20:00:00.000Z"
    },
    "site": {
      "id": "33333333-3333-4333-8333-333333333333", "customerId": "22222222-2222-4222-8222-222222222222",
      "name": "Main property", "addressLine1": "123 Example Street", "addressLine2": null, "city": "Washington",
      "state": "DC", "postalCode": "20001", "country": "US", "landmark": null, "propertyNotes": null,
      "latitude": null, "longitude": null, "version": 1,
      "createdAt": "2026-10-31T20:01:00.000Z", "updatedAt": "2026-10-31T20:01:00.000Z"
    },
    "assignedTo": null,
    "createdBy": { "id": "11111111-1111-4111-8111-111111111111", "name": "Operator", "email": "operator@example.com", "role": "ADMIN" },
    "activities": [{
      "id": "77777777-7777-4777-8777-777777777777", "leadId": "44444444-4444-4444-8444-444444444444",
      "actorId": "11111111-1111-4111-8111-111111111111", "type": "NOTE", "description": "Lead created from customer enquiry",
      "createdAt": "2026-10-31T20:02:00.000Z",
      "actor": { "id": "11111111-1111-4111-8111-111111111111", "name": "Operator", "email": "operator@example.com", "role": "ADMIN" }
    }],
    "statusHistory": [{
      "id": "88888888-8888-4888-8888-888888888888", "leadId": "44444444-4444-4444-8444-444444444444",
      "actorId": "11111111-1111-4111-8111-111111111111", "fromStatus": null, "toStatus": "NEW",
      "reason": "Customer enquiry created", "createdAt": "2026-10-31T20:02:00.000Z",
      "actor": { "id": "11111111-1111-4111-8111-111111111111", "name": "Operator", "email": "operator@example.com", "role": "ADMIN" }
    }],
    "activitiesPagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 },
    "historyPagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 }
  }
}
```

### CRM summary

GET `/api/crm/summary`, example of an empty authorized dataset (timestamps are illustrative):

```json
{
  "data": {
    "asOf": "2026-10-31T20:00:00.000Z", "upcomingUntil": "2026-11-07T20:00:00.000Z",
    "totalCustomers": 0, "totalLeads": 0, "newLeads": 0, "qualifiedLeads": 0, "surveyRequests": 0, "lostLeads": 0,
    "leadsByStatus": [], "leadsBySource": [],
    "upcomingFollowUps": { "total": 0, "items": [] }, "overdueFollowUps": { "total": 0, "items": [] },
    "qualifiedEver": 0, "qualificationConversionRate": 0
  }
}
```

With data, grouped rows are `{status,count}` and `{source,count}`. Follow-up items use FollowUpPreview. Qualification conversion is the percentage of visible leads ever qualified according to saved history, even if subsequently lost. totalCustomers excludes archived customers; totalLeads includes closed leads. The module never returns seeded/hardcoded KPIs.

### Error example

```json
{
  "error": {
    "code": "VALIDATION_ERROR", "message": "Request validation failed",
    "details": [{ "field": "monthlyElectricityBill", "message": "Invalid input: expected string, received number" }],
    "requestId": "99999999-9999-4999-8999-999999999999"
  }
}
```

Treat `code` and HTTP status as stable machine signals; Zod's human-readable messages may vary. Display server field errors without assuming exact wording. Errors include a generated X-Request-Id header. Version/serialization conflicts require refreshing the record before retrying; duplicate create POSTs are not automatically deduplicated.

## Allowed workflow for the UI

NEW → CONTACTED or LOST/DISQUALIFIED. CONTACTED → QUALIFIED or LOST/DISQUALIFIED. QUALIFIED → SURVEY_REQUESTED or LOST/DISQUALIFIED. SURVEY_REQUESTED → QUALIFIED (cancel request) or LOST/DISQUALIFIED. LOST/DISQUALIFIED → CONTACTED only for ADMIN with a reason. Closing requires a reason; qualification requires existing notes. Hide invalid actions, but rely on backend enforcement. Archived customers are read-only and cannot be unarchived here.

SALES sees customers they created or with a visible lead (assigned to self or own unassigned), and only assigned-to-self or own unassigned leads. A reassigned lead may disappear after assignment; the frontend should handle that as normal authorization behavior. Customer detail never embeds another salesperson's inaccessible leads.
