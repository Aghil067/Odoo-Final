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

ADMIN manages catalog/templates and independently reviews designs; ADMIN or an assigned-survey TECHNICIAN may design. An author/editor cannot approve the same revision. M02 conditions are preserved, critical unknown compatibility blocks approval, and material costs use Decimal snapshots. The existing React configuration services still use mocks and incompatible category/status/unit/cost conventions; they require the documented adapter work, not a second frontend. Existing M04 frontend screens are unchanged; no stock quantities/reservations/serial movements are implemented in the backend.
