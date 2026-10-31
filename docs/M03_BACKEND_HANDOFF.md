# M03 backend handoff and M02 dependency

M03 is implemented only in the backend. It adds technical component definitions, versioned templates, customer configuration revisions, exact material BOMs and independent internal review. No M04 backend stock/warehouse/reservation/serial movement or other later module is implemented. Existing M03/M04 React screens are preserved unchanged.

## Branch ancestry and merge order

- M02 PR: https://github.com/Aghil067/Odoo-Final/pull/2 — open/unmerged when M03 work started.
- M03 branch: `codex/m03-solar-configuration`, based on M02 head `136e62b43a757b9ad898fccc32ea67307124dfd4`.
- Latest main at inspection: `872846732abce1723e6474e156f469708e9e2836`, Abisha's M03/M04 frontend work.
- Main was incorporated unchanged through M03 base merge `a481110015568ccc932d547b8f9fb5e787dc261d`.
- **Merge M02 before M03 into main.** Review M03-only source changes relative to that combined base; otherwise the dependency's changes also appear in the comparison. Do not merge or deploy the M03 migration before the existing M01/M02 migrations.

The supplied attachment ends mid-section 10. The implementation covers the supplied scope, including differences from recommended/requested/target capacity. No extra unseen API, testing or publication instructions are assumed. A separate M03 push/PR has not been performed as part of this local implementation; confirm any additional publication requirements before doing so. Existing main and the M02 remote branch are not modified by M03.

## Code and setup

Worktree: `E:\Downloads\odoo-hackathon-24hrs\.publish\m03`. Run existing backend dependency/generate/validate/typecheck/build commands from backend/. No new dependency, environment secret or authentication system is introduced. Review the generated additive `20261031000300_m03_solar_configuration` migration before explicitly authorizing its application. No database operation, server, seed, runtime test, catalog item/template or customer configuration has been executed/created by verification.

M02 now exposes `requireApprovedSurvey(tx,user,id)` for use inside an M03 transaction; its existing HTTP wrapper/result/roles are unchanged. Every M03 design/approval references the exact approved/latest/eligible survey and review/version, preserves conditional work and cannot claim technical certification.

## Frontend adaptation needed

Use [the exact M03 contract](../backend/docs/integration/M03_FRONTEND_API_CONTRACT.md), [M03 architecture](../backend/docs/modules/M03_SOLAR_CONFIGURATION_TECHNICAL_DOCUMENTATION.md) and [code walkthrough](../backend/docs/modules/M03_SOLAR_CONFIGURATION_CODE_EXPLANATION.md). Existing frontend mock stores use different lowercased categories/statuses, free-text specifications/units and number-based client costs. Replace those services deliberately with UUIDs, typed/sourced manufacturer data, strict unit enums, Decimal strings, current configuration/catalog/template versions and server calculations. `ready_for_quotation` is not the M03 review state machine and does not imply configuration approval.

Use existing cookie + Origin + CSRF authentication, not UI role renaming. ADMIN manages catalog/templates; ADMIN or a currently assigned-survey TECHNICIAN may design. A different ADMIN who did not create/edit that revision must approve. SALES reads only within M01 lead scope. Unknown critical compatibility blocks approval even if a reviewer checks all boxes. Conditions remain attached to snapshots even if a supplemental editable note is cleared.

Template lines are starting quantities, not a hidden scaling formula. Explicitly edit quantities/array/battery topology and review the returned findings. A BOM has one currency and real snapshot material costs, not warehouse availability or labor/quotation pricing. Missing nominal ratings return null capacities, not manufactured values. Approved changes use a new linked revision. M04 may later consume the guarded approved configuration/BOM reference and separately validate stock; no inventory mutation occurs here.

Verification and exact created/modified files: [M03_VERIFICATION.md](../backend/docs/M03_VERIFICATION.md). Backend static checks passed; custom PostgreSQL trigger execution, real calculations/transactions/concurrency and frontend/API integration still need explicitly approved runtime verification. Stop after M03.
