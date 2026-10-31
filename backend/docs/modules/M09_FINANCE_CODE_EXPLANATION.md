# M09 finance code explanation

M09 adds operational finance to M01–M08, merged in main baseline269ad2bae2bcd8654e431bcee07b80ab5c41fbd2. No frontend or earlier migration changes. [API](../integration/M09_FRONTEND_API_CONTRACT.md), [technical design](M09_FINANCE_TECHNICAL_DOCUMENTATION.md), [verification](../M09_VERIFICATION.md).

## Source responsibilities

| File under src/modules/finance | Actual responsibility |
|---|---|
| money.ts | Prisma.Decimal clone precision48/HALF_UP, extension/discount/tax/header totals, bounded proportional credit split and final remainder |
| validation.ts | Strict Zod bodies/queries/UUID/version/enum/Decimal string bounds; no client actor fields |
| common.ts | Scoped loading, FINANCE grants/M01 SALES visibility, Serializable wrapper, customer lock, canonical idempotency hash, versioned writes and audit, safe evidence projection |
| source.ts | Exact currently CLOSED M08 executionRevision/latest closure-review assertion |
| pricing.service.ts | Immutable sequential price/tax publication, versioned deactivate, approved M02/M03 source, complete nonduplicate BOM pricing, authorized nonparts service pricing/ceiling, estimates/sensitivity |
| quotation.service.ts | Draft/revision/submission/frozen reviews, independent approval, observed send/customer acceptance proof, guarded terminal actions, accepted orders/optional exact installation link, SALES redaction |
| balances.ts | Active allocations minus releases, verified-only application, gross/net/tax credits, derived invoice state and refund liquidity; rejects inconsistent ledgers |
| receipts.service.ts | Full-order invoice copy/issue/draft due edits/independent void; manual receipt/proof/independent verification/allocation/release/reversal |
| adjustments.service.ts | Credit approval/issuance with excess release; authorized observed refund; actual expense recognition; closed-service fee request/approval |
| evidence.service.ts | Pre-buffer authorization/version check, permitted owner states/categories, private upload/hash/protected download, atomic owner history/version and rollback cleanup |
| access.service.ts | ADMIN customer FINANCE grant/reactivate/revoke with version and idempotency |
| read.service.ts | Scoped reads/history/config/access, batched balances, distinct billing/receipt/refund/cost summaries and explicit installation cost comparison |
| routes.ts |99 method/path routes under /api/finance, existing auth/CSRF/roles, strict validation, bounded raw media exception and upload limiter |

`app.ts` mounts finance before broad CRM and permits raw media only at finance evidence POST paths; session/Origin/CSRF remain enforced. `config/env.ts` adds private FINANCE_STORAGE_DIR and FINANCE_MAX_FILE_BYTES. `.env.example` contains placeholders, not credentials. Prisma adds19 models/10 enums with inverse source relations; SQL adds only M09 tables/indexes/guards.

## Actual workflow

1. ADMIN publishes real authorized price/tax revisions and customer FINANCE grants. No default catalog, grants or sample transactions are seeded.
2. Scoped SALES/FINANCE selects the exact eligible M03 design/BOM through its transaction-aware approvedConfigurationRecord guard. M02 current feasibility still applies. Every component is priced exactly once at approved quantity/unit. Purchase estimates never become automatic selling prices.
3. Server computes Decimal lines. Draft edits replace draft lines and advance parent version/history. Source/book identity changes require an explicit new revision. Submitted snapshots freeze. Independent reviewer checks source/prices/terms/evidence; sensitive pricing requires ADMIN.
4. Send/accept record observed manual events with evidence and attestation. Code sends no email and generates no customer signature. Accepted commercialKey uniqueness prevents incompatible accepted commitments.
5. Accepted quote becomes an immutable order snapshot. Optional installation link compares actual M05 project/design/review/BOM. Existing M05 jobs remain valid without a commercial order. Order is not payment, delivery or dispatch proof.
6. FINANCE creates one full invoice/order, copying accepted lines. Draft edit changes only due time/notes. Issuance freezes terms. Issued correction requires credit; void requires ADMIN independent of issuer with no historical allocation/credit.
7. Observed receipt starts RECORDED, receives proof, becomes PENDING_VERIFICATION, then separate verifier records VERIFIED/REJECTED. Only VERIFIED amounts can be allocated within payment available and invoice outstanding. Both entities advance version/audit under one command.
8. Allocation releases append corrections. Credit reduces obligation and frees only excess allocation into original payment unallocated funds. It sends no money. Independent refund approval reserves liquidity; separate observed transfer/proof completes refund. Independent ADMIN reversal preserves receipt and releases remaining allocations; refunds block incompatible reversal.
9. Actual expense requires observed incurred date, evidence and independent ADMIN approval. RECORDED recognizes operational net cost, not bank payment/payroll. Planned M06 assignments/M08 durations never generate cost.
10. Closed M08 execution cycle/latest closure review supports a separately approved nonparts charge. Service quote obeys allowed fee kinds/gross ceiling, then explicit customer acceptance. No parts billing because M04 lacks service consumption fulfillment. Warranty remains independent M07 authority.

## Implementation choices

Quotation revision is another FinanceQuotation row with seriesId/revision/previousId, not a redundant revision table. Order lines are an immutable accepted snapshot backed by real quotation-line references when invoiced. Shared FinanceHistory has exactly one owner FK plus matching kind/id/version, not an unaudited polymorphic pointer. Balances are derived, not mutable paid/outstanding columns.

Common post authorizes before replay, takes customer FOR UPDATE inside existing Serializable atomic utility, hashes canonical action/body and matches original actor/role/key. Role matching prevents cached private results leaking after a role change. Stale CAS/serialization errors return409 for deliberate client refresh. Office records use creator/ADMIN scope and version CAS. Multi-invoice IDs are sorted; command/report limits bound work. Default Prisma transaction timeout is unchanged; contention/performance is unmeasured.

Stored database Decimals are converted into precision48 clone before arithmetic. Tax snapshots preserve immutable rule identity/rate/basis/currency/name. Repeated partial-credit rounding is bounded by both remaining original net and tax; final full credit reconciles the exact remainder.

## SQL and storage review boundaries

Migration wraps BEGIN/COMMIT and adds restrictive FKs, exact-owner checks, money equations/ranges, immutable history/evidence/ledger rows, states/versions, exact source/line/totals checks, accepted uniqueness, independent qualified actors, catalog sealing, funds/refund/credit bounds and deferred evidence/ledger audit. It is source-reviewed, not executed. Schema validation does not execute these functions. Database administrators remain trusted.

Private storage uses M02 validator/adapter with separate root outside repo/public/build. Responses never expose storageKey/path. Known rollback discards only newly created receipt; uncertain commit outcome retains bytes and logs reconciliation requirement. Operators need private ACLs/backups/retention/scanning/orphan reconciliation. Signature/checksum is not malware scanning or proof authenticity.

Unsupported: full general ledger, GST/statutory certification, bank feeds/gateway, payroll/subsidies, automatic dispatch restriction, service parts consumption, FX, partial/milestone/replacement invoices, recorded-expense correction and M10. No existing source module state machine/history is rewritten. [Verification](../M09_VERIFICATION.md) states all unexecuted behavior.
