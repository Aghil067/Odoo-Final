# M06 technician code explanation

M06 extends existing User without duplicating authentication or source assignments. The API contract lists all39 routes; technical documentation includes ER/architecture and scheduling flow.

| File | Actual responsibility |
|---|---|
| prisma/schema.prisma | Eleven M06 models/four enums with User FKs, profile/skill identities, verification records, effective calendar/shift/membership history, private leave and append-only audit. |
| prisma/migrations/20261031000600_m06_technician_management/migration.sql | Offline DDL plus range exclusions, actor/identity/version guards, cross-module User locking/interval checks, source triggers and immutable history. M02 btree_gist dependency retained. NOT APPLIED. |
| technicians/common.ts | Existing Serializable atomic boundary, ADMIN/own access, active existing-TECHNICIAN selection, profile version checks, User row lock, aggregate profile version bump and sanitized audit. No password/account creation. |
| technicians/validation.ts | Strict schemas/UUIDs/versioned commands, IANA timezone check, shift/leave/window bounds, qualification enums and explicit capacity settings. Positive interval bounds are also checked in the service when composed list schemas reuse fields. |
| technicians/calendar.ts | Half-open interval merge/subtract, local Intl parts, offset candidate resolution/DST round-trip checks, weekly coverage clipped by effective bounds and breaks. No implicit machine timezone. |
| technicians/availability.service.ts | commitments reads M02/M05 authoritative records; availabilityIn combines calendar/source/leave/block/capacity/qualification evidence; assertStaffing protects source writes; validateExisting rechecks upcoming commitments after workforce edits; installationPurposes derives real BOM skill needs. |
| technicians/profile.service.ts | ADMIN profile/catalog management, scoped declarations, ADMIN qualification verification, expiry/source evidence facts and version/audit checks. Sensitive profile/leave values are not copied into audit details. |
| technicians/team.service.ts | Versioned team/lead/member operations; membership closing preserves history. One current team/user, active eligible membership/lead; no M05 assignment deletion. |
| technicians/schedule.service.ts | Append/replace effective calendars, bounded weekly shifts, nonworking exceptions, private leave request/review/cancel and explicit committed-work conflict checks. No holiday feed or auto-reassignment. |
| technicians/read.service.ts | Private ADMIN/own collection reads, survey-scoped/redacted SALES availability, real source assignment references, database counts/workload/conflicts and deterministic recommendations within a page. Actual labor/utilization absent → null. |
| technicians/routes.ts | /api/technicians routes; static teams/leaves/availability paths precede user UUID paths. Existing cookie/Origin/CSRF/RBAC and response envelopes reused. |
| surveys/scheduling.service.ts | Three small additions: import coordinator, call in checkAppointment for scheduling/reassignment, call before starting visit. Original survey lifecycle/security/history unchanged. |
| surveys/read.service.ts | Existing availability retains fields, adds workforceStatus and requires a positive known workforce result for available; >7-day workforce check returns NEEDS_REVIEW. |
| installations/job.service.ts | Coordinator hooks before job creation, planned-window update and assignment changes, in the same existing transaction; original M05 job/equipment/commissioning ownership remains. |
| src/app.ts | Mount technicianRouter before broad CRM router. No auth rewrite, environment secret or dependency upgrade. |

Write trace: parse/authenticate/authorize → lock existing User/profile or versioned team/leave/catalog → validate real facts and source obligations → mutate workforce metadata/source-owned work inside one transaction → expected-version update and sanitized audit → DB checks commit or entire transaction rolls back. Source modules keep their own audit; M06 does not duplicate survey/job history.

Availability defaults to uncertainty when needed: missing profile/policy/effective schedule, ambiguous local boundary, untimed/overdue work or data bounds cannot establish a positive recommendation. Survey commits need full free shift coverage; coarse installation planning spans may have known off-shift gaps but hold the entire explicit planned range against other work. No per-technician actual installation sessions/clock-in, route service, worked-time calculation, optimizer or later module is implied.

SQL known-interval checks and profile deactivation guards complement application calendar/qualification checks. They are not a guarantee against privileged manual database edits or a runtime-verified scheduler. Existing timeout/Serializable conflicts/deadlocks require deliberate client refresh/retry. See M06_VERIFICATION.md for exact file inventory and unapplied migration/static limits.
