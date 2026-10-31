# Module M01 – Testing Documentation
## Verification and Test Results

---

## 1. Automated Test Suite Summary

The automated test suite runs via **Vitest 5.0** and executes 37 automated tests across M00 Authentication and M01 Customer & CRM Management.

```
 RUN  v5.0.5 D:/hyyydddeee

 ✓ src/tests/crm.test.tsx (18 tests)
   ✓ Customer Service Tests (6)
     ✓ 1. Lists initial customer records with pagination
     ✓ 2. Filters customers by search query (name or phone)
     ✓ 3. Filters customers by customerType
     ✓ 4. Creates a new customer successfully with generated ID
     ✓ 5. Updates an existing customer profile
     ✓ 6. Fetches customer activity timeline
   ✓ Enquiry Service Tests (4)
     ✓ 7. Lists enquiries with filter support
     ✓ 8. Creates a new solar enquiry with system specifications
     ✓ 9. Updates enquiry status across pipeline stages
     ✓ 10. Calculates dashboard statistics accurately
   ✓ Follow-up Service Tests (3)
     ✓ 11. Lists scheduled follow-ups and supports overdue filter
     ✓ 12. Completes a follow-up with mandatory outcome note
     ✓ 13. Reschedules and cancels a follow-up task
   ✓ M01 Role-Based Access Control (RBAC) Verification (5)
     ✓ 14. Admin has Full access to customers & CRM
     ✓ 15. Sales Executive has Full access to customers & CRM
     ✓ 16. Surveyor has View-only access to customers & CRM
     ✓ 17. Installation Manager and Finance Officer have View-only access
     ✓ 18. Inventory Manager and Technician are denied access to customers & CRM

 ✓ src/tests/auth.test.tsx (19 tests)
   ✓ MockAuthService (4)
   ✓ AuthContext – state management (4)
   ✓ ProtectedRoute (3)
   ✓ PermissionGuard (2)
   ✓ Roles & Helpers (6)

 Test Files  2 passed (2)
      Tests  37 passed (37)
   Duration  11.26s
```

---

## 2. Test Cases and Results

| # | Test Area | Description | Expected Result | Actual Result |
|---|---|---|---|---|
| 1 | Customers | Pagination & List fetching | Returns first page with total count | ✅ Passed |
| 2 | Customers | Case-insensitive keyword search | Returns matching customer names/phones | ✅ Passed |
| 3 | Customers | Filter by `customerType` | Returns only matching business/individual records | ✅ Passed |
| 4 | Customers | New customer creation | Generates ID `CUST-XXXX` and persists to store | ✅ Passed |
| 5 | Customers | Update customer record | Updates existing attributes and timestamp | ✅ Passed |
| 6 | Customers | Activity timeline retrieval | Returns event array with timestamps | ✅ Passed |
| 7 | Enquiries | List with system filters | Returns summary list of solar leads | ✅ Passed |
| 8 | Enquiries | Create with kW capacity | Saves on-grid/off-grid specs | ✅ Passed |
| 9 | Enquiries | Advance pipeline status | Progresses to Survey Pending, Won, or Lost | ✅ Passed |
| 10 | Enquiries | Dashboard metric counters | Correctly tallies counts by status | ✅ Passed |
| 11 | Follow-ups | Overdue and date filtering | Classifies past dates as overdue | ✅ Passed |
| 12 | Follow-ups | Complete with outcome note | Captures outcome note and marks closed | ✅ Passed |
| 13 | Follow-ups | Reschedule & cancel task | Updates date or sets status to cancelled | ✅ Passed |
| 14 | RBAC | Admin full permissions | Full create, read, edit access | ✅ Passed |
| 15 | RBAC | Sales Executive permissions | Full create, read, edit access | ✅ Passed |
| 16 | RBAC | Surveyor read-only | View-only access, forms hidden | ✅ Passed |
| 17 | RBAC | Manager/Finance read-only | View-only access, forms hidden | ✅ Passed |
| 18 | RBAC | Technician/Inventory denied | Forbidden access, redirected to `/unauthorized` | ✅ Passed |
| 19-37 | M00 Regression | Auth, sessions, routes, login | Zero regressions across baseline | ✅ Passed |

---

## 3. TypeScript Type-Check Results

```bash
npx tsc --noEmit
# Exit code: 0 (Zero errors)
```

---

## 4. Production Build Results

```bash
npm run build
# > tsc -b && vite build
# ✓ 2097 modules transformed.
# dist/index.html                   0.59 kB
# dist/assets/index-Su4PhQr-.css   38.08 kB
# dist/assets/index-C_mtPVKO.js   445.17 kB
# ✓ built in 744ms
```
- No build warnings or bundling errors.
- Assets packaged cleanly into the distribution folder.

---

## 5. Known Limitations for Hackathon Scope

1. **In-Memory Store Reset**: Refreshing the browser resets modifications back to the default mock dataset in `mockData.ts` (persists for the active browser session).
2. **Site Survey Handover**: The "Site Survey Pending" state is tracked in the pipeline, but survey generation occurs in Module M02.

