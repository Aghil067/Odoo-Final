# M05 installation code explanation

M05 uses twelve installation models without duplicating M01–M04 masters. Read the technical document for ER/state diagrams and the API contract for all 36 routes and exact types.

| File | Important functions and behavior |
|---|---|
| prisma/schema.prisma | Job owns explicit assignments, milestones, equipment/serial claims, issues, private evidence, immutable receipts/readiness/tests/reviews/history. Composite ownership relations and Decimal quantities preserve identity and quantities. |
| prisma/migrations/20261031000500_m05_installation_management/migration.sql | Offline-generated additive DDL plus lifecycle/quantity/identity/frozen-child/reviewer guards and deferred serial counts. New M05 guards prevent M04 returns/serial changes from orphaning installed equipment; no M04 history is changed. NOT APPLIED. |
| src/modules/installations/validation.ts | Strict request/query/path schemas, explicit enums, real test requirement basis, Decimal strings, bounded notes/arrays, versioned commands. Upload version is coerced only for URL query input. |
| common.ts | Central transition graph; installationAtomic reuses Serializable transactions; scope/requireJob enforce explicit assignment and M01 lead scopes; saveJob conditionally increments public version and appends actor/status/history; evidence and ownerUser enforce ownership/active assignment. exactHandoff reuses the M03 approval guard and verifies actual M04 header/line identities. |
| policy.ts | validateTestPlan requires every defined test and prevents disabling core checks; requiredMilestones derives battery/mounting applicability from BOM. verifiedEquipment reconciles current dispatch/serial/receipt quantities; ready, workComplete and commissioningReady progressively enforce safety, equipment, milestones and tests. snapshot excludes private attachment paths; publicJob omits original internal handoffSnapshot. |
| job.service.ts | createJob derives project identity, validates exact approval/dispatch and creates the real job plan/equipment serial claims. updateJob/assign preserve immutable business identity and constrain plan edits. transition implements start/hold/resume/completion/testing/rework/cancel with explicit gates; it never directly sets commissioning approval. |
| execution.service.ts | siteReadiness appends observed checklist evidence; confirmReceipt appends cumulative physical receipt, updates usable/damaged verification and opens missing/damaged issues. milestone records plan/check/result history; install grows cumulative verified quantity/serial set. reportIssue/resolveIssue preserve original issue facts and explicit resolution authority/history. |
| review.service.ts | recordTest appends actual observations/measurement/basis/current executionRevision. submitCommissioning gates and freezes a job. review requires a current independent ADMIN and immutable snapshot; commissioned produces the historical M07/M08 handoff without assuming warranty dates or grid authorization. |
| read.service.ts | Scoped paginated jobs/children/history and database-derived summary counts. FINANCE is commissioned-summary-only; warehouseEquipment exposes narrow dispatch/equipment references. Full review snapshots are ADMIN-only. |
| attachments.service.ts | Preflight before byte parsing, signature/MIME/name verification, existing private storage interface, digest metadata, transaction/version guard and receipt-scoped rollback cleanup. Unknown commit outcomes retain objects for reconciliation; download rechecks scope and digest and never exposes keys. |
| routes.ts | /api/installations JSON and raw binary endpoints, existing auth/Origin/CSRF/role layers, route ordering and file limits/rate limiter. Static summary route precedes UUID routes. |
| src/config/env.ts and .env.example | Separate safe private installation storage path/default5MiB limit. No new credential is introduced. |
| src/app.ts | Mounts the installation router before broad CRM routes; extends the existing narrow private-attachment binary exception to installation uploads. Existing JSON/cookie/security behavior is otherwise preserved. |

## Transaction trace

1. Parse/authenticate/authorize the request; require exact current job version and editable status.
2. Read real M03/M04 identity, evidence ownership and current assigned users/stock serial state as needed.
3. Write the action's child record/snapshot and update quantities/serial verification within the same transaction.
4. saveJob performs conditional updateMany(id,version), increments version, optionally increments executionRevision, and writes one append-only actor/from/to/event/reason/details history event.
5. SQL guards enforce scalar/identity/terminal invariants and deferred serialized counts at commit. A conflict rejects/rolls back the operation; no automatic retry loses the actor's intent.

ExecutionRevision is separate from API version: physical/readiness/issue/work edits stale earlier tests; a newly uploaded supporting object or assignment change only changes public version. Tests cite the content revision and precommand public version. Review references the exact submitted public version; approved job version is review.jobVersion+1.

No runtime tests, database operation, server or sample record is executed by static verification. SQL trigger execution, concurrency/rollback, evidence filesystem behavior and actual authorization/API integration still need separately authorized runtime verification. No compiler suppression, dependency upgrade, frontend edit, workforce scheduler, warranty/service/billing or later-module backend is introduced.
