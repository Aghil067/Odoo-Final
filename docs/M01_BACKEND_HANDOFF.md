# Foundation + M01 backend publication handoff

Historical M01 handoff: this document describes that publication. M02 now extends the merged backend on its own feature branch; see [M02 handoff](M02_BACKEND_HANDOFF.md). M00 frontend files remain unchanged, and the role/auth alignment work below is still required.

This feature branch preserves the existing M00 React frontend and its commit history. The completed Foundation + M01 backend is added as an independent Node.js project under `backend/`; the existing frontend remains at the repository root. No frontend or backend application functionality was changed during publication.

## Layout and preserved work

- Remote base inspected before publication: `main`, commit `f274563771a046747cffe19da126a78a1cc44e12` (`feat(auth): add M00 authentication and role-based access foundation`).
- Feature branch: `codex/m01-customer-crm`, based directly on that existing commit.
- Existing frontend files, root package files, configuration and M00 documentation are preserved. Only root `.gitignore` is extended to protect environment files, credentials, private keys, dependency/build directories and local databases. Migration SQL and `.env.example` are intentionally included.
- Backend package/configuration, source, Prisma schema/migration and M01 documentation are copied to `backend/`. Its relative commands and imports still work when run from that directory.
- The original local backend workspace remains in place. Publication uses a separate checkout at `E:\Downloads\odoo-hackathon-24hrs\.publish\m01`; this directory is excluded locally and is not part of the committed tree.

The copied backend documentation's original workspace paths describe its implementation-time location. In this combined repository, resolve backend-relative source/document paths from `backend/`, and run backend commands there. `backend/docs/VERIFICATION.md` is the implementation-time static verification record; its statements about no Git publication describe that earlier phase, not this publication handoff.

## Backend documentation

- [Setup](../backend/README.md)
- [Source explanation](../backend/docs/modules/M01_CRM_CODE_EXPLANATION.md)
- [Architecture, schema and business rules](../backend/docs/modules/M01_CRM_TECHNICAL_DOCUMENTATION.md)
- [Exact API contract for Abisha](../backend/docs/integration/M01_FRONTEND_API_CONTRACT.md)
- [Evaluator questions](../backend/docs/evaluator/M01_EVALUATOR_QA.md)
- [Implementation checks and complete backend file tree](../backend/docs/VERIFICATION.md)

## Integration steps after review

1. Review/merge this feature branch into `main` through a pull request. It is a descendant of the existing frontend commit; no unrelated-history merge or force push is needed. If main advances, merge the latest main into this branch normally and resolve any conflicts before merging.
2. Keep frontend dependency installation/build at the repository root. Backend installation/build is separate: change directory to `backend`, then follow its README. No root npm workspace conversion is included in this publication.
3. Configure the backend environment and real PostgreSQL separately. Review the migration and bootstrap instructions before explicitly executing either. No migration, user provisioning, server, seed or test-data creation was performed for publication.
4. Abisha should adapt the existing `src/features/auth/services/authService.ts` interface and AuthContext to the actual backend contract. Backend responses wrap payloads in `{data: ...}`; login and `/me` return a CSRF token; cookies are HttpOnly and Axios already enables `withCredentials`. Send `X-CSRF-Token` on authenticated writes, trusted Origin on every write, and `{}` for logout. Do not send the provisional `rememberMe` field; the strict backend login accepts only email/password. There is no `/auth/refresh` endpoint; use `/auth/me` and handle expired sessions as 401.
5. Reconcile roles explicitly: the existing frontend uses eight lowercase roles (`admin`, `sales_executive`, `surveyor`, `inventory_manager`, `installation_manager`, `technician`, `finance_officer`, `service_manager`), while the implemented backend uses six uppercase roles (`ADMIN`, `SALES`, `TECHNICIAN`, `WAREHOUSE`, `SUPPORT`, `FINANCE`). The contracts are not interchangeable. Agree a frontend type/permission adapter or later deliberate role-model change; do not infer privileged mappings or bypass backend access checks. These mismatches are reported, not changed during publication.
6. Connect future customer/CRM pages to the M01 API contract, using current record versions for edits, decimal strings for money/capacity, real saved activities and the summary endpoint. Coordinate frontend/backend origins, HTTPS and SameSite cookie settings before testing.
7. Obtain permission for database/runtime integration verification. The previous Prisma validation, client generation, TypeScript check and backend build passed; no runtime behavior or frontend/backend integration has been verified.

No M02 work is included or authorized by this publication.
