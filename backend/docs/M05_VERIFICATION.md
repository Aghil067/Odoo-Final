# M05 verification and exact file inventory

Date: 31 October 2026, Asia/Kolkata. Checkout E:\Downloads\odoo-hackathon-24hrs\.publish\m05; branch codex/m05-installation-management.

## Dependency and scope

Fetched remote branches and inspected actual M01–M04 code, migrations, auth/CSRF/roles, Serializable helper, approved design/BOM, dispatch/serial models, frontend installation mock services and integration docs. M04 PR #4 was confirmed merged at 2a6a441daff417bc96d50323e9a710b88a71627f, which is the M05 main baseline. Final prepublication fetch found main unchanged. Therefore the M05 PR correctly targets main and contains no unmerged M04 changes.

Only M05 backend and documentation are added. Existing frontend/root package files, backend dependency files and M01–M04 migrations match main. Existing worktrees/user files remain intact. No force push, auto-merge, M06 scheduling or M07–M10 backend is implemented.

## Executed static checks

| Check | Result |
|---|---|
| Existing locked backend dependencies | Installed with scripts disabled; package/lock files unchanged. No upgrade/new dependency. |
| npm run prisma:generate | PASS: Prisma Client 6.19.3 generated for 12 installation models and 8 enums. |
| npm run prisma:validate | PASS: schema accepted, including composite ownership FKs. |
| npm run typecheck | PASS: strict backend TypeScript with no diagnostics/suppressions. |
| npm run build | PASS: production backend emits to ignored dist. |
| Offline schema-to-schema migration generation | PASS: saved M04 schema compared with M05, no live datasource queried. |
| SQL/source review | Completed statically; custom lifecycle, installed/serial and independent-review guards reviewed as text. |
| Git diff/scope/ignore checks | PASS: no whitespace errors; frontend/dependencies/previous migrations preserved; .env, builds, local DB and credentials ignored. |
| Private-key/token filename-only scan | No matches in new module and principal new docs. No environment secrets printed/staged. |

Prisma used a process-local placeholder PostgreSQL URL rather than credentials. Engine network/launch restrictions were resolved with authorized execution. An initially missing inverse Prisma relation was corrected; no compiler/validation suppression was added. Review corrected query-string upload version parsing, added explicit rework and stale-test invalidation after negative review, bounded record counts and protected installed records against later inventory returns.

## Migration and runtime limits

`backend/prisma/migrations/20261031000500_m05_installation_management/migration.sql` is additive, wrapped in BEGIN/COMMIT and NOT APPLIED. It creates only M05 tables/enums/indexes/FKs/guards plus M05 protective triggers on current inventory serial/dispatch-return updates; it rewrites no existing business rows or historical M04 ledger. Prior migration SQL files are unchanged.

Prisma parsing/generation does not execute or syntax-check PL/pgSQL bodies. Custom database constraints/triggers, lock ordering/races/deadlocks, rollback/timeouts, version/serial reconciliation, cookie/Origin/CSRF enforcement, private file integrity/cleanup and end-to-end installation workflow are runtime-unverified. No runtime/unit/integration/E2E test, migration/reset/db push, server, seed or sample/business record was executed/created. Frontend code is untouched; frontend typecheck/build/runtime wiring is not run or claimed.

## Review choices and practical boundaries

- Exact current approved configuration/BOM/reservation/dispatch is checked inside installation transactions. No customer/catalog/survey/inventory clone and no fabricated site delivery.
- Full usable site receipt/readiness and original serial verification precede execution. Full required milestones/equipment, current required PASS tests, no blocking/high/critical issues and completion evidence precede independent commissioning approval.
- Versioned writes append actor/from/to/reason/details history. Execution changes and explicit/review-required rework stale old tests. Evidence/assignment edits alone change public version without faking a new physical test revision.
- Commissioned/canceled jobs and child records freeze. There is no silent reopen, substitution/removal/replacement workflow, spare/unconsumed allocation, partial commissioning or cancellation after installation. One job per dispatch/reservation and one global installation claim per serial are retained for all time in this version.
- Independent ADMIN review requires no prior nonreview contribution; operational staffing must provide a separate reviewer. No sample operators are created.
- Measurements/requirements basis are supplied by authorized humans from actual design/manufacturer requirements. Backend validates recording/completeness, not electrical threshold correctness or certification. External grid permission is NOT_RECORDED; warranty start is NOT_DETERMINED_BY_M05.
- Private storage reuses M02's secure local pattern with separate safe directory, default5MiB/max10MiB,50 objects/job and upload rate limiting. Signatures are not malware scanning. Production scanning/ACL/retention/reconciliation/backups are operator responsibilities; no private directory/file is created by these checks.
- Bounded JSON/arrays and per-job receipt/readiness/issue/test limits apply. Existing 5-second Prisma transaction timeout remains; large shipments/snapshots may require future explicit batching and runtime verification.
- Existing React mocks use incompatible states/IDs/quantities/material issues/photo URLs and time/team/signoff assumptions. Deliberate adaptation remains necessary; passing backend build is not full-stack/production readiness.

Authorize/review migration application and runtime database/API/security/concurrency verification separately before live use. Final merge approval remains with the user.

## Exact modified files (7)

```text
backend/.env.example
backend/README.md
backend/docs/architecture/API_CONTRACTS.md
backend/docs/architecture/DATABASE_DESIGN.md
backend/prisma/schema.prisma
backend/src/app.ts
backend/src/config/env.ts
```

## Exact created files (16)

```text
backend/docs/M05_VERIFICATION.md
backend/docs/evaluator/M05_EVALUATOR_QA.md
backend/docs/integration/M05_FRONTEND_API_CONTRACT.md
backend/docs/modules/M05_INSTALLATION_CODE_EXPLANATION.md
backend/docs/modules/M05_INSTALLATION_TECHNICAL_DOCUMENTATION.md
backend/prisma/migrations/20261031000500_m05_installation_management/migration.sql
backend/src/modules/installations/attachments.service.ts
backend/src/modules/installations/common.ts
backend/src/modules/installations/execution.service.ts
backend/src/modules/installations/job.service.ts
backend/src/modules/installations/policy.ts
backend/src/modules/installations/read.service.ts
backend/src/modules/installations/review.service.ts
backend/src/modules/installations/routes.ts
backend/src/modules/installations/validation.ts
docs/M05_BACKEND_HANDOFF.md
```
