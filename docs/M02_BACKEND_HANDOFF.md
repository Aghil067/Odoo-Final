# M02 backend integration handoff

Feature branch `codex/m02-site-survey` starts from fetched `main` at `aec261f` (the merged M01 implementation). Source changes are limited to `backend/` and documentation. The React frontend, root package files and M00 application code are preserved. Working checkout: `E:\Downloads\odoo-hackathon-24hrs\.publish\m02`.

## Review and setup

1. Review the branch/compare link before merging; no automatic merge or force push is performed.
2. From backend/, use the existing locked dependency install and explicit Prisma generation. Configure the environment as documented in backend/README.md. No new dependency or authentication system is introduced.
3. Operator must review and approve the additive M02 migration before applying it; btree_gist must be available. Do not deploy M02 code against a database missing this migration: the M01 integration guards now reference SiteSurvey. No migration, server, real user creation or sample-record insertion was executed here.
4. Provision real TECHNICIAN users through the existing trusted-operator mechanism when authorized. ADMIN explicitly assigns each survey. ADMIN coordinates/reviews; assigned technicians write findings; SALES requests initial surveys in CRM scope. Do not translate the frontend's `surveyor` string into backend permissions automatically.
5. Configure private evidence storage outside the frontend repository (default operating-user home `.solar-installation/survey-uploads`), protected ACLs/durable volume/backups. No public static route is added. Follow upload size/type/category and CSRF rules exactly.

## Abisha's frontend integration

The [exact M02 contract](../backend/docs/integration/M02_FRONTEND_API_CONTRACT.md) supplies TypeScript types, endpoint matrix, JSON examples, pagination, transitions, scheduling/availability and raw-file upload instructions. The [M01 contract](../backend/docs/integration/M01_FRONTEND_API_CONTRACT.md) remains authoritative for authentication and commercial customer/site/lead data.

The root frontend still has eight lowercase roles and provisional auth envelopes. Backend has six uppercase roles, `{data:...}` wrappers, HttpOnly cookies and per-session CSRF, not a JSON bearer/refresh-token API. Align these deliberately in future frontend work. This branch changes no frontend functionality. Do not forward provisional rememberMe, infer ADMIN/TECHNICIAN privileges from names, call a nonexistent refresh endpoint or use mock users as evidence of backend access.

UI should obtain eligible SURVEY_REQUESTED leads from M01; render visit-needed address/contact information from assigned survey details; show only permitted state actions; preserve and send current survey version on every mutation; refresh on 409; upload each raw file sequentially using the newly returned version; paginate history/reviews/attachments; and display conditional/internal approval without claiming structural/utility certification.

## M03 boundary

No M03 models, quotations, BOMs or component configuration are implemented. A later approved M03 implementation must use `/api/surveys/:id/approved`, retain surveyId/approvedVersion/reviewId, and respect recommendation conditions/assumptions. The guard rejects unapproved, superseded, archived-customer or ineligible-lead records. An old immutable audit snapshot is not approval for a new assessment.

## Latest main incorporated for PR review

The M02 branch now includes main's frontend commit `23c4cd2` through conflict-free merge `4ce1b37`. Its frontend source/configuration is preserved exactly; the M02 PR adds no changes to those files. That frontend commit provides M01 CRM and M02 survey screens but uses in-memory mock services, not the real PostgreSQL-backed backend yet.

Before enabling real API integration, reconcile these concrete differences deliberately:

| Existing frontend | Implemented backend |
|---|---|
| `draft`, separate `assigned`, `reinspection_required`, `cancelled` and other lowercase statuses | Exact uppercase state graph beginning REQUESTED; assignment is a versioned event, not a distinct lifecycle state; revisions use REVISION_REQUIRED and cancellation uses CANCELED. |
| Square-foot roof measurements, orientation text/slope categories, numeric capacity | Square-metre decimal strings, measured azimuth/tilt in degrees and decimal-string capacity. Convert units explicitly; do not invent engineering measurements or infer a roof certification boolean. |
| Eight lowercase frontend roles, including `surveyor` | Six uppercase backend roles; ADMIN explicitly assigns existing TECHNICIAN users. No string rename grants authorization. |
| Local mock identifiers, stores and photo presentation | Real API UUIDs, scoped/paginated data, latest survey versions, private raw-file upload and authenticated download endpoints. |
| Provisional auth envelopes | Actual `{data:...}` responses, HttpOnly cookie, trusted Origin and X-CSRF-Token; no refresh-token endpoint. |

This merge/review does not connect or rewrite the frontend, apply a database migration or implement M03. Both projects pass their production builds; full-stack/runtime validation remains pending explicit authorization.

See [technical documentation](../backend/docs/modules/M02_SITE_SURVEY_TECHNICAL_DOCUMENTATION.md), [code walkthrough](../backend/docs/modules/M02_SITE_SURVEY_CODE_EXPLANATION.md), [evaluator Q&A](../backend/docs/evaluator/M02_EVALUATOR_QA.md), and [verification/file inventory](../backend/docs/M02_VERIFICATION.md). Runtime behavior, migration execution, concurrency, cookies/CSRF and file handling still require explicitly authorized testing. Stop after M02.
