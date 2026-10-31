# M08 backend handoff

M08 manages real post-commissioning complaints, triage/escalation/safety, existing technician assignments and multiple visits, observed diagnosis revisions, explicit repair outcomes, pending parts handoffs, configured maintenance, elapsed-UTC SLA facts, customer response and independent closure. It stops after M08. No React or M09/M10 backend was implemented.

## Integration dependency

M08 branch codex/m08-service-management starts from M07 d7ac3e2b9ae39a68b9b76c4f8342f36bc4143a4f, retaining M06 fce98e7. Final fetch confirms [M06 PR6](https://github.com/Aghil067/Odoo-Final/pull/6) and [M07 PR7](https://github.com/Aghil067/Odoo-Final/pull/7) remain open/unmerged. The draft M08 PR targets codex/m07-warranty-management, not main. origin/main4160e51 includes Abisha's independent frontend work; preserve it during later integration.

Owner reviews/merges M06, then integrates/retargets M07 as its handoff describes. After M07 merges, fetch latest main, normally merge its latest commits into M08 if needed, resolve preserving all modules/frontend, repeat static checks and inspect the resulting file diff. Squash-merged dependencies require special diff review for duplicates. Retarget the existing M08 PR to main only when it contains M08 alone. No force-push or automatic merge.

## Review documents

- [All63 endpoints, types, examples, auth and frontend mapping](../backend/docs/integration/M08_FRONTEND_API_CONTRACT.md).
- [Technical ER, ticket/visit/maintenance lifecycles, scheduling/SLA/concurrency](../backend/docs/modules/M08_SERVICE_TECHNICAL_DOCUMENTATION.md).
- [Actual code explanation](../backend/docs/modules/M08_SERVICE_CODE_EXPLANATION.md).
- [70 evaluator questions and answers](../backend/docs/evaluator/M08_EVALUATOR_QA.md).
- [Exact26-file inventory, checks and runtime limitations](../backend/docs/M08_VERIFICATION.md).
- [Additive migration](../backend/prisma/migrations/20261031000800_m08_service_management/migration.sql), **NOT APPLIED**; review/run only with separate operator approval after all M01–M07 prerequisites.

## Cross-module boundaries and practical preparation

M05 commissioned source is mandatory; actual customer/site/equipment/original M04 serial identity is derived, not posted from mock copies. Another target needs another ticket. M06 remains workforce authority; configure SERVICE mandatory skill/certification policy and actual calendars before managed service commitments. Legacy planning remains explicit uncertainty and cannot serve safety-related cases. Technician acknowledgement is personal; team/profile membership grants no ticket scope. Shared source/User SQL hooks must be reviewed with M02/M05/M06 rather than deployed as an isolated table migration.

M07 scope remains separate: M08 uses actual-actor coverageIn, preserves captured context and uncertainty and links an existing same-project claim only with separate M07 case authority. It never guarantees coverage, approves/transitions a claim or proxies private warranty evidence.

M04 supports full installation BOM dispatch, not service-spares fulfillment/replacement. M08 records pending requests/explicit cancellation and limited warehouse visibility only. No parts used/returned/removed/replacement installation or stock ledger effect is fabricated. Physical fulfillment and serial trace for actual future replacements need a separately reviewed M04/M08 contract before enabling them.

Configure explicit SLA policies/maintenance intervals from actual obligations; no universal response/maintenance targets are seeded. SLA is continuous elapsed UTC from original opening; no business-hours or pause engine. First customer response/feedback are explicit observed attestations; resolution/closure are distinct, reopening preserves original clocks/history. Maintenance generation/completion are human commands; no scheduler, reminders, invoice or payment is created.

Frontend local task/ticket/resolution mocks need deliberate adapters for real UUIDs, uppercase enums, multiple visits/historical assignments, strict nullable fields, Decimal strings, actual role scope, cookie/CSRF, optimistic versions, idempotency, private binary files and server-controlled state. Remove mock assumptions that expired means chargeable, active means accepted, scheduled hours mean labor or replacement serial strings mean installed equipment. No frontend edits were made.

Private service evidence defaults ~/.solar-installation/service-uploads outside repository; optional SERVICE_STORAGE_DIR/SERVICE_MAX_FILE_BYTES (default5MiB/max10MiB) add no credential. Configure private ACLs/scanning/retention/backups/orphan reconciliation and business-history correction/export policy before live use; signatures/checksum do not scan malware.

Static Prisma generation/validation, strict backend typecheck/production build and SQL/Git scope checks passed. No DB migration/reset/seed, server, runtime tests, deployment or sample record/file was created. PostgreSQL function/trigger execution, cross-source concurrency/rollback/clock/calendar/qualification boundaries, storage security and real auth/API/frontend integration remain runtime-unverified. Full frontend source typecheck/build is not claimed. Draft review is not production readiness or final merge approval. Stop after M08.
