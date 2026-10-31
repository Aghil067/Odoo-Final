# M05 backend handoff

M05 depends on M04. PR #4 is merged at 2a6a441daff417bc96d50323e9a710b88a71627f; M05 starts from latest origin/main, branch codex/m05-installation-management, and targets main. Checkout: E:\Downloads\odoo-hackathon-24hrs\.publish\m05. Existing frontend and M01–M04 commits/migrations are preserved; no M06–M10 backend is implemented.

M05 implements planned installation creation from the exact approved design/BOM and M04 posted dispatch, explicit technician authorization assignments, separate private-evidenced site receipt/readiness, milestones, cumulative installed equipment/serial trace, issues, internal tests and independent commissioning. Warehouse release is never interpreted as site delivery. Current quantity/serial/eligibility checks run again before start and approval. No stock, customer, catalog or survey clone is created.

Commissioned/canceled jobs freeze. A submitted commissioning version is frozen until independent ADMIN review; rework is explicit and invalidates older tests. Full usable receipt/full installed BOM is required; substitutions, replacements, unused spares, partial commissioning, removal and postcommission corrections are outside this version. Protective M05 SQL guards reject M04 returns that would orphan installed records, without changing historical M04 movements.

Abisha: [exact 36-route API contract](../backend/docs/integration/M05_FRONTEND_API_CONTRACT.md) contains interfaces/enums/examples/upload rules and mock-service mismatches. Existing frontend state names, product/material numbers, arbitrary issues/photo URLs/calendar/time tracking and sign-off flows are not backend authorization or commissioning. Use UUIDs, Decimal strings, current job version, cookie/Origin/CSRF and protected attachment IDs. No frontend file is edited here.

Future M07/M08 use GET /api/installations/:id/commissioned: immutable project/design/BOM/reservation/dispatch/review identity, installed quantities/serial IDs, latest tests, completion evidence/nonblocking notes, separate delivery/work/commissioning times. Warranty start is NOT_DETERMINED_BY_M05; grid authorization is NOT_RECORDED. No warranty, service ticket, billing or workforce scheduler is implemented.

Documents:
- [Technical architecture, ER/state diagrams and safety boundaries](../backend/docs/modules/M05_INSTALLATION_TECHNICAL_DOCUMENTATION.md)
- [Code explanation](../backend/docs/modules/M05_INSTALLATION_CODE_EXPLANATION.md)
- [Evaluator QA: 40 questions](../backend/docs/evaluator/M05_EVALUATOR_QA.md)
- [Static verification and exact file inventory](../backend/docs/M05_VERIFICATION.md)

Additive migration 20261031000500_m05_installation_management is NOT APPLIED. It requires M01–M04 migrations and its custom guards are part of service correctness. Private installation storage defaults to ~/.solar-installation/installation-uploads, outside repository/public/build, max5MiB by default; .env.example documents optional path/limit without secrets. No storage object is created by build/static checks.

Prisma validation/generation, backend typecheck/build and source/Git/SQL review are static only. No database migration/reset, server, runtime/E2E test or sample record was executed. SQL/PLpgSQL, concurrency/rollback, real file/permission/CSRF/API behavior and frontend integration remain unverified. Obtain separate explicit approval for runtime verification/migration application. Review the draft PR before merging; no auto-merge or force push. Stop after M05.
