# M09 evaluator questions and answers

Actual implementation; static checks do not prove runtime correctness. [Verification](../M09_VERIFICATION.md).

## 1. What does M09 own?

Operational pricing, accepted commercial commitments, billing, verified manual receipts, corrections, actual costs and financial visibility.

## 2. Is this a statutory ledger?

No full general ledger, GST certification, tax filing or bank reconciliation is claimed.

## 3. Why not BOM cost as sale price?

M03 is an engineering/cost snapshot; explicit published selling entries define commercial price.

## 4. What is an eligible quote source?

Current approved M02/M03 design, exact approved configuration version/review and BOM identity/version checked transactionally.

## 5. Can two price entries quote one component twice?

No. API and deferred SQL require exactly once at exact approved quantity/unit.

## 6. Can frontend override prices/totals?

No. Select configured book/tax IDs and bounded quantities/discount; server calculates totals.

## 7. How are revisions stored?

Separate FinanceQuotation rows with seriesId/revision/previousId; no redundant revision table.

## 8. Can accepted quotes be edited?

No accepted financial terms can be silently revised or cancelled.

## 9. What proves customer acceptance?

Observed time/channel, attestation and exact quotation-owned CUSTOMER_ACCEPTANCE proof; no fabricated signature.

## 10. Does send email customers?

No. It records an observed communication supported by evidence.

## 11. Who reviews quotations?

Scoped independent FINANCE/ADMIN, excluding preparer and prior draft editors; sensitive pricing ADMIN only.

## 12. What is sensitive pricing?

Configured excessive discount/gross threshold, negative margin or incomplete comparable cost estimates.

## 13. What if no cost estimate exists?

Cost/margin are null and ADMIN review required; BOM cost is not substituted.

## 14. How are duplicate commitments blocked?

Unique accepted commercialKey plus unique order commercialKey/quotation and transaction guards.

## 15. Does order prove payment?

No. Accepted commercial commitment is separate from receipt/dispatch/delivery/installation.

## 16. Are old M05 jobs invalidated?

No M05 behavior changes; optional exact project/design/BOM order link supports future integration.

## 17. Are milestone invoices supported?

No. One full invoice/order from accepted lines; partial/milestone/replacement invoicing is outside scope.

## 18. What can draft invoice edit?

Future bounded due time and notes only; financial terms come from accepted quote.

## 19. Can issued amounts change?

No. Use independently approved explicit credit, never an arbitrary paid/balance patch.

## 20. Who voids issued invoices?

ADMIN different from issuer and only with no historical allocation or credit reference.

## 21. How is PAID computed?

Verified active allocations cover remaining positive obligation. Fully credited is CREDITED, not false payment.

## 22. Is overdue persisted?

No, derived from due time and positive outstanding with explicit asOf.

## 23. What is RECORDED payment?

Manual observed unverified record, not paid invoice or bank confirmation.

## 24. What verifies a receipt?

PAYMENT_PROOF, pending submission and independent human payer/amount/evidence checks.

## 25. Are card payments integrated?

No. CARD is recorded method only; redacted reference, no card credentials fields.

## 26. Can one payment cover many invoices?

Yes, max30/command and200 historical/payment or invoice, same customer/currency with current versions.

## 27. How is over-allocation prevented?

Decimal liquidity/outstanding checks, customer lock, Serializable transaction, versions and deferred SQL funds bounds.

## 28. Why append allocation releases?

Keep original application immutable; corrections include actor/reason/operation and both entity audits.

## 29. Does credit send money?

No. Reduces obligation and releases only excess allocation to original payment unallocated funds.

## 30. How does partial-credit tax round?

Proportional HALF_UP capped by both remaining original net/tax; final full credit consumes exact remainder.

## 31. What reserves refund funds?

Independent ADMIN approval; requested reserves nothing, approved/completed consume liquidity.

## 32. What proves refund completed?

Observed postapproval date, unique normalized transfer reference, attestation and REFUND_PROOF by someone other than requester.

## 33. Can refunded receipt reverse?

Requested/approved/completed refund blocks reversal, preserving transfer history.

## 34. What is actual expense?

Observed incurred net cost with payee/category/source/evidence and independent ADMIN approval before recognition.

## 35. Does RECORDED expense prove bank payment?

No. It recognizes operational actual cost; no bank execution/payroll.

## 36. Are planned workforce hours costed?

No. M06 plans and M08 visit duration do not prove actual labor costs.

## 37. What service source supports charging?

Exact CLOSED M08 execution cycle/latest closure review plus independent charge approval and customer acceptance.

## 38. Can pending spare requests be billed?

No. Existing M04 lacks verified service consumption; COMPONENT service pricing is blocked.

## 39. Does warranty determine charging?

No. M07 coverage and commercial approval remain independent human decisions.

## 40. How are currencies handled?

INR/USD/EUR/GBP each2dp, matched throughout source/lines/document; no FX or cross-currency sums.

## 41. How is tax rounded?

Decimal48 HALF_UP, extension2dp first, discount before tax, tax rounded per line, header sums rounded lines.

## 42. Why clone database Decimals?

Ensure48-digit arithmetic instead of inheriting default Decimal constructor precision.

## 43. How does FINANCE get scope?

Explicit ADMIN FinanceAccessGrant per customer; role alone is not global access.

## 44. Can SALES view margin?

No costs/margins/sensitive snapshots/order snapshot/audit reasons or details; commercial data stays scoped.

## 45. What can SUPPORT access?

Charge requests/status/proof only under active role-bound M08 installation service access.

## 46. How are retries safe?

Unique key/canonical action-body hash/actor/role/stored result, with current authorization before replay.

## 47. What happens to stale versions?

409. Refresh before deliberate retry; evidence also increments parent version.

## 48. Where are private files?

Separate configurable private finance root outside repo/public/build, opaque keys/protected checked downloads.

## 49. Do signatures scan malware?

No. Type/signature/checksum are integrity controls, not malware or authenticity certification.

## 50. What about upload rollback?

Known rollback discards newly created receipt; uncertain outcome retains bytes and logs reconciliation need.

## 51. What protects history ownership?

Real FKs, exact-one owner/kind/id/version, immutable snapshots and deferred audit/ledger guards.

## 52. Is profitability accounting profit?

No. Explicitly linked net billed less recorded cost; completeness NOT_ESTABLISHED, grossMargin null.

## 53. Were migrations/runtime tests run?

No. Only generation/schema validation/typecheck/build and source/SQL/Git review permitted.

## 54. What remains unverified?

SQL execution, migration, money edge cases, races, live auth/CSRF/uploads, performance and actual proof authenticity.

## 55. What follows M09?

Draft PR for human review. M10 requires separate authorization/implementation/PR and is excluded.
