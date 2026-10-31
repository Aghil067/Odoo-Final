# M04 verification and exact file inventory

Date: 31 October 2026, Asia/Kolkata. Checkout: E:\Downloads\odoo-hackathon-24hrs\.publish\m04; branch codex/m04-inventory-warehouse.

## Repository and scope

Initial main bcaae2a merges M03 PR #3. M01 d48b434, M02 136e62b and M03 0c8ee52 are all verified ancestors. During work main advanced to b3c91f0, adding Abisha's M08 frontend (30 files, no backend). M04 fast-forwarded to include it unchanged before committing. Only M04 backend/docs are implemented. No later-module backend, auto-merge or force push. Existing worktrees remain intact.

## Executed static verification

| Check | Result |
|---|---|
| npm ci --ignore-scripts in backend | PASS: 128 packages; audit 0 known vulnerabilities; no dependency/lock changes. |
| npm run prisma:generate | PASS: Client 6.19.3 generated for 11 new models, 3 enums and original serial ID snapshots. |
| npm run prisma:validate | PASS: extended schema accepted. |
| npm run typecheck | PASS: strict backend TypeScript, no diagnostics/suppressions. |
| npm run build | PASS: production backend emits to ignored dist. |
| Offline schema-to-schema migration generation | PASS: local saved M03 schema compared with M04; no database queried. Custom guards/serial-array declarations reviewed separately. |
| Git/source/SQL review | PASS statically: frontend/root package files, backend dependencies and existing migrations unchanged. |
| Ignore/security hygiene | PASS: .env, dependencies, builds, SQLite and credential files ignored; filename-only private-key/token scan of new source/docs found no matches. |

Prisma used a process-local placeholder URL, not real credentials. Schema-engine network/launch restrictions were resolved through authorized execution. A generic helper typing issue was fixed without weakening compiler settings. Review added Decimal overflow rejection and immutable allocation serial ID snapshots so later returns cannot erase dispatch traceability.

## Execution boundaries

Migration `20261031000400_m04_inventory_warehouse/migration.sql` is additive and NOT APPLIED. SQL/PLpgSQL was reviewed as text; Prisma schema validation does not execute/syntax-check custom trigger bodies. Actual constraints/triggers, database role permissions, serial arithmetic, concurrency/deadlocks/idempotency races, rollback, timeout handling, cookie/CSRF and full API integration remain unverified at runtime.

No server, runtime/unit/integration/E2E test, database migration/reset/db push, seed or sample/business record was executed/created. Frontend files are preserved; frontend typecheck/build/runtime integration was not run or claimed. Backend static success is not a production/full-stack readiness claim.

## Review choices and limitations

Ledger-trigger updates prevent arbitrary direct balance quantity edits; reorder settings use a separate versioned command. Serializable existing transactions, row locks, expected versions, unique keys/references and exact approval/serial checks protect supported writes. Deferred SQL checks reconcile serial counts and active allocations. Conflicts return 409 and require refresh/retry; no automatic retry masks them.

Available = usable on-hand minus reserved. Quarantine is separate and unavailable. Full single-warehouse reservations/full dispatch only; no partial or replacement shipments for already-dispatched projects, even after returns. Same lead/site allocation cannot be duplicated across proposals. Stale reservations can be released/cancelled; dispatch requires current approval. Original receipt/serial/allocation history remains immutable. All referenced returns enter quarantine; only ADMIN separately releases after inspection/disposes.

No acquisition valuation, purchasing, lot/bin model, installation or warranty logic. SQL metrics group quantities by unit. Missing balances are zero for BOM availability but are not synthesized low-stock rows. Inputs retain 32 KiB JSON limit/100 serials per selection; large serial BOMs may exceed existing 5-second transaction timeout and require future explicit batching. No throughput guarantee is claimed. Existing React mocks need the documented adapter work.

Review/authorize migration application and separate database/API/security/concurrency verification before live use. Deployment/database privileges should prevent disabling triggers. M04 implementation does not imply deployment or migration approval.

## Exact modified files (7)

```text
backend/README.md
backend/docs/architecture/API_CONTRACTS.md
backend/docs/architecture/DATABASE_DESIGN.md
backend/prisma/schema.prisma
backend/src/app.ts
backend/src/modules/solar/review.service.ts
backend/src/modules/surveys/review.service.ts
```

## Exact created files (15)

```text
backend/docs/M04_VERIFICATION.md
backend/docs/evaluator/M04_EVALUATOR_QA.md
backend/docs/integration/M04_FRONTEND_API_CONTRACT.md
backend/docs/modules/M04_INVENTORY_CODE_EXPLANATION.md
backend/docs/modules/M04_INVENTORY_TECHNICAL_DOCUMENTATION.md
backend/prisma/migrations/20261031000400_m04_inventory_warehouse/migration.sql
backend/src/modules/inventory/availability.service.ts
backend/src/modules/inventory/common.ts
backend/src/modules/inventory/read.service.ts
backend/src/modules/inventory/reservation.service.ts
backend/src/modules/inventory/routes.ts
backend/src/modules/inventory/serial.service.ts
backend/src/modules/inventory/stock.service.ts
backend/src/modules/inventory/validation.ts
docs/M04_BACKEND_HANDOFF.md
```
