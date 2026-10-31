# M07 backend handoff

M07 implements explicit manufacturer product/performance, installer workmanship and extended warranty terms, exact commissioned-item registration, evidence-backed start/expiry, private documents, explainable claim assessment, separate provider/internal decisions and database-backed expiry monitoring. It stops after M07; Abisha's frontend is unchanged.

## Dependency and integration

Branch `codex/m07-warranty-management` starts from M06 head `fce98e7091dbd2ef0d8b6ff79d63794b6df0cebc`. Final prepublication fetch confirms M06 [PR6](https://github.com/Aghil067/Odoo-Final/pull/6) remains open/draft and origin/main at `03aa1244262fabfad14f290c788421b7f078558f`. M07 draft PR therefore targets `codex/m06-technician-management`; it must not target main while that would include unmerged M06 changes. Preserve M06 and all frontend commits.

Review/merge M06 first by owner approval. After it merges, fetch current main, incorporate it into the M07 feature branch with a normal merge if necessary, resolve while preserving both modules/frontend, repeat static checks and inspect the diff against main. If M06 was squash-merged, check the resulting file diff carefully for duplicate changes. Retarget the existing M07 PR to main only once its diff contains M07 alone. No force-push or automatic merge is authorized by this workflow.

## Review artifacts

- [Exact frontend endpoints, wire types and examples](../backend/docs/integration/M07_FRONTEND_API_CONTRACT.md).
- [Technical ER/lifecycle/concurrency/authorization design](../backend/docs/modules/M07_WARRANTY_TECHNICAL_DOCUMENTATION.md).
- [Actual code walkthrough](../backend/docs/modules/M07_WARRANTY_CODE_EXPLANATION.md).
- [58 evaluator questions/answers](../backend/docs/evaluator/M07_EVALUATOR_QA.md).
- [Verification, runtime limits and exact file inventory](../backend/docs/M07_VERIFICATION.md).
- [Additive migration](../backend/prisma/migrations/20261031000700_m07_warranty_management/migration.sql), NOT APPLIED. Retain M01–M06 migrations byte-for-byte and review/run in order only with operator approval.

## Frontend and operator preparation

Use real session cookie/Origin/CSRF, uppercase backend roles, UUIDs, Decimal strings, server state/version/idempotency and actual policy terms. ADMIN configures terms and case grants, independent ADMIN approves, assigned SUPPORT investigates. SALES/TECHNICIAN get scoped summaries; FINANCE receives approved outcome references. Do not map provisional frontend roles into global document access.

Policies require explicit durations, provider obligations, dates/evidence and declared UTC calendar semantics. M04 dispatch, M05 receipt and M05 commissioning are separate facts; no automatic legal start is inferred. Provider acceptance is a recorded fact with evidence, distinct from advisory eligibility and internal final approval. Warranty registration has no external communication integration. Review actual provider/jurisdiction wording before live configuration; no universal promises are seeded.

M05 helper extraction exposes the same transaction-aware commissioned data to M07 after M07-specific scope checks; M04 dispatch/serial identities and M05 records remain read-only. Nonserialized coverage is full installed line; workmanship is project coverage. Read-only installation/serial coverage provides future M08 customer/site/project/equipment/original serial, frozen terms/dates and limited history with truncation signal. No ticket, repair visit, reimbursement, shipment or notification is created.

Private storage defaults outside repository under ~/.solar-installation/warranty-uploads; optional WARRANTY_STORAGE_DIR and WARRANTY_MAX_FILE_BYTES use no new credential. Configure approved private storage/ACLs, scanning, retention/backups and orphan reconciliation before uploads. Signatures/checksum do not provide malware protection.

Passed generation/schema validation/typecheck/build and static SQL/Git review. No DB applied/reset/seed, server, runtime/unit/E2E test, frontend build or real business record was executed. PostgreSQL custom function syntax/execution, anniversary parity, races/locks/rollback, permissions/CSRF, filesystem behavior and API/frontend integration remain runtime-unverified. Draft review is not a production-readiness claim. No M08+ backend is implemented.
