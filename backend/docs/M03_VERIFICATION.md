# M03 implementation, verification and exact file inventory

Date: 31 October 2026 (Asia/Kolkata). Working checkout: `E:\Downloads\odoo-hackathon-24hrs\.publish\m03`; branch `codex/m03-solar-configuration`.

## Scope and ancestry

M02 PR #2 was open/unmerged at inspection. M03 starts from its latest remote head `136e62b43a757b9ad898fccc32ea67307124dfd4`. Latest main `872846732abce1723e6474e156f469708e9e2836` contains Abisha's newer M03/M04 frontend. It was incorporated unchanged in base merge `a481110015568ccc932d547b8f9fb5e787dc261d` before backend edits. **M03 depends on M02 and must not merge into main first.** No M04 backend work is included. Existing frontend code and earlier migrations are preserved.

The request file ends mid-sentence in section 10; an optional request for the remaining text was sent while implementing the clear supplied scope. No unseen requirements or external publication permission are assumed. The supplied calculations are implemented, including target/recommended/requested capacity differences, nominal battery energy, DC/AC sizing, total/category material costs and compatibility findings. No push/PR is performed by this local implementation.

## Executed static verification

| Check | Result |
|---|---|
| Existing locked backend install, `npm ci --ignore-scripts` | PASS; 128 packages installed; zero known vulnerabilities reported; no dependency/lockfile changes. |
| `npm run prisma:generate` | PASS; Client 6.19.3 generated for the extended schema. |
| `npm run prisma:validate` | PASS; nine M03 models, five new enums, inverse relations and composite approval references accepted. |
| `npm run typecheck` | PASS; strict TypeScript, no diagnostics. |
| `npm run build` | PASS; backend production JavaScript emits to ignored dist/. |
| Offline Prisma schema-to-schema migration diff | PASS; original M02 schema copied to a temporary file outside the repository, then compared to M03. No database datasource was queried. |
| Source/migration/document review and diff checks | Completed statically; no test runner/server or application endpoints executed. |

A Node UUID return-type inference error was corrected by explicitly typing the revision-series ID as string; no type suppressions or weakened compiler settings were used. Later review added per-physical-unit sizing and manufacturer PV-power limits, full declared battery operating/charge voltage envelope checks, minimum-voltage discharge estimates, null unknown capacities, server header/line consistency checks, and consistent recalculated review snapshots. Prisma validation, TypeScript typecheck and backend production build passed again after the final changes. Catalog/quantity bounds prevent impractical overflow; costs use 48-digit Decimal and explicit SQL precision checks. Public template-version paths are bounded to PostgreSQL Int range.

Prisma parsing/generation used a process-local placeholder PostgreSQL URL, not real credentials. Commands above generate/check code/schema only. Full custom SQL/PLpgSQL is not executed or validated by Prisma schema validation. No .env file, sample product/template, fake manufacturer facts, survey/customer record or real configuration was inserted.

## Migration and runtime status

`backend/prisma/migrations/20261031000300_m03_solar_configuration/migration.sql` is generated and **NOT APPLIED**. It creates M03 tables/enums/indexes/FKs and two supporting unique composite survey/review keys, with custom checks/guards. It is wrapped in BEGIN/COMMIT and contains no top-level business-data INSERT/UPDATE/DELETE, DROP or TRUNCATE. M01 and M02 migration files are unchanged.

Custom SQL enforces scalar amounts/quantities/currencies, immutable catalog identity/version, configuration identity/revision graph/current survey prerequisites, approved configuration/BOM immutability, draft-only BOM lines and append-only snapshots/reviews/history with independent review. It intentionally permits version-1 derived-field initialization before the first event in the atomic creation transaction. These guards and actual PostgreSQL permissions/error behavior remain unverified until separate approved execution.

No server, browser automation, runtime/unit/integration/E2E tests, migration application/reset/db push, seeds, existing-business-record changes or M04 inventory actions were run. Physical/financial calculations were reviewed as code; passing typecheck/build is not a claim of tested runtime arithmetic, concurrency, independent review, rollback or frontend integration.

## Known boundaries and remaining checks

- Supported costs are single-currency INR/USD/EUR/GBP with four-decimal unit prices/two-decimal material totals; no FX, tax/labor, quotation or pricing forecast.
- One homogeneous battery bank and one homogeneous panel allocation per device-unit/MPPT are supported. Mixed banks, custom charge limits, detailed load/thermal/structural/protection/cable/regulatory design need future explicitly scoped engineering work. There are no hidden automatic engineering tolerances or manufactured catalog values.
- Missing critical specifications/source or stale/inactive parts block submission/approval. Unknown nominal power/ratio/energy is null with findings, not a fabricated zero. Conditions are not certified as resolved merely by review.
- Existing React services still use mocks and incompatible category/status/unit/cost/auth conventions. Source is preserved; no API wiring/redesign is included.
- Approve M02 first, review/apply migrations only when explicitly authorized, provision real operators/data and approve runtime database/security/concurrency/calculation/API verification before live use.

## Exact modified files (7)

```text
backend/README.md
backend/docs/architecture/API_CONTRACTS.md
backend/docs/architecture/DATABASE_DESIGN.md
backend/docs/modules/M02_SITE_SURVEY_TECHNICAL_DOCUMENTATION.md
backend/prisma/schema.prisma
backend/src/app.ts
backend/src/modules/surveys/review.service.ts
```

## Exact created files (15)

```text
backend/docs/M03_VERIFICATION.md
backend/docs/evaluator/M03_EVALUATOR_QA.md
backend/docs/integration/M03_FRONTEND_API_CONTRACT.md
backend/docs/modules/M03_SOLAR_CONFIGURATION_CODE_EXPLANATION.md
backend/docs/modules/M03_SOLAR_CONFIGURATION_TECHNICAL_DOCUMENTATION.md
backend/prisma/migrations/20261031000300_m03_solar_configuration/migration.sql
backend/src/modules/solar/bom.service.ts
backend/src/modules/solar/calculations.ts
backend/src/modules/solar/catalog.service.ts
backend/src/modules/solar/common.ts
backend/src/modules/solar/configuration.service.ts
backend/src/modules/solar/review.service.ts
backend/src/modules/solar/routes.ts
backend/src/modules/solar/validation.ts
docs/M03_BACKEND_HANDOFF.md
```
