# M04 inventory code explanation

Only M04 backend is added. Existing frontend and later frontend modules are preserved. Start with the API contract for input/output shapes, then the technical document for formulas, ER diagram and lifecycle.

| File | Important implementation |
|---|---|
| prisma/schema.prisma | Eleven M04 tables, UUID/FK identities, Decimal(18,3) quantities, unique balances/serials/idempotency/references, allocation serial snapshots, lookup indexes and three enums. Reuses SolarComponent; no Product clone. |
| prisma/migrations/20261031000400_m04_inventory_warehouse/migration.sql | Offline generated additive DDL plus reviewed SQL quantity/state/immutability guards, ledger-driven balance updates, serialization-policy freeze and deferred reconciliation. NOT APPLIED. |
| src/modules/inventory/validation.ts | Strict Zod schemas for every write, UUID paths, decimal strings, whole-count service checks, bounded text/arrays/pagination, versioned commands. No posted available quantities or direct balance mutation. |
| src/modules/inventory/common.ts | operator/reader RBAC, inventoryAtomic error boundary, canonical request hashing, post idempotent write wrapper, component/warehouse validation, checkQuantity, zero initialization/row locking, Decimal calculations and move ledger snapshot construction. No direct quantity UPDATE. |
| src/modules/inventory/serial.service.ts | receiveSerials requires exact quantity/number count; selectSerials enforces component/warehouse/state/allocation membership; transitionSerials uses expected version/state and writes immutable audit events. |
| src/modules/inventory/stock.service.ts | Warehouse create/update and safe deactivation, receipt dates/notes, admin opening/adjustment/inspection/disposal, available-only atomic transfer, reorder thresholds. All writes use post and retain audit inputs/results. |
| src/modules/inventory/availability.service.ts | projectScope applies real M01/assigned-survey scope; approvedBom calls shared M03 guard inside the same transaction. availability calculates live per-BOM-line shortages and project fulfillment in one warehouse. |
| src/modules/inventory/reservation.service.ts | reserve freezes approval/BOM and full allocations; release/cancel clears active allocations even if approval is obsolete; dispatch rechecks eligibility and consumes full held stock; returns caps cumulative quantities and quarantines referenced dispatched serials/material. |
| src/modules/inventory/read.service.ts | Paged warehouse/balance/movement/serial/operation/project reads. Scoped reservation/dispatch detail omits approval snapshot costs. Dispatch resolves original immutable serial ID arrays even after current pointers change. SQL lowStock/summary use PostgreSQL values and unit-separated aggregates. |
| src/modules/inventory/routes.ts | /api/inventory endpoint inventory, role middleware, existing cookie/CSRF checks, strict supported query shapes, consistent success/list/error handling. No delete or generic status override route. |
| src/modules/surveys/review.service.ts | Extracts eligibleApprovedSurvey(tx,survey) from existing scoped approved-survey guard. Original wrapper still establishes M02 permissions. Eligibility logic and HTTP shape are preserved. |
| src/modules/solar/review.service.ts | Extracts approvedConfigurationRecord(tx,configuration). Original M03 HTTP wrapper still uses requireConfiguration; inventory supplies its own authorized project scope. No nested independent transaction or invented role principal. |
| src/app.ts | Mounts inventoryRouter before broad CRM router; existing Origin, cookies, JSON size limit and response middleware stay in effect. |

## Write flow

1. Route parses strict JSON/path and authenticates current active session/role/CSRF/Origin.
2. post checks operator/admin permission before querying idempotency.
3. Serializable transaction returns an identical same-actor replay or inserts an operation with empty result.
4. Service validates warehouse/catalog/approval/allocation identity and quantity.
5. It locks balances and builds typed movement snapshots. PostgreSQL movement insertion applies physical/reserved/quarantine deltas; direct quantity updates are rejected.
6. Serial changes and event records, allocation/dispatch/transfer records and cumulative returns are written within that same transaction.
7. Frozen JSON result finalizes the operation. Deferred SQL constraints reconcile counts at transaction end; any failure rolls back the entire operation.

Canonical hashing sorts object keys but preserves array order; replay the same parsed array ordering. Numeric quantities remain Decimal/string throughout arithmetic. Small Number conversions in input validation are bounded positivity checks, not stock arithmetic or money calculations. Summary count bigint is safely converted for pagination; numeric quantity aggregates remain Decimal strings.

## Review boundaries

M04 supplies defensive schema/service code, not evidence of runtime concurrency or trigger correctness. Static compilation/generation cannot execute PL/pgSQL, authentication, row locking, rollback or serial transitions. Do not bypass guards with ad hoc SQL stock edits. Use separately authorized database/API verification before deployment. No new dependency/compiler relaxation or M05/M07 backend is included.
