# M09 backend handoff

Branch `codex/m09-finance-accounting`, base `main`. M01–M08 merged in baseline269ad2bae2bcd8654e431bcee07b80ab5c41fbd2. Preserve existing frontend finance/dashboard updates. M09 backend only; M10 excluded. Commit `feat(m09): implement finance and accounting backend`. Draft PR awaits human approval; no automatic merge.

## Delivered

Immutable price/tax revisions, exact approved BOM pricing, quotation revisions/independent approval/acceptance proof, accepted orders/optional installation binding, full-order invoices, verified manual receipts/partial allocations/releases, credits, authorized observed refunds, actual expenses, approved closed-service nonparts fees, scoped reports and private evidence/audit/idempotency.19 models/10 enums and99 method/path routes. No npm dependency or lockfile changes.

## Integration documents

- [Frontend contract: every route/body/response/enum and mock differences](../backend/docs/integration/M09_FRONTEND_API_CONTRACT.md)
- [Code/file responsibilities](../backend/docs/modules/M09_FINANCE_CODE_EXPLANATION.md)
- [ER/lifecycles/calculation/transaction/security design](../backend/docs/modules/M09_FINANCE_TECHNICAL_DOCUMENTATION.md)
- [55 evaluator answers](../backend/docs/evaluator/M09_EVALUATOR_QA.md)
- [Verification and exact file inventory](../backend/docs/M09_VERIFICATION.md)
- [Unapplied additive SQL](../backend/prisma/migrations/20261031000900_m09_finance_accounting/migration.sql)

## Abisha frontend integration

Replace mocks through an adapter. Money is Decimal string; use display formatting, not binary arithmetic. Existing cookies/trusted Origin/CSRF, real grants/source IDs, independent reviewers, command keys/current versions and private uploads are required. Evidence advances owner version. Invoice lists/details have balance wrappers and calculated effective states. Cannot directly set totals/mark paid, edit issued terms, assume receipt verified, use public receipt URLs or treat requested refunds as transfers. Payroll/technician-payment/subsidy mock screens have no M09 endpoint. No frontend files changed.

## Module boundaries

M02/M03 technical approval differs from customer acceptance. M04 inventory costs/dispatch do not prove sale price, actual cost, receipt or delivery. M05 creation/commissioning unchanged; optional order installation link/commercial authorization GET does not retroactively gate existing jobs. M06 schedules do not create labor expense. M07 warranty does not automatically determine price/free service. M08 exact CLOSED cycle/review may support independently approved nonparts charges; spare requests never become billable consumption. Source approvals/history untouched.

## Deployment boundary

Migration009 NOT APPLIED; prior migrations unchanged. No DB reset/seed/sample transaction/server/runtime/unit/E2E test. Static checks cannot prove SQL triggers, money edge cases/races/live security/files/load. All ordered migrations require separately authorized operator review/deployment. Existing secrets remain outside Git. Optional FINANCE_STORAGE_DIR must remain private outside repo/public/build; FINANCE_MAX_FILE_BYTES5MiB default/max10MiB. No sample files/storage directory created. ACLs/backups/retention/scanning/orphan reconciliation remain operator responsibilities. No statutory/GST ledger/bank reconciliation/gateway/payroll/subsidy/FX/partial-invoice claim.
