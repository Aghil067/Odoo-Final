# Solar Installation Management — M01

Backend only: Express 5, TypeScript, PostgreSQL, Prisma 6 and Zod 4. Abisha's React application lives separately. No M02–M10 implementation, frontend, seeds or demo records are included.

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
