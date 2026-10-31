# M04 backend handoff

Branch: codex/m04-inventory-warehouse. Base: latest main inspected at bcaae2a, the merge of M03 PR #3. M01/M02/M03 implementation commits are all ancestors of main. Existing M05/M06/M07 frontend pages are preserved; no later-module backend is implemented. Original workspace and M01–M03 worktrees are left intact. M04 checkout: E:\Downloads\odoo-hackathon-24hrs\.publish\m04.

M04 implements real PostgreSQL-backed warehouse/stock/serial/fulfillment services under /api/inventory. SolarComponent remains the M03 catalog. Available = usable on-hand − reserved; separate quarantined returns are unavailable. All quantities are Decimal strings. No chart data, stock, warehouse, serial or business sample records have been seeded.

Full single-warehouse BOM reservations and full dispatch only. Transfers use unreserved stock. Receipts/commands are idempotent. Every stock change records an append-only movement; database triggers apply balances and defer count reconciliation until commit. SQL is additive and reviewed but NOT APPLIED. Review M01–M04 migrations in order; the backend depends on these custom guards and must not run against a partially migrated schema. Applying migrations is a separate explicitly approved action.

Abisha: read [the exact frontend API contract](../backend/docs/integration/M04_FRONTEND_API_CONTRACT.md). Existing mocks use product IDs, lowercase lifecycle states, floating-point quantities, draft receipt/issue flows and arbitrary manual issues. Keep UI adaptation deliberate: actual backend requires component UUIDs, approved configuration/review/BOM identity, exact Decimal strings, current versions, immutable operation references and session cookies/Origin/CSRF. No frontend file is changed by M04.

M03 approval logic is reused via an internal transaction-aware guard after M04 role/project scope checks. Existing M02/M03 HTTP permissions/results remain unchanged. Availability cannot use superseded/draft/rejected/ineligible approval. Release/cancel may clear stale reservations; dispatch requires current approval. No second authentication system or invented privileged principal is used.

M05 handoff: scoped GET /api/inventory/dispatches/:id supplies POSTED warehouse release, immutable dispatch/reference/date, reservation/configuration approval/BOM identity, customer/lead/site/survey references, component/unit/quantity and original serial IDs. This is not installation or delivery confirmation. M07 traceability: original serial IDs resolve to receipt identity/date and immutable paged serial-event history through authorized inventory reads. This is not warranty registration/activation.

Documentation:
- [Architecture, ER and lifecycle](../backend/docs/modules/M04_INVENTORY_TECHNICAL_DOCUMENTATION.md)
- [Code explanation](../backend/docs/modules/M04_INVENTORY_CODE_EXPLANATION.md)
- [Evaluator QA: 40 questions](../backend/docs/evaluator/M04_EVALUATOR_QA.md)
- [Verification, limits and exact changed files](../backend/docs/M04_VERIFICATION.md)

Prisma Client generation/schema validation, backend TypeScript typecheck and production build passed. No database migration, server, runtime/E2E test, seed/reset or sample record was executed. Custom PL/pgSQL execution, stock arithmetic against a real DB, concurrency/rollback, permissions/CSRF and end-to-end integration remain unverified. Frontend source/package/config files match main; frontend runtime integration/build is not claimed. Review the PR before merging; no auto-merge or force push is used. Stop after M04.

Before publication M04 fast-forwarded from bcaae2a to b3c91f0, incorporating the latest M08 frontend unchanged.
