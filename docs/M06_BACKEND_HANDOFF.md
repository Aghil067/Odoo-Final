# M06 backend handoff

Branch codex/m06-technician-management, based on main 03aa1244262fabfad14f290c788421b7f078558f after M05 PR #5 merged. Therefore the draft PR targets main with M06-only changes. Checkout E:\Downloads\odoo-hackathon-24hrs\.publish\m06. Existing frontend, dependencies, source histories and M01–M05 migrations are preserved. No M07–M10 backend is implemented.

M06 extends existing User, not authentication. It adds profiles, skills/certifications, effective teams/membership, weekly calendars/shifts/breaks, nonworking exceptions, private leave and workforce audit. The central availability coordinator reads real M02 surveys and M05 installation assignments/job plans; it introduces no competing assignment master. M02/M05 minimal transaction-aware hooks and SQL known-interval checks reject conflicting work/leave/blocks/rest and inactive staffing. Their business lifecycle, evidence and approval ownership remains unchanged.

Legacy adoption is explicit: profile enforceScheduling defaults false. Missing calendar/profile/purpose policy or untimed work is UNKNOWN/NEEDS_REVIEW, never a positive recommendation. Configure actual mandatory skill policy, verified qualifications, effective calendars and resolve old commitments before enabling managed enforcement. Source known-interval conflicts still block in legacy mode. Installation job windows are conservative planning holds, not worked hours or per-technician attendance sessions.

Abisha: [exact 39-route API contract](../backend/docs/integration/M06_FRONTEND_API_CONTRACT.md) provides interfaces, role/privacy mappings, version semantics, conflicts, schedule examples and mock incompatibilities. Use existing User UUIDs, cookie/Origin/CSRF and source-owned assignment endpoints. No technician account creation, auto-assignment or role rewrite exists. Actual labor/utilization remains null. SALES availability requires its authorized survey context and is redacted; workforce private data is ADMIN/own only. Do not expose private medical/emergency/certificate details in a global technician list.

Documentation:
- [Technical ER/architecture/availability/concurrency design](../backend/docs/modules/M06_TECHNICIAN_TECHNICAL_DOCUMENTATION.md)
- [Code explanation and exact M02/M05 hooks](../backend/docs/modules/M06_TECHNICIAN_CODE_EXPLANATION.md)
- [45 evaluator Q&As](../backend/docs/evaluator/M06_EVALUATOR_QA.md)
- [Static verification and exact changed files](../backend/docs/M06_VERIFICATION.md)

Additive migration 20261031000600_m06_technician_management is NOT APPLIED. M02 already requires btree_gist; M06 uses it for exclusions. Service calendar/qualification checks complement SQL known-interval guards; do not bypass them through privileged edits. Custom SQL, DST/ICU behavior, policy races, locks/deadlocks/rollback/timeouts and real auth/API/frontend integration remain runtime-unverified. No migrations/reset, server, runtime/E2E test or sample record is executed by this work. Obtain separate approval for those actions. Review the draft PR before merging; no auto-merge or force push. Stop after M06.
