# M04 evaluator questions and answers

1. **What does M04 implement?** Warehouse setup, usable/quarantined stock, an immutable movement ledger, receiving, serial tracking, approved-BOM availability, full reservations/dispatch, atomic transfers, referenced returns, controlled inspection/adjustments and low-stock reads.
2. **What is on-hand stock?** Usable physically present stock, including quantities held for active project reservations.
3. **What is reserved stock?** The portion of on-hand assigned to active reservations; it is not a physical stock exit.
4. **How is available stock calculated?** On-hand minus reserved, always on the server. The client cannot submit authoritative availability.
5. **Where are returned items counted?** In separate quarantinedQuantity. They are physically present but excluded from usable on-hand and available stock until inspection release.
6. **Why use an append-only movement ledger?** It records actor/reference/reason, type, quantity, timestamp and before/after balances so history survives corrections. Corrections post compensating events rather than overwriting facts.
7. **Can an API directly edit stock balance quantities?** No. Only the stock movement trigger changes physical/reserved/quarantine quantities. Reorder policy has a separate versioned command.
8. **How is overselling prevented?** Serializable transactions, balance row locks, exact available-stock checks, database nonnegative/reserved<=on-hand constraints and atomic serial allocation reject conflicting stock commitments.
9. **What happens during simultaneous reservations?** One may succeed; the competing request may receive 409 and must refresh/retry. No automatic retry hides the conflict. Actual race behavior is still unverified at runtime.
10. **Why use database transactions?** Header/lines, ledger/balances, serial state/history and idempotent result must all succeed or all roll back.
11. **Why use Decimal?** Fractional materials such as cable lengths need exact decimal arithmetic; JavaScript binary floating-point quantities could drift.
12. **Are fractional equipment counts allowed?** PCS/SET/PAIR and serialized units require whole positive counts; M/KG can use three decimal places. Serialized equipment uses PCS.
13. **Does M04 define another product catalog?** No. SolarComponent from M03 remains the master component/technical catalog.
14. **How does an approved BOM drive allocation?** The shared M03 guard supplies immutable BOM component IDs and exact quantities plus configuration/review/version identity. M04 derives every reservation line from that handoff.
15. **Can a draft or superseded BOM reserve stock?** No. Current approved configuration and survey eligibility are checked inside the reservation transaction, and again before dispatch.
16. **What happens when stock is insufficient?** Full reservation fails atomically with no partial allocation or orphan serial reservation. Availability separately reports per-line shortages.
17. **Are partial reservations supported?** No. One warehouse must fulfill every approved BOM line. Cross-warehouse splitting is outside this version.
18. **Can one project receive duplicate reservations?** The service rejects active/dispatched allocations for the same lead/site across configurations. A partial unique index also protects the exact configuration. Released/cancelled reservations may be replaced.
19. **How are serial numbers normalized?** Trimmed and uppercased, globally unique for all time, with immutable component/receipt identity. Retired serial numbers cannot be received again as new equipment.
20. **Can a receipt omit required serials?** No. Serialized receipt count must equal distinct supplied serial entries; nonserialized components cannot supply serials.
21. **Can one serial be reserved for two projects?** Expected state/version/component/warehouse/allocation checks and database reconciliation prevent competing supported-service allocations.
22. **What happens when serialization policy changes?** It is frozen after any inventory balance exists for a component. Different tracking policy requires a distinct catalog SKU; historical stock is not silently reinterpreted.
23. **Can reserved stock transfer to another warehouse?** No. Transfers require sufficient unreserved stock and AVAILABLE serials. Both ledger legs and serial warehouse changes commit together.
24. **Can a warehouse with stock be deactivated?** No usable stock, quarantine stock or active reservation obligations may remain. Clear/transfer/dispose appropriately first.
25. **How are duplicate receipt/dispatch requests handled?** Every write has a global idempotency key, canonical body hash, actor binding and unique kind/reference. Identical replay returns the original frozen result; conflicting reuse fails.
26. **What if a retry uses another idempotency key?** The unique kind/reference prevents posting the same business reference twice. Never rotate references blindly to bypass a conflict.
27. **Can dispatch exceed a reservation?** No quantity override exists. Dispatch consumes the complete exact active reservation once, with one dispatch per reservation.
28. **Why does dispatch not equal installation?** It records warehouse release only. M05 owns site activity/milestones and delivery/installation confirmation; no M05 backend is implemented here.
29. **Are partial dispatches supported?** No. This version uses full dispatch only. Partial referenced returns are allowed up to cumulative dispatched quantity.
30. **How are returns controlled?** They reference posted dispatch lines; quantities cannot exceed remaining unreturned quantities. Serialized IDs must belong to that dispatch and still be DISPATCHED. All returns enter quarantine.
31. **Who can make returned equipment available again?** ADMIN posts a separate reasoned INSPECTION_RELEASE adjustment; disposal retires it instead. Returns never automatically imply reusability.
32. **How is historical serial allocation preserved after return?** Reservation/dispatch serialUnitIds arrays and immutable serial events retain identities independently of current allocation pointers. Dispatch detail resolves those original serial IDs.
33. **How does M04 support future warranties?** Original receipt date/reference, immutable serial/component identity and historical warehouse dispatch trace are available. M07 must separately authorize and register/activate warranties; M04 does neither.
34. **Are BOM estimated costs inventory valuation?** No. There are no acquisition cost layers, weighted averages, FIFO values or accounting journals. FINANCE receives permitted oversight/reference reads only.
35. **Are dashboard metrics real?** SQL aggregates and counts come from PostgreSQL, grouped by unit. No charts, seed movements, synthetic quantities or sample business rows are inserted.
36. **Which roles can modify stock?** ADMIN and WAREHOUSE operate normal stock flows; only ADMIN manages warehouses/reorder policies and adjustments/inspection/disposal. SALES/TECHNICIAN have scoped project reads; SUPPORT has no M04 access.
37. **How is the frontend secured?** Existing HttpOnly cookie, trusted Origin, CSRF header, strict JSON/Zod schemas, role checks and scoped queries remain in effect. Frontend role labels are not backend permissions.
38. **Has runtime correctness been proven?** No. Schema generation/validation, typecheck/build and source/SQL review are static checks. No migrations, servers, runtime/E2E tests or sample records were executed.
39. **What remains before live use?** Approved migration application and separate runtime API/transaction/concurrency/rollback/serial/security verification using authorized real fixtures. Review timeout/load behavior for larger BOMs.
40. **What are the main boundaries?** No partial/cross-warehouse fulfillment, replacement shipment for already-dispatched projects, lot/bin/quarantine case management, procurement, stock valuation, installation or warranty activation. Existing frontend services still use mocks.
