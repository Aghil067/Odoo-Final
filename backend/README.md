# Solar Installation Management — M01

Backend only: Express 5, TypeScript, PostgreSQL, Prisma 6 and Zod 4. Includes Foundation, M01 CRM, M02 site surveys and M03 solar configuration/BOM. Abisha's React frontend is at the repository root and remains independently managed. No M04–M10 backend implementation, seeds or demo records are included.

## Requirements and setup

Use Node.js 22.12+ (verified with Node 24.13), npm 11.6.2, and a PostgreSQL database (15+ recommended). Prisma CLI and Client are pinned to the same 6.19.3 release; do not upgrade only one. The lockfile is authoritative. `.npmrc` disables dependency lifecycle scripts; explicitly generate Prisma Client after installing.

1. `npm ci`
2. Copy `.env.example` to `.env`, configure a real `DATABASE_URL`, and set `APP_ORIGIN` to Abisha's exact frontend origin, without a trailing slash.
3. `npm run prisma:generate`
4. `npm run prisma:validate`
5. Review `prisma/migrations/20261031000100_m01_initial/migration.sql` before running `npm run db:deploy` against an **empty** database. This creates M01 tables, constraints and indexes; it does not drop existing tables. It requires permission to install the PostgreSQL `pg_trgm` extension. Do not apply to an unrelated existing schema without reviewing conflicts. No migration was applied during implementation.
6. Set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, and a unique `BOOTSTRAP_ADMIN_PASSWORD` of 12–256 characters in the local operator environment. Run `npm run bootstrap:admin` **once**. It refuses when any ADMIN already exists, including disabled admins. Concurrent bootstraps use serializable transactions. Remove those variables afterward. This is an explicit operator action, not a seed or startup side effect.
7. To provision actual team members, the trusted database operator sets `USER_EMAIL`, `USER_NAME`, `USER_PASSWORD` (12–256 characters), and `USER_ROLE` then runs `npm run user:create`. An active admin must already exist. Remove provisioning variables afterward. No public user-registration endpoint exists.
8. `npm run typecheck`, `npm run build`, then, when ready, `npm start` (or `npm run dev`).

Do not put passwords in command arguments, shell history, source control or screenshots. Supply temporary credentials through a protected local environment/secret manager. Both provisioning commands create real users, so neither was executed during implementation.

## Frontend connection

Read [the M01 API contract](docs/integration/M01_FRONTEND_API_CONTRACT.md). Every browser fetch uses `credentials: 'include'`. Login returns a CSRF token; send it as `X-CSRF-Token` on subsequent POST/PATCH requests. A page reload can recover it through `/api/auth/me`. All writes, **including login**, require the configured `Origin` and JSON content type. Cookies are HttpOnly; never read them from JavaScript or store session tokens in localStorage.

Local development: frontend `http://localhost:5173`, API `http://localhost:3000`. Use the same hostname on both sides. In production, use HTTPS and configure `NODE_ENV=production`; cookies become Secure with the `__Host-` prefix. Default SameSite is `lax`; unrelated frontend/API sites require `COOKIE_SAME_SITE=none`, HTTPS and browser support for third-party cookies. Prefer a same-site reverse proxy. Configure `TRUST_PROXY_HOPS` only for a known proxy topology; network access must prevent bypassing the trusted proxy.

## Documentation

- [Code explanation](docs/modules/M01_CRM_CODE_EXPLANATION.md): every source file, service, validator and data flow.
- [Technical documentation](docs/modules/M01_CRM_TECHNICAL_DOCUMENTATION.md): schema, ER diagram, permissions, transitions and operational limits.
- [Frontend API contract](docs/integration/M01_FRONTEND_API_CONTRACT.md): all endpoints, TypeScript types and JSON examples.
- [Evaluator questions](docs/evaluator/M01_EVALUATOR_QA.md): implementation-specific defense questions and answers.
- [Static verification record](docs/VERIFICATION.md): checks performed, migration status and unverified behavior.

`/api/health` is a process liveness endpoint; it deliberately does not prove database readiness. No server, bootstrap, user provisioning, seed, runtime test or database migration was executed as part of implementation.

## M02 site surveys

Run commands from `backend/`. Read the [M02 code explanation](docs/modules/M02_SITE_SURVEY_CODE_EXPLANATION.md), [technical documentation](docs/modules/M02_SITE_SURVEY_TECHNICAL_DOCUMENTATION.md), [frontend API contract](docs/integration/M02_FRONTEND_API_CONTRACT.md), [evaluator Q&A](docs/evaluator/M02_EVALUATOR_QA.md), and [verification/file inventory](docs/M02_VERIFICATION.md).

M02 reuses the existing sessions and roles: ADMIN coordinates/reviews, explicitly assigned TECHNICIAN users perform field work, and SALES requests/tracks surveys inside M01 scope. There is no new SURVEYOR role. Review `prisma/migrations/20261031000200_m02_site_survey/migration.sql`; it requires btree_gist. Both migrations must be present before deploying the new backend: M01 lead guards now depend on the new survey table. No migration has been applied by the implementation agent.

Private local evidence defaults to `~/.solar-installation/survey-uploads`, outside the repository. Optional `SURVEY_STORAGE_DIR` must also remain outside the frontend repository/public/build directories. The application creates it lazily at real upload/retrieval time; no sample files or folders are created during static verification. Configure private volume permissions/Windows ACLs, retention, scanning and backups before live use. Default file limit is 5 MiB, configurable up to 10 MiB. Upload/downloads are authenticated; no private root is mounted publicly.

Architecture/API indexes: [database design](docs/architecture/DATABASE_DESIGN.md), [API contracts](docs/architecture/API_CONTRACTS.md). Review the repository-level `docs/M02_BACKEND_HANDOFF.md` for the existing frontend's role/auth mismatch and integration steps. M03 consumes only the guarded approved-survey handoff after explicit authorization to implement that module.

## M03 solar configuration and BOM

M03 depends on M02 PR #2, which was open when this branch was created. Merge/review M02 first and retain migration order. `20261031000300_m03_solar_configuration` is generated but NOT applied. No default components/templates/configurations are seeded. Do not deploy M03 against a database missing either prerequisite migration.

Read [code explanation](docs/modules/M03_SOLAR_CONFIGURATION_CODE_EXPLANATION.md), [technical documentation](docs/modules/M03_SOLAR_CONFIGURATION_TECHNICAL_DOCUMENTATION.md), [frontend contract](docs/integration/M03_FRONTEND_API_CONTRACT.md), [evaluator Q&A](docs/evaluator/M03_EVALUATOR_QA.md) and [verification/dependency record](docs/M03_VERIFICATION.md). Run existing generate/validate/typecheck/build commands from backend/. This module adds no dependencies or environment secrets.

ADMIN manages catalog/templates and independently reviews designs; ADMIN or an assigned-survey TECHNICIAN may design. An author/editor cannot approve the same revision. M02 conditions are preserved, critical unknown compatibility blocks approval, and material costs use Decimal snapshots. The existing React configuration services still use mocks and incompatible category/status/unit/cost conventions; they require the documented adapter work, not a second frontend. M03 itself does not own stock quantities/reservations/serial movements; the M04 section below documents that separate backend module. Existing frontend screens remain unchanged.

## M04 inventory and warehouses

M01–M03 code is present in main at M04 baseline bcaae2a. M04 reuses SolarComponent and the transaction-aware approved configuration/BOM guard. Read [M04 API contract](docs/integration/M04_FRONTEND_API_CONTRACT.md), [technical design](docs/modules/M04_INVENTORY_TECHNICAL_DOCUMENTATION.md), [code explanation](docs/modules/M04_INVENTORY_CODE_EXPLANATION.md), [evaluator QA](docs/evaluator/M04_EVALUATOR_QA.md) and [verification](docs/M04_VERIFICATION.md).

Migration 20261031000400_m04_inventory_warehouse is additive and NOT APPLIED. Its ledger/serial guards are required for correct service operation. All stock quantities are Decimal strings; available = usable on-hand − reserved; returns enter separate quarantine. Only full single-warehouse BOM reservations/full dispatch are supported. Existing cookies/Origin/CSRF and roles are reused; no new dependency/env secret or automatic seed is introduced. No M05/M07 backend, stock valuation, purchasing or frontend changes are included.

## M05 installation management

M04 PR #4 is merged in the M05 main baseline 2a6a441. M05 consumes the exact approved M03/M04 dispatch handoff and adds execution, separate site receipt/readiness, milestones, equipment/serial trace, issues, private evidence, internal tests and independent commissioning. No frontend or later-module backend is implemented.

Read [API contract](docs/integration/M05_FRONTEND_API_CONTRACT.md), [technical design](docs/modules/M05_INSTALLATION_TECHNICAL_DOCUMENTATION.md), [code explanation](docs/modules/M05_INSTALLATION_CODE_EXPLANATION.md), [40 evaluator Q&As](docs/evaluator/M05_EVALUATOR_QA.md), [verification](docs/M05_VERIFICATION.md) and repository docs/M05_BACKEND_HANDOFF.md. Migration 20261031000500_m05_installation_management is NOT APPLIED. Private installation evidence uses the existing secure local adapter with separate optional INSTALLATION_STORAGE_DIR/INSTALLATION_MAX_FILE_BYTES (default5MiB); no new dependency or secret is introduced. Commissioning is internal completion, not external certification/grid authorization or warranty activation.

## M06 technician workforce management

M05 PR #5 merged before the M06 main baseline 03aa124. M06 extends existing TECHNICIAN User identities with workforce metadata and coordinates actual M02/M05 assignments; it does not create accounts, roles or another assignment master. Read [API contract](docs/integration/M06_FRONTEND_API_CONTRACT.md), [technical design](docs/modules/M06_TECHNICIAN_TECHNICAL_DOCUMENTATION.md), [code explanation](docs/modules/M06_TECHNICIAN_CODE_EXPLANATION.md), [45 evaluator Q&As](docs/evaluator/M06_EVALUATOR_QA.md), [verification](docs/M06_VERIFICATION.md) and docs/M06_BACKEND_HANDOFF.md.

Legacy monitor mode is explicit; managed staffing requires configured calendars/verified mandatory qualification policy and rejects uncertainty. Installation windows are conservative planning holds, not worked hours. Source ownership/approval/RBAC remains intact. Migration 20261031000600_m06_technician_management is additive and NOT APPLIED; no new dependency, credential, frontend change or later-module backend is introduced.

## M07 warranty management

M07 is stacked on unmerged M06 PR6, targeting codex/m06-technician-management until M06 merges. Explicit versioned manufacturer/workmanship/extended policies, evidence-backed activation, commissioned equipment/original serial identity, private documents, advisory claim assessment, separate provider/internal decisions and expiry candidates are implemented. No universal warranty duration or inferred delivery/start is seeded; no service/finance/notification side effect is performed.

Read [all51 API routes/types](docs/integration/M07_FRONTEND_API_CONTRACT.md), [technical ER/lifecycles](docs/modules/M07_WARRANTY_TECHNICAL_DOCUMENTATION.md), [code explanation](docs/modules/M07_WARRANTY_CODE_EXPLANATION.md), [58 evaluator Q&As](docs/evaluator/M07_EVALUATOR_QA.md), [verification/file inventory](docs/M07_VERIFICATION.md) and docs/M07_BACKEND_HANDOFF.md. Migration20261031000700_m07_warranty_management is additive and NOT APPLIED. Existing M01–M06 migrations/frontend/dependencies remain unchanged. WARRANTY_STORAGE_DIR defaults to private ~/.solar-installation/warranty-uploads, WARRANTY_MAX_FILE_BYTES defaults5MiB (maximum10MiB); no new secret. Custom SQL/concurrency/storage/API behavior remains runtime-unverified. Stop after M07.

## M08 service and maintenance

M08 is stacked on open M07 PR7 (which retains unmerged M06). It adds commissioned-system complaints, triage/escalation/safety, historical technician assignments, multiple actual visits, observed diagnosis revisions/repair outcomes, pending parts handoff, configured maintenance/SLA, staff-attested feedback and independent closure. M06 remains calendar/qualification authority; M07 scope/context remains separate; M04 has no service-spares fulfillment, so no stock usage/replacement is invented.

Read [all63 actual API routes/types](docs/integration/M08_FRONTEND_API_CONTRACT.md), [technical ER/lifecycles/design](docs/modules/M08_SERVICE_TECHNICAL_DOCUMENTATION.md), [code explanation](docs/modules/M08_SERVICE_CODE_EXPLANATION.md), [70 evaluator Q&As](docs/evaluator/M08_EVALUATOR_QA.md), [verification/exact26 files](docs/M08_VERIFICATION.md) and docs/M08_BACKEND_HANDOFF.md. Additive migration20261031000800_m08_service_management is NOT APPLIED; retain all prior migrations. Optional SERVICE_STORAGE_DIR defaults to private ~/.solar-installation/service-uploads and SERVICE_MAX_FILE_BYTES defaults5MiB/max10MiB; no new dependency/credential. SLA is explicit elapsed UTC, maintenance explicit intervalDays, no reminder/finance/analytics side effects. Frontend unchanged; PostgreSQL/concurrency/storage/API behavior remains runtime-unverified. Stop after M08.

## M09 finance and accounting

M01–M08 merged at M09 main baseline269ad2bae2bcd8654e431bcee07b80ab5c41fbd2. Operational pricing/quotes/acceptance/orders, invoices, verified manual receipts/allocations, credits/refunds, actual costs, nonparts service fees and scoped reports. No frontend/prior migration/dependency changes; M10 excluded. Read [API](docs/integration/M09_FRONTEND_API_CONTRACT.md), [code](docs/modules/M09_FINANCE_CODE_EXPLANATION.md), [design](docs/modules/M09_FINANCE_TECHNICAL_DOCUMENTATION.md), [QA](docs/evaluator/M09_EVALUATOR_QA.md), [verification](docs/M09_VERIFICATION.md) and [handoff](../docs/M09_BACKEND_HANDOFF.md). Migration009 NOT APPLIED. Optional FINANCE_STORAGE_DIR private outside repo/public/build; size5MiB default/max10MiB. No gateway/statutory/GST ledger/payroll/subsidy/bank reconciliation/sample transactions. Earlier module narratives describe historical implementation boundaries.
