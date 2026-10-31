# M09 frontend API contract

Implemented backend contract, 2026-10-31. Base `/api/finance`. M01–M08 are merged in main baseline `269ad2bae2bcd8654e431bcee07b80ab5c41fbd2`. M09 does not modify the frontend. This document describes implemented operational finance, not statutory accounts, GST certification, bank reconciliation, payroll, subsidies or a payment gateway.

## Transport and authorization

Use existing `/api/auth` session login with `credentials: 'include'`. Send configured trusted `Origin`, `X-CSRF-Token` and `Content-Type: application/json` on writes, including read-only POST preview. Obtain CSRF from login or `/api/auth/me`; never persist session secrets in localStorage. JSON limit is the existing 32 KiB. All write bodies are strict: unknown fields fail validation. IDs are UUID strings; timestamps are ISO8601 with offset. No frontend-controlled actor or role fields.

| Role | Scope and actions |
|---|---|
| ADMIN | All finance customers; config/access; independent high-risk final reviews |
| FINANCE | Explicit active FinanceAccessGrant per customer; pricing review, invoices, verified receipts, corrections, reports; office expenses only own records |
| SALES | Existing M01 customer/lead scope; prepare/revise/send/record customer acceptance, create orders, view commercial documents; no financial cost estimates, receipt records or expense details |
| SUPPORT | M08 active SUPPORT installation service access; request/submit own service charges, evidence and status; no invoice/payment access |
| TECHNICIAN, WAREHOUSE | Denied finance router |

SALES cannot cancel/expire a non-DRAFT quote. Only creator or ADMIN cancels an unapproved request; approved request cancellation requires ADMIN. Credit/expense/refund review requires independent ADMIN. Service-charge review requires independent scoped FINANCE/ADMIN. All quotation reviews exclude preparer and prior draft editors; sensitive pricing additionally requires ADMIN. Receipt verification excludes recorder. Issued invoice void excludes issuer and requires ADMIN. Payment reversal excludes recorder and requires ADMIN. Refund completion excludes requester; approver may record the independently observed completion.

## Shared types and responses

```ts
type UUID = string;
type DecimalString = string; // JSON amounts, quantities and rates; never JS arithmetic
type ISODate = string;
interface CreateCommand { idempotencyKey: string; reason: string }
interface Command extends CreateCommand { version: number }
interface Page { page: number; pageSize: number; totalItems: number; totalPages: number }
interface Result<T> { data: T }
interface ListResult<T> extends Result<T[]> { pagination: Page }
interface Failure { error: { code: string; message: string; details?: {field:string;message:string}[]; requestId: string } }
interface FinancialTotals { subtotal: DecimalString; discountAmount: DecimalString; taxableAmount: DecimalString; taxAmount: DecimalString; totalAmount: DecimalString }
interface FinancialDocument { id: UUID; reference: string; customerId: UUID | null; currency: FinanceCurrency; version: number; createdAt: ISODate }
interface QuoteSelection { priceBookLineId: UUID; taxRuleId: UUID; quantity: DecimalString; discount: DecimalString }
interface QuoteInput extends CreateCommand { kind: 'INSTALLATION'|'SERVICE'; configurationId: UUID|null; serviceChargeId: UUID|null; priceBookId: UUID; validUntil: ISODate; terms: string; lines: QuoteSelection[] }
interface InvoiceBalance { invoice: Invoice; creditAmount: DecimalString; creditTax: DecimalString; creditNet: DecimalString; netDue: DecimalString; allocatedAmount: DecimalString; outstanding: DecimalString; effectiveStatus: 'DRAFT'|'ISSUED'|'PARTIALLY_PAID'|'PAID'|'OVERDUE'|'CREDITED'|'VOIDED'; asOf: ISODate }
interface Invoice extends FinancialDocument, FinancialTotals { orderId: UUID; siteId: UUID; status: 'DRAFT'|'ISSUED'|'VOIDED'; dueAt: ISODate; issuedAt: ISODate|null; issuedById: UUID|null; notes: string }
interface Payment extends FinancialDocument { amount: DecimalString; method: FinancePaymentMethod; externalReference: string; paidAt: ISODate; status: FinancePaymentStatus; recordedById: UUID; verifiedById: UUID|null; verifiedAt: ISODate|null; notes: string }
interface PaymentBalance { payment: Payment; allocatedAmount: DecimalString; reservedRefunds: DecimalString; completedRefunds: DecimalString; unallocatedBeforeRefunds: DecimalString; availableVerified: DecimalString }
interface Evidence { id: UUID; ownerVersion: number; customerId: UUID|null; quotationId: UUID|null; paymentId: UUID|null; creditNoteId: UUID|null; refundId: UUID|null; expenseId: UUID|null; serviceChargeId: UUID|null; type: FinanceEvidenceType; fileName: string; mimeType: string; sizeBytes: number; sha256: string; uploaderId: UUID; createdAt: ISODate }
```

Numeric strings serialize without guaranteed trailing zeroes (`"224.2"` is valid). Format display at 2 decimals. Persist command idempotency key per logical action, not per HTTP attempt. Target version must be current including evidence writes. Identical actor/role/key/action/body returns stored result after current authorization; changed key use, actor, role or body returns409. Replays do not revalidate historical target version, but do recheck current scope. Concurrent conflict returns409; refresh before choosing a new command. Uploads are versioned but do not use JSON-command idempotency; after uncertain upload reconcile evidence list and owner version before retrying.

Success `{data:...}`; list `{data:[...],pagination:{page,pageSize,totalItems,totalPages}}`. Create endpoints return201; other JSON successes200. Errors400 malformed JSON;401 session;403 role/independence/CSRF;404 missing or concealed scope;409 conflict/immutable/source/ledger;413 too large;415 media;422 validation;429 upload limit. Lists default page1/pageSize20, maximum100 (see existing shared pageQuery if changed). Reports return scoped aggregate objects, not a list page unless noted.

## Enums

```ts
type FinanceCurrency = 'INR'|'USD'|'EUR'|'GBP';
```

```ts
type FinanceLineKind = 'COMPONENT'|'INSTALLATION_LABOR'|'SERVICE_LABOR'|'TRANSPORT'|'OTHER_FEE';
```

```ts
type FinanceQuoteKind = 'INSTALLATION'|'SERVICE';
```

```ts
type FinanceQuoteStatus = 'DRAFT'|'SUBMITTED_FOR_APPROVAL'|'APPROVED'|'SENT'|'ACCEPTED'|'REJECTED'|'EXPIRED'|'CANCELLED'|'SUPERSEDED';
```

```ts
type FinanceInvoiceStatus = 'DRAFT'|'ISSUED'|'VOIDED';
```

```ts
type FinancePaymentStatus = 'RECORDED'|'PENDING_VERIFICATION'|'VERIFIED'|'REJECTED'|'REVERSED';
```

```ts
type FinancePaymentMethod = 'BANK_TRANSFER'|'UPI'|'CASH'|'CARD'|'CHEQUE'|'OTHER';
```

```ts
type FinanceApprovalStatus = 'DRAFT'|'SUBMITTED'|'APPROVED'|'REJECTED'|'RECORDED'|'ISSUED'|'REQUESTED'|'COMPLETED'|'CANCELLED';
```

```ts
type FinanceEntityKind = 'QUOTATION'|'ORDER'|'INVOICE'|'PAYMENT'|'CREDIT_NOTE'|'REFUND'|'EXPENSE'|'SERVICE_CHARGE';
```

```ts
type FinanceEvidenceType = 'CUSTOMER_ACCEPTANCE'|'PAYMENT_PROOF'|'CREDIT_SUPPORT'|'REFUND_PROOF'|'EXPENSE_RECEIPT'|'SERVICE_CHARGE_SUPPORT'|'OTHER';
```

FinanceApprovalStatus is shared; each entity permits only its documented lifecycle subset. Orders have immutable CONFIRMED commercial meaning (no status field). Invoice effective status is calculated separately from persisted status. Quotation effective EXPIRED may be computed before explicit expiry history is recorded; status filter uses persisted status.

## Exact routes

Every path below is relative to `/api/finance`. `C` means CreateCommand, `V` means Command; named body schemas are reproduced exactly below. List/detail are scoped entity records, with SALES redactions. Quotation detail adds ordered lines; list omits lines. Order snapshots are hidden from SALES. Invoice list/detail are InvoiceBalance wrappers; detail additionally has `lines`. Payment detail is PaymentBalance; its list returns Payment rows. Other entity list/detail return their Prisma fields (schema appendix below), excluding private storage keys.

| Method | Path | Body/query / result |
|---|---|---|
| GET | /summary | report filters; asOf, byCurrency originalIssuedGross/issuedCreditGross/netBilledExcludingTax/netBilledTax/allocatedVerifiedReceipts/outstanding; accountingBasis, currenciesCombined:false |
| GET | /receivables | report filters; InvoiceBalance[] + pagination + scope (issued book includes zero balances) |
| GET | /payments/summary | report filters; payments/refunds grouped by currency/status, _sum.amount, _count, meaning |
| GET | /expenses/summary | report filters; data grouped currency/status, _sum.amount, _count; recognition, bankPaymentExecution |
| GET | /project-profitability | installationId only; installationId/byCurrency netBilled/recordedNetCosts/netBilledLessRecordedCosts/grossMargin:null/costCompleteness, basis flags |
| GET | /access | page/pageSize/customerId; ADMIN grants list |
| POST | /customers/:id/access | grant; grant row, version:null for new, current version for existing/reactivation |
| POST | /access/:id/revoke | V; grant row |
| GET | /price-books | page/pageSize; immutable revision rows + lines, costs hidden from SALES |
| POST | /price-books | priceBook; book + lines |
| POST | /price-books/:id/deactivate | V; deactivated book |
| GET | /tax-rules | page/pageSize; tax revision rows |
| POST | /tax-rules | taxRule; tax row |
| POST | /tax-rules/:id/deactivate | V; tax row |
| POST | /pricing/preview | preview; source/currency/priceBookId/lines/totals/sensitivePricing/calculation + non-SALES estimates; no persisted operation |
| GET | /quotations | page/pageSize/customerId/currency/q; entity list |
| GET | /quotations/:id | entity detail |
| GET | /quotations/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /quotations/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /quotations/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /quotations/:id/evidence/:childId/download | protected binary download |
| GET | /orders | page/pageSize/customerId/currency/q; entity list |
| GET | /orders/:id | entity detail |
| GET | /orders/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /invoices | page/pageSize/customerId/currency/q; entity list |
| GET | /invoices/:id | entity detail |
| GET | /invoices/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /payments | page/pageSize/customerId/currency/q; entity list |
| GET | /payments/:id | entity detail |
| GET | /payments/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /payments/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /payments/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /payments/:id/evidence/:childId/download | protected binary download |
| GET | /credit-notes | page/pageSize/customerId/currency/q; entity list |
| GET | /credit-notes/:id | entity detail |
| GET | /credit-notes/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /credit-notes/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /credit-notes/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /credit-notes/:id/evidence/:childId/download | protected binary download |
| GET | /refunds | page/pageSize/customerId/currency/q; entity list |
| GET | /refunds/:id | entity detail |
| GET | /refunds/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /refunds/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /refunds/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /refunds/:id/evidence/:childId/download | protected binary download |
| GET | /expenses | page/pageSize/customerId/currency/q; entity list |
| GET | /expenses/:id | entity detail |
| GET | /expenses/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /expenses/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /expenses/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /expenses/:id/evidence/:childId/download | protected binary download |
| GET | /service-charges | page/pageSize/customerId/currency/q; entity list |
| GET | /service-charges/:id | entity detail |
| GET | /service-charges/:id/history | page/pageSize; history, SALES reason/details redacted |
| GET | /service-charges/:id/evidence | page/pageSize; safe evidence metadata |
| POST | /service-charges/:id/evidence | upload query + raw bytes; {evidence,ownerVersion} |
| GET | /service-charges/:id/evidence/:childId/download | protected binary download |
| POST | /quotations | quote; quotation + lines |
| PATCH | /quotations/:id | quotePatch; quotation + lines |
| POST | /quotations/:id/submit | V; submitted quotation |
| POST | /quotations/:id/review | review; reviewed quotation |
| POST | /quotations/:id/send | communication; quotation, records observed sending only |
| POST | /quotations/:id/accept | communication; quotation with actual acceptance |
| POST | /quotations/:id/revise | revise; new quotation row + lines, old SUPERSEDED |
| POST | /quotations/:id/cancel | V; quotation |
| POST | /quotations/:id/expire | V; quotation, validity must have elapsed |
| POST | /orders/from-quotation/:id | order; immutable order, id is quotation UUID |
| POST | /orders/:id/link-installation | bindOrder; one-time bound order |
| GET | /orders/:id/commercial-authorization | orderId/quotationId/revision/customer/site/design/BOM/installation/acceptedAt/currency/total/scope handoff |
| POST | /invoices | invoice; invoice + copied full lines |
| PATCH | /invoices/:id | invoicePatch; invoice, draft due/notes only |
| POST | /invoices/:id/issue | V; invoice |
| POST | /invoices/:id/void | V; invoice, ADMIN |
| GET | /invoices/:id/balance | InvoiceBalance |
| POST | /payments | payment; Payment |
| POST | /payments/:id/submit | V; Payment |
| POST | /payments/:id/verify | verify; Payment |
| POST | /payments/:id/allocate | allocate; {payment,allocations,balance:PaymentBalance} |
| POST | /payments/:id/allocations/:childId/release | release; {payment,release} |
| GET | /payments/:id/allocations | page/pageSize; allocation rows with releases |
| POST | /payments/:id/reverse | reverse; Payment |
| POST | /credit-notes | credit; credit note |
| POST | /credit-notes/:id/issue | V; {credit,balance,releasedToUnallocatedCustomerFunds} |
| POST | /expenses | expense; expense |
| POST | /expenses/:id/record | V; expense |
| POST | /service-charges | charge; service charge |
| POST | /credit-notes/:id/submit | V; entity row |
| POST | /credit-notes/:id/review | review; entity row |
| POST | /credit-notes/:id/cancel | V; entity row |
| POST | /expenses/:id/submit | V; entity row |
| POST | /expenses/:id/review | review; entity row |
| POST | /expenses/:id/cancel | V; entity row |
| POST | /service-charges/:id/submit | V; entity row |
| POST | /service-charges/:id/review | review; entity row |
| POST | /service-charges/:id/cancel | V; entity row |
| POST | /refunds | refund; refund request |
| POST | /refunds/:id/review | review; refund (ADMIN) |
| POST | /refunds/:id/complete | completeRefund; observed completed refund |
| POST | /refunds/:id/cancel | V; refund |

Filters: entity lists accept page/pageSize/customerId/currency/q (reference contains, case insensitive). Quotations also quoteStatus; payments paymentStatus; credits/refunds/expenses/service-charges approvalStatus. Unsupported query fields fail. Reports accept page/pageSize/customerId/currency; page fields do not truncate aggregate totals. Pricing catalogs/access/evidence/history/allocations have only the documented filters. Summary has explicit5000 invoice/20000 allocation limit, returning409 when exceeded; narrow customer/currency. It does not silently truncate financial totals.

## Exact request validators

The following is the actual strict Zod contract from `src/modules/finance/validation.ts`. `z.infer<typeof schema>` defines every request field; frontend types must reproduce these shapes. `uuid` is the shared CRM UUID validator; `pageQuery` supplies integer page1 and pageSize20 defaults/max100. Nullable source fields must be explicitly supplied; do not send undefined placeholders in JSON.

```ts
import {z} from 'zod';
import {FinanceCurrency,FinanceLineKind,FinancePaymentMethod,FinanceEntityKind,FinanceEvidenceType,FinanceQuoteStatus,FinancePaymentStatus,FinanceApprovalStatus} from '@prisma/client';
import {uuid,pageQuery} from '../crm/validation.js';
export const text=(max=2000)=>z.string().trim().min(1).max(max);
export const version=z.number().int().min(1).max(2147483646);
export const stamp=z.iso.datetime({offset:true}).refine(s=>s.slice(0,4)>='1900','Use a supported date from1900 onward');
export const amount=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/);
export const positive=amount.refine(s=>!/^0+(\.0+)?$/.test(s),'Positive monetary amount required');
export const quantity=z.string().regex(/^\d{1,9}(\.\d{1,3})?$/).refine(s=>!/^0+(\.0+)?$/.test(s));
export const unitPrice=z.string().regex(/^\d{1,14}(\.\d{1,4})?$/);
export const percent=z.string().regex(/^(100(\.0{1,4})?|\d{1,2}(\.\d{1,4})?)$/);
export const currency=z.enum(FinanceCurrency);
export const create=z.strictObject({idempotencyKey:text(100),reason:text()});
export const command=create.extend({version});
export const path=z.strictObject({id:uuid});
export const ids=z.array(uuid).max(50).refine(a=>a.length===new Set(a).size);
export const page=pageQuery.strict();
export const grant=create.extend({userId:uuid,version:version.nullable()});
export const priceLine=z.strictObject({code:text(64).transform(s=>s.toUpperCase()),kind:z.enum(FinanceLineKind),componentId:uuid.nullable(),description:text(2000),unit:text(40),unitPrice,estimatedUnitCost:unitPrice.nullable(),costSourceNotes:text().nullable()});
export const priceBook=create.extend({reference:text(64).transform(s=>s.toUpperCase()),revision:version,name:text(160),currency,effectiveFrom:stamp,effectiveTo:stamp.nullable(),discountApprovalPercent:percent,approvalThresholdAmount:amount,lines:z.array(priceLine).min(1).max(150)});
export const taxRule=create.extend({reference:text(64).transform(s=>s.toUpperCase()),revision:version,name:text(160),currency,ratePercent:percent,inclusive:z.boolean(),jurisdictionNotes:text(3000),effectiveFrom:stamp,effectiveTo:stamp.nullable()});
export const selection=z.strictObject({priceBookLineId:uuid,taxRuleId:uuid,quantity,discount:amount});
export const quoteFields={kind:z.enum(['INSTALLATION','SERVICE']),configurationId:uuid.nullable(),serviceChargeId:uuid.nullable(),priceBookId:uuid,validUntil:stamp,terms:text(5000),lines:z.array(selection).min(1).max(150)};
export const quote=create.extend(quoteFields);
export const quotePatch=command.extend({validUntil:stamp,terms:text(5000),lines:z.array(selection).min(1).max(150)});
export const revise=command.extend(quoteFields);
export const preview=z.strictObject(quoteFields);
export const review=command.extend({decision:z.enum(['APPROVED','REJECTED']),notes:text(5000),checklist:z.strictObject({sourceReviewed:z.boolean(),pricingReviewed:z.boolean(),evidenceReviewed:z.boolean(),termsReviewed:z.boolean()})});
export const communication=command.extend({observedAt:stamp,channel:text(80),attestation:text(3000),evidenceIds:ids.min(1)});
export const invoice=create.extend({orderId:uuid,orderVersion:version,dueAt:stamp,notes:text(5000)});
export const order=create.extend({quotationVersion:version,installationId:uuid.nullable()});
export const bindOrder=command.extend({installationId:uuid});
export const invoicePatch=command.extend({dueAt:stamp,notes:text(5000)});
export const payment=create.extend({customerId:uuid,currency,amount:positive,method:z.enum(FinancePaymentMethod),externalReference:text(160).transform(s=>s.toUpperCase().replace(/\s+/g,'')),paidAt:stamp,notes:text()}).refine(p=>p.method!=='CARD'||!/(?:\d[ -]?){13,19}/.test(p.externalReference),'Record a redacted receipt reference, never card credentials');
export const verify=command.extend({decision:z.enum(['VERIFIED','REJECTED']),notes:text(3000),checklist:z.strictObject({payerVerified:z.boolean(),amountVerified:z.boolean(),evidenceReviewed:z.boolean()})});
export const allocate=command.extend({allocations:z.array(z.strictObject({invoiceId:uuid,invoiceVersion:version,amount:positive})).min(1).max(30)}).refine(x=>new Set(x.allocations.map(a=>a.invoiceId)).size===x.allocations.length,'One allocation per invoice per command');
export const reverse=command.extend({notes:text(3000),evidenceIds:ids.min(1)});
export const release=command.extend({invoiceVersion:version,amount:positive});
export const credit=create.extend({invoiceId:uuid,invoiceVersion:version,amount:positive,adjustmentReason:text(3000)});
export const refund=create.extend({paymentId:uuid,paymentVersion:version,amount:positive,refundReason:text(3000)});
export const completeRefund=command.extend({completedAt:stamp,transferReference:text(160).transform(s=>s.toUpperCase().replace(/\s+/g,'')),attestation:text(3000),evidenceIds:ids.min(1)});
export const expense=create.extend({installationId:uuid.nullable(),serviceTicketId:uuid.nullable(),category:z.enum(['LABOR','TRANSPORT','EQUIPMENT_COST','CONSUMABLES','SERVICE_EXPENSE','REIMBURSEMENT','OFFICE','OTHER']),description:text(3000),vendorOrPayee:text(300),amount:positive,currency,incurredAt:stamp,costBasis:z.literal('NET_ACTUAL_COST')});
export const charge=create.extend({serviceTicketId:uuid,description:text(3000),allowedKinds:z.array(z.enum(['SERVICE_LABOR','TRANSPORT','OTHER_FEE'])).min(1).max(3).refine(a=>new Set(a).size===a.length),proposedAmount:positive,currency});
export const query=page.extend({customerId:uuid.optional(),currency:currency.optional(),q:text(160).optional(),quoteStatus:z.enum(FinanceQuoteStatus).optional(),paymentStatus:z.enum(FinancePaymentStatus).optional(),approvalStatus:z.enum(FinanceApprovalStatus).optional()});
export const entityPath=path.extend({kind:z.enum(FinanceEntityKind)});
export const evidenceParent=z.enum(['QUOTATION','PAYMENT','CREDIT_NOTE','REFUND','EXPENSE','SERVICE_CHARGE']);
export const upload=z.strictObject({version:z.coerce.number().int().min(1).max(2147483646),reason:text(),type:z.enum(FinanceEvidenceType),fileName:z.string().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9 _.-]*\.(jpg|jpeg|png|pdf)$/i)});
```

## Response field appendix

These are the actual persisted M09 field declarations. Decimal -> JSON string; DateTime -> ISO string; Json -> JSON; UUID/String -> string. Relation objects are not automatically serialized. Detail/list only include relations described in the route table, not every relation in Prisma. Safe evidence projection is Evidence above; storageKey is never returned. Quotation exposes estimatedCost/estimatedMargin/pricingSnapshot/submittedSnapshot/reviewSnapshot only to FINANCE/ADMIN; quote line estimatedCost is hidden from SALES. Pricing book lines hide estimatedUnitCost/costSourceNotes from SALES. Order snapshot is hidden from SALES. History details/reason are hidden from SALES. Other scalar schema fields are returned.

```prisma
model FinanceAccessGrant {

 id String @id @default(uuid()) @db.Uuid
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 userId String @db.Uuid
 user User @relation("FinanceGrantee",fields:[userId],references:[id],onDelete:Restrict)
 grantedById String @db.Uuid
 grantedBy User @relation("FinanceGrantor",fields:[grantedById],references:[id],onDelete:Restrict)
 isActive Boolean @default(true)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 @@unique([customerId,userId])
}

model FinancePriceBook {

 id String @id @default(uuid()) @db.Uuid
 reference String @db.VarChar(64)
 revision Int
 name String @db.VarChar(160)
 lineCount Int
 currency FinanceCurrency
 effectiveFrom DateTime @db.Timestamptz(3)
 effectiveTo DateTime? @db.Timestamptz(3)
 discountApprovalPercent Decimal @db.Decimal(7,4)
 approvalThresholdAmount Decimal @db.Decimal(24,2)
 isActive Boolean @default(true)
 version Int @default(1)
 publishedById String @db.Uuid
 publishedBy User @relation(fields:[publishedById],references:[id],onDelete:Restrict)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 lines FinancePriceBookLine[]
 quotations FinanceQuotation[]
 @@unique([reference,revision])
}

model FinancePriceBookLine {

 id String @id @default(uuid()) @db.Uuid
 priceBookId String @db.Uuid
 priceBook FinancePriceBook @relation(fields:[priceBookId],references:[id],onDelete:Restrict)
 code String @db.VarChar(64)
 kind FinanceLineKind
 componentId String? @db.Uuid
 component SolarComponent? @relation(fields:[componentId],references:[id],onDelete:Restrict)
 description String @db.VarChar(2000)
 unit String @db.VarChar(40)
 unitPrice Decimal @db.Decimal(18,4)
 estimatedUnitCost Decimal? @db.Decimal(18,4)
 costSourceNotes String? @db.VarChar(2000)
 quotations FinanceQuotationLine[]
 @@unique([priceBookId,code])
 @@unique([priceBookId,componentId])
}

model FinanceTaxRule {

 id String @id @default(uuid()) @db.Uuid
 reference String @db.VarChar(64)
 revision Int
 name String @db.VarChar(160)
 currency FinanceCurrency
 ratePercent Decimal @db.Decimal(7,4)
 inclusive Boolean
 jurisdictionNotes String @db.VarChar(3000)
 effectiveFrom DateTime @db.Timestamptz(3)
 effectiveTo DateTime? @db.Timestamptz(3)
 isActive Boolean @default(true)
 version Int @default(1)
 publishedById String @db.Uuid
 publishedBy User @relation(fields:[publishedById],references:[id],onDelete:Restrict)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 quotationLines FinanceQuotationLine[]
 @@unique([reference,revision])
}

model FinanceQuotation {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 seriesId String @default(uuid()) @db.Uuid
 revision Int @default(1)
 previousId String? @unique @db.Uuid
 previous FinanceQuotation? @relation("FinanceQuoteRevision",fields:[previousId],references:[id],onDelete:Restrict)
 revisions FinanceQuotation[] @relation("FinanceQuoteRevision")
 commercialKey String @db.VarChar(180)
 kind FinanceQuoteKind
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 siteId String @db.Uuid
 site Site @relation(fields:[siteId,customerId],references:[id,customerId],onDelete:Restrict)
 leadId String @db.Uuid
 lead Lead @relation(fields:[leadId],references:[id],onDelete:Restrict)
 configurationId String? @db.Uuid
 configuration SolarConfiguration? @relation(fields:[configurationId],references:[id],onDelete:Restrict)
 configurationApprovedVersion Int?
 configurationReviewId String? @db.Uuid
 configurationReview SolarConfigurationReview? @relation(fields:[configurationReviewId],references:[id],onDelete:Restrict)
 bomId String? @db.Uuid
 bom BillOfMaterials? @relation(fields:[bomId],references:[id],onDelete:Restrict)
 bomVersion Int?
 serviceChargeId String? @db.Uuid
 serviceCharge FinanceServiceCharge? @relation(fields:[serviceChargeId],references:[id],onDelete:Restrict)
 priceBookId String @db.Uuid
 priceBook FinancePriceBook @relation(fields:[priceBookId],references:[id],onDelete:Restrict)
 currency FinanceCurrency
 sourceSnapshot Json
 pricingSnapshot Json
 submittedSnapshot Json?
 reviewSnapshot Json?
 subtotal Decimal @db.Decimal(24,2)
 discountAmount Decimal @db.Decimal(24,2)
 taxableAmount Decimal @db.Decimal(24,2)
 taxAmount Decimal @db.Decimal(24,2)
 totalAmount Decimal @db.Decimal(24,2)
 estimatedCost Decimal? @db.Decimal(24,2)
 estimatedMargin Decimal? @db.Decimal(24,2)
 sensitivePricing Boolean
 validUntil DateTime @db.Timestamptz(3)
 terms String @db.VarChar(5000)
 status FinanceQuoteStatus @default(DRAFT)
 preparedById String @db.Uuid
 preparedBy User @relation("FinanceQuoteCreator",fields:[preparedById],references:[id],onDelete:Restrict)
 approvedById String? @db.Uuid
 approvedBy User? @relation("FinanceQuoteReviewer",fields:[approvedById],references:[id],onDelete:Restrict)
 submittedAt DateTime? @db.Timestamptz(3)
 approvedAt DateTime? @db.Timestamptz(3)
 sentAt DateTime? @db.Timestamptz(3)
 acceptedAt DateTime? @db.Timestamptz(3)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 updatedAt DateTime @updatedAt @db.Timestamptz(3)
 lines FinanceQuotationLine[]
 order FinanceSalesOrder?
 history FinanceHistory[]
 evidence FinanceEvidence[]
 @@unique([seriesId,revision])
 @@index([customerId,status,createdAt,id])
}

model FinanceQuotationLine {

 id String @id @default(uuid()) @db.Uuid
 quotationId String @db.Uuid
 quotation FinanceQuotation @relation(fields:[quotationId],references:[id],onDelete:Restrict)
 priceBookLineId String @db.Uuid
 priceBookLine FinancePriceBookLine @relation(fields:[priceBookLineId],references:[id],onDelete:Restrict)
 taxRuleId String @db.Uuid
 taxRule FinanceTaxRule @relation(fields:[taxRuleId],references:[id],onDelete:Restrict)
 position Int
 kind FinanceLineKind
 description String @db.VarChar(2000)
 unit String @db.VarChar(40)
 quantity Decimal @db.Decimal(12,3)
 unitPrice Decimal @db.Decimal(18,4)
 extendedPrice Decimal @db.Decimal(24,2)
 enteredDiscount Decimal @db.Decimal(24,2)
 subtotal Decimal @db.Decimal(24,2)
 discountAmount Decimal @db.Decimal(24,2)
 taxableAmount Decimal @db.Decimal(24,2)
 taxAmount Decimal @db.Decimal(24,2)
 totalAmount Decimal @db.Decimal(24,2)
 estimatedCost Decimal? @db.Decimal(24,2)
 taxSnapshot Json
 invoiceLines FinanceInvoiceLine[]
 @@unique([quotationId,position])
 @@unique([quotationId,priceBookLineId])
}

model FinanceSalesOrder {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 quotationId String @unique @db.Uuid
 quotation FinanceQuotation @relation(fields:[quotationId],references:[id],onDelete:Restrict)
 commercialKey String @unique @db.VarChar(180)
 installationId String? @db.Uuid
 installation InstallationJob? @relation(fields:[installationId],references:[id],onDelete:Restrict)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 siteId String @db.Uuid
 site Site @relation(fields:[siteId,customerId],references:[id,customerId],onDelete:Restrict)
 currency FinanceCurrency
 totalAmount Decimal @db.Decimal(24,2)
 snapshot Json
 acceptedAt DateTime @db.Timestamptz(3)
 authorizedById String @db.Uuid
 authorizedBy User @relation(fields:[authorizedById],references:[id],onDelete:Restrict)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 invoice FinanceInvoice?
 history FinanceHistory[]
 @@index([customerId,createdAt,id])
}

model FinanceInvoice {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 orderId String @unique @db.Uuid
 order FinanceSalesOrder @relation(fields:[orderId],references:[id],onDelete:Restrict)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 siteId String @db.Uuid
 site Site @relation(fields:[siteId,customerId],references:[id,customerId],onDelete:Restrict)
 currency FinanceCurrency
 subtotal Decimal @db.Decimal(24,2)
 discountAmount Decimal @db.Decimal(24,2)
 taxableAmount Decimal @db.Decimal(24,2)
 taxAmount Decimal @db.Decimal(24,2)
 totalAmount Decimal @db.Decimal(24,2)
 dueAt DateTime @db.Timestamptz(3)
 notes String @db.VarChar(5000)
 termsSnapshot Json
 status FinanceInvoiceStatus @default(DRAFT)
 createdById String @db.Uuid
 createdBy User @relation("FinanceInvoiceCreator",fields:[createdById],references:[id],onDelete:Restrict)
 issuedById String? @db.Uuid
 issuedBy User? @relation("FinanceInvoiceIssuer",fields:[issuedById],references:[id],onDelete:Restrict)
 issuedAt DateTime? @db.Timestamptz(3)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 lines FinanceInvoiceLine[]
 allocations FinancePaymentAllocation[]
 credits FinanceCreditNote[]
 history FinanceHistory[]
 @@index([customerId,status,dueAt,id])
}

model FinanceInvoiceLine {

 id String @id @default(uuid()) @db.Uuid
 invoiceId String @db.Uuid
 invoice FinanceInvoice @relation(fields:[invoiceId],references:[id],onDelete:Restrict)
 quotationLineId String @db.Uuid
 quotationLine FinanceQuotationLine @relation(fields:[quotationLineId],references:[id],onDelete:Restrict)
 position Int
 snapshot Json
 subtotal Decimal @db.Decimal(24,2)
 discountAmount Decimal @db.Decimal(24,2)
 taxableAmount Decimal @db.Decimal(24,2)
 taxAmount Decimal @db.Decimal(24,2)
 totalAmount Decimal @db.Decimal(24,2)
 @@unique([invoiceId,quotationLineId])
 @@unique([invoiceId,position])
}

model FinancePayment {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 currency FinanceCurrency
 amount Decimal @db.Decimal(24,2)
 method FinancePaymentMethod
 externalReference String @db.VarChar(160)
 paidAt DateTime @db.Timestamptz(3)
 notes String @db.VarChar(2000)
 status FinancePaymentStatus @default(RECORDED)
 recordedById String @db.Uuid
 recordedBy User @relation("FinancePaymentRecorder",fields:[recordedById],references:[id],onDelete:Restrict)
 verifiedById String? @db.Uuid
 verifiedBy User? @relation("FinancePaymentVerifier",fields:[verifiedById],references:[id],onDelete:Restrict)
 verifiedAt DateTime? @db.Timestamptz(3)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 allocations FinancePaymentAllocation[]
 refunds FinanceRefund[]
 evidence FinanceEvidence[]
 history FinanceHistory[]
 @@unique([customerId,method,externalReference])
 @@index([customerId,status,createdAt,id])
}

model FinancePaymentAllocation {

 id String @id @default(uuid()) @db.Uuid
 paymentId String @db.Uuid
 payment FinancePayment @relation(fields:[paymentId],references:[id],onDelete:Restrict)
 invoiceId String @db.Uuid
 invoice FinanceInvoice @relation(fields:[invoiceId],references:[id],onDelete:Restrict)
 amount Decimal @db.Decimal(24,2)
 actorId String @db.Uuid
 actor User @relation(fields:[actorId],references:[id],onDelete:Restrict)
 operationId String @db.Uuid
 operation FinanceOperation @relation(fields:[operationId],references:[id],onDelete:Restrict)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 releases FinanceAllocationRelease[]
 @@unique([operationId,invoiceId])
 @@index([paymentId,invoiceId])
}

model FinanceAllocationRelease {

 id String @id @default(uuid()) @db.Uuid
 allocationId String @db.Uuid
 allocation FinancePaymentAllocation @relation(fields:[allocationId],references:[id],onDelete:Restrict)
 amount Decimal @db.Decimal(24,2)
 actorId String @db.Uuid
 actor User @relation(fields:[actorId],references:[id],onDelete:Restrict)
 operationId String @db.Uuid
 operation FinanceOperation @relation(fields:[operationId],references:[id],onDelete:Restrict)
 reason String @db.VarChar(2000)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 @@unique([operationId,allocationId])
}

model FinanceCreditNote {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 invoiceId String @db.Uuid
 invoice FinanceInvoice @relation(fields:[invoiceId],references:[id],onDelete:Restrict)
 currency FinanceCurrency
 amount Decimal @db.Decimal(24,2)
 taxAmount Decimal? @db.Decimal(24,2)
 taxableAmount Decimal? @db.Decimal(24,2)
 adjustmentReason String @db.VarChar(3000)
 status FinanceApprovalStatus @default(DRAFT)
 createdById String @db.Uuid
 createdBy User @relation("FinanceCreditCreator",fields:[createdById],references:[id],onDelete:Restrict)
 approvedById String? @db.Uuid
 approvedBy User? @relation("FinanceCreditReviewer",fields:[approvedById],references:[id],onDelete:Restrict)
 approvedAt DateTime? @db.Timestamptz(3)
 issuedAt DateTime? @db.Timestamptz(3)
 snapshot Json
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 history FinanceHistory[]
 evidence FinanceEvidence[]
 @@index([invoiceId,status])
}

model FinanceRefund {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 paymentId String @db.Uuid
 payment FinancePayment @relation(fields:[paymentId],references:[id],onDelete:Restrict)
 currency FinanceCurrency
 amount Decimal @db.Decimal(24,2)
 refundReason String @db.VarChar(3000)
 status FinanceApprovalStatus @default(REQUESTED)
 requestedById String @db.Uuid
 requestedBy User @relation("FinanceRefundRequester",fields:[requestedById],references:[id],onDelete:Restrict)
 approvedById String? @db.Uuid
 approvedBy User? @relation("FinanceRefundReviewer",fields:[approvedById],references:[id],onDelete:Restrict)
 approvedAt DateTime? @db.Timestamptz(3)
 completedById String? @db.Uuid
 completedBy User? @relation("FinanceRefundCompleter",fields:[completedById],references:[id],onDelete:Restrict)
 completedAt DateTime? @db.Timestamptz(3)
 transferReference String? @unique @db.VarChar(160)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 history FinanceHistory[]
 evidence FinanceEvidence[]
 @@index([paymentId,status])
}

model FinanceExpense {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 customerId String? @db.Uuid
 customer Customer? @relation(fields:[customerId],references:[id],onDelete:Restrict)
 installationId String? @db.Uuid
 installation InstallationJob? @relation(fields:[installationId],references:[id],onDelete:Restrict)
 serviceTicketId String? @db.Uuid
 serviceTicket ServiceTicket? @relation(fields:[serviceTicketId],references:[id],onDelete:Restrict)
 category String @db.VarChar(60)
 description String @db.VarChar(3000)
 vendorOrPayee String @db.VarChar(300)
 amount Decimal @db.Decimal(24,2)
 currency FinanceCurrency
 incurredAt DateTime @db.Timestamptz(3)
 costBasis String @default("NET_ACTUAL_COST") @db.VarChar(40)
 status FinanceApprovalStatus @default(DRAFT)
 createdById String @db.Uuid
 createdBy User @relation("FinanceExpenseCreator",fields:[createdById],references:[id],onDelete:Restrict)
 approvedById String? @db.Uuid
 approvedBy User? @relation("FinanceExpenseReviewer",fields:[approvedById],references:[id],onDelete:Restrict)
 approvedAt DateTime? @db.Timestamptz(3)
 recordedAt DateTime? @db.Timestamptz(3)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 history FinanceHistory[]
 evidence FinanceEvidence[]
 @@index([customerId,status,incurredAt,id])
}

model FinanceServiceCharge {

 id String @id @default(uuid()) @db.Uuid
 reference String @unique @db.VarChar(60)
 customerId String @db.Uuid
 customer Customer @relation(fields:[customerId],references:[id],onDelete:Restrict)
 serviceTicketId String @db.Uuid
 serviceTicket ServiceTicket @relation(fields:[serviceTicketId],references:[id],onDelete:Restrict)
 description String @db.VarChar(3000)
 allowedKinds FinanceLineKind[]
 proposedAmount Decimal @db.Decimal(24,2)
 currency FinanceCurrency
 sourceSnapshot Json
 status FinanceApprovalStatus @default(DRAFT)
 requestedById String @db.Uuid
 requestedBy User @relation("FinanceChargeRequester",fields:[requestedById],references:[id],onDelete:Restrict)
 approvedById String? @db.Uuid
 approvedBy User? @relation("FinanceChargeReviewer",fields:[approvedById],references:[id],onDelete:Restrict)
 approvedAt DateTime? @db.Timestamptz(3)
 version Int @default(1)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 quotations FinanceQuotation[]
 evidence FinanceEvidence[]
 history FinanceHistory[]
 @@index([customerId,status,createdAt,id])
}

model FinanceOperation {

 allocations FinancePaymentAllocation[]
 releases FinanceAllocationRelease[]
 id String @id @default(uuid()) @db.Uuid
 idempotencyKey String @unique @db.VarChar(100)
 kind String @db.VarChar(60)
 requestHash String @db.Char(64)
 actorId String @db.Uuid
 actor User @relation(fields:[actorId],references:[id],onDelete:Restrict)
 actorRole Role
 reason String @db.VarChar(2000)
 result Json
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 history FinanceHistory[]
}

model FinanceHistory {

 id String @id @default(uuid()) @db.Uuid
 entityKind FinanceEntityKind
 entityId String @db.Uuid
 quotationId String? @db.Uuid
 quotation FinanceQuotation? @relation(fields:[quotationId],references:[id],onDelete:Restrict)
 orderId String? @db.Uuid
 order FinanceSalesOrder? @relation(fields:[orderId],references:[id],onDelete:Restrict)
 invoiceId String? @db.Uuid
 invoice FinanceInvoice? @relation(fields:[invoiceId],references:[id],onDelete:Restrict)
 paymentId String? @db.Uuid
 payment FinancePayment? @relation(fields:[paymentId],references:[id],onDelete:Restrict)
 creditNoteId String? @db.Uuid
 creditNote FinanceCreditNote? @relation(fields:[creditNoteId],references:[id],onDelete:Restrict)
 refundId String? @db.Uuid
 refund FinanceRefund? @relation(fields:[refundId],references:[id],onDelete:Restrict)
 expenseId String? @db.Uuid
 expense FinanceExpense? @relation(fields:[expenseId],references:[id],onDelete:Restrict)
 serviceChargeId String? @db.Uuid
 serviceCharge FinanceServiceCharge? @relation(fields:[serviceChargeId],references:[id],onDelete:Restrict)
 actorId String @db.Uuid
 actor User @relation(fields:[actorId],references:[id],onDelete:Restrict)
 operationId String? @db.Uuid
 operation FinanceOperation? @relation(fields:[operationId],references:[id],onDelete:Restrict)
 version Int
 event String @db.VarChar(60)
 fromStatus String? @db.VarChar(40)
 toStatus String @db.VarChar(40)
 reason String @db.VarChar(3000)
 details Json
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 @@unique([entityId,version])
}

model FinanceEvidence {

 id String @id @default(uuid()) @db.Uuid
 ownerVersion Int
 customerId String? @db.Uuid
 customer Customer? @relation(fields:[customerId],references:[id],onDelete:Restrict)
 quotationId String? @db.Uuid
 quotation FinanceQuotation? @relation(fields:[quotationId],references:[id],onDelete:Restrict)
 paymentId String? @db.Uuid
 payment FinancePayment? @relation(fields:[paymentId],references:[id],onDelete:Restrict)
 creditNoteId String? @db.Uuid
 creditNote FinanceCreditNote? @relation(fields:[creditNoteId],references:[id],onDelete:Restrict)
 refundId String? @db.Uuid
 refund FinanceRefund? @relation(fields:[refundId],references:[id],onDelete:Restrict)
 expenseId String? @db.Uuid
 expense FinanceExpense? @relation(fields:[expenseId],references:[id],onDelete:Restrict)
 serviceChargeId String? @db.Uuid
 serviceCharge FinanceServiceCharge? @relation(fields:[serviceChargeId],references:[id],onDelete:Restrict)
 type FinanceEvidenceType
 fileName String @db.VarChar(160)
 mimeType String @db.VarChar(100)
 sizeBytes Int
 sha256 String @db.Char(64)
 storageKey String @unique @db.VarChar(100)
 uploaderId String @db.Uuid
 uploader User @relation(fields:[uploaderId],references:[id],onDelete:Restrict)
 createdAt DateTime @default(now()) @db.Timestamptz(3)
 @@index([customerId,createdAt,id])
}

```

## Illustrative requests

These examples describe shapes; they were not executed and UUID/date placeholders must be replaced with actual authorized records and dates.

```json
{"idempotencyKey":"quote-draft-unique","reason":"Prepare approved residential design offer","kind":"INSTALLATION","configurationId":"<approved-configuration-uuid>","serviceChargeId":null,"priceBookId":"<book-uuid>","validUntil":"2026-11-30T12:00:00+05:30","terms":"Commercial scope and exclusions reviewed","lines":[{"priceBookLineId":"<component-book-line-uuid>","taxRuleId":"<tax-rule-uuid>","quantity":"2","discount":"10.00"}]}
```

Real installation quotes must include every approved BOM component at exact approved quantity/unit; the single-line example is valid only if that is the entire BOM. Extra installation labor/transport/other-fee lines are explicit. Service lines are limited by the approved charge allowedKinds/ceiling.

```json
{"idempotencyKey":"payment-record-unique","reason":"Record observed bank receipt","customerId":"<customer-uuid>","currency":"INR","amount":"100.00","method":"BANK_TRANSFER","externalReference":"REDACTED-RECEIPT-REFERENCE","paidAt":"2026-10-30T12:00:00+05:30","notes":"Verify against actual evidence"}
```

```json
{"idempotencyKey":"allocate-unique","reason":"Apply verified customer receipt","version":4,"allocations":[{"invoiceId":"<invoice-uuid>","invoiceVersion":2,"amount":"100.00"}]}
```

```json
{"data":{"invoice":{"id":"<invoice-uuid>","status":"ISSUED","currency":"INR","totalAmount":"224.2","version":3},"creditAmount":"0","creditTax":"0","creditNet":"0","netDue":"224.2","allocatedAmount":"100","outstanding":"124.2","effectiveStatus":"PARTIALLY_PAID","asOf":"2026-10-31T12:00:00.000Z"}}
```

The last response is an abbreviated balance example; actual invoice scalars follow the appendix. Review body is V + decision APPROVED/REJECTED + notes + all four sourceReviewed/pricingReviewed/evidenceReviewed/termsReviewed booleans. Receipt verify uses payerVerified/amountVerified/evidenceReviewed instead. Approval requires every check true; a rejection may record false checks.

## Private evidence

POST one raw JPEG/PNG/PDF file to `/<group>/:id/evidence?version=3&reason=<URL-encoded-reason>&type=PAYMENT_PROOF&fileName=receipt.pdf`. Do not use multipart or JSON/base64. JSON command headers are replaced with the actual media Content-Type; retain Origin/CSRF/cookie. Allowed extensions match byte signatures; default5MiB, configurable at most10MiB. Filename max160, restricted ASCII, no path separators. Max50 objects per document, upload10 per15minutes per limiter. Application authorizes before buffering and again in transaction. Upload returns safe metadata and new ownerVersion. Upload evidence before the dependent review/acceptance/completion, then use refreshed version.

Categories: quotation CUSTOMER_ACCEPTANCE; payment PAYMENT_PROOF; credit CREDIT_SUPPORT; refund REFUND_PROOF; expense EXPENSE_RECEIPT; charge SERVICE_CHARGE_SUPPORT; OTHER allowed but does not satisfy mandatory category. Downloads force attachment and verify SHA256/length. No private path/public URL is exposed. File signature/checksum is not malware scanning or authenticity verification. Evidence freezes with terminal/approved states as implemented: quotations until SENT; payments through VERIFIED; credits/expenses/charges through SUBMITTED; refunds through APPROVED. No upload endpoint for orders/invoices; evidence remains linked to its originating commercial/receipt/adjustment record.

## Pricing, balances and workflow

Currencies INR/USD/EUR/GBP use2 decimals, no conversion or mixed-currency documents. Decimal48 precision with ROUND_HALF_UP; line extension rounded2dp first, discount before tax, tax rounded per line, headers sum rounded lines. Exclusive example:2×100, discount10, tax18% -> subtotal200, taxable190, tax34.20, total224.20. Inclusive example:2×118, gross discount11.80, tax18% -> net subtotal200, net discount10, taxable190, tax34.20, total224.20. Entered discount for inclusive pricing is gross; normalized document discount is net. No second document-wide discount layer.

Balance = issued gross − issued credits − active verified allocations. Active allocation = original amount − append-only releases. Credit gross/net/tax cannot exceed original respective portions. Partial credit tax uses original proportional tax, bounded by remaining net/tax; final credit reconciles remainder. Credit release only frees excess invoice allocations; refund requires a separate request, independent authorization and observed transfer proof. Approved refunds reserve verified unallocated funds; completed refunds consume them. Requested refunds reserve nothing. No invoice paid flag can be patched. Fully credited invoice is CREDITED, not evidence of payment.

Quotations: DRAFT→SUBMITTED_FOR_APPROVAL→APPROVED→SENT→ACCEPTED; review may REJECT; explicit cancel/expire/revise permitted before accepted with state/role restrictions. Revision creates new row and SUPERSEDES old; accepted/cancelled/superseded cannot revise. Orders are one immutable commitment per accepted commercial project; optional installation link established once. Invoices: DRAFT→ISSUED; ADMIN may VOID only with no historical allocations/credits (independent of issuer for issued). One full invoice per order, exact accepted lines; no partial/milestone or replacement invoice workflow. Payments: RECORDED→PENDING_VERIFICATION→VERIFIED/REJECTED; independent ADMIN can reverse VERIFIED with proof and released allocations, but refunds block reversal. Expenses DRAFT→SUBMITTED→APPROVED/REJECTED→RECORDED (only approved); credit same through APPROVED then ISSUED; unexecuted cancellation guarded. Charges DRAFT→SUBMITTED→APPROVED/REJECTED, then customer quote/order/invoice; cancellation cannot invalidate accepted quote. Refunds REQUESTED→APPROVED/REJECTED→COMPLETED (only approved), or cancel before completion with role guard.

## Frontend mock differences

Current `src/features/finance` services use local mock data, JS numbers, client-side status updates and print/receipt views. They do not implement this session/CSRF/grant/independent-review/evidence/version/idempotency contract. Replace service calls through an adapter; do not map a mock payment directly to VERIFIED or a mock invoice directly to PAID. Existing editable invoices cannot edit issued terms or set amounts directly. Invoice creation selects a real accepted order; pricing uses approved BOM and configured book/tax IDs. Reports group currencies and distinguish billed, received, credited, refunded and recorded costs. Private receipts use authenticated downloads, not mock document URLs. Technician-payment/subsidy mocks have no M09 backend endpoint. No payroll, subsidy or tax-filing implementation is implied. UI wiring remains Abisha's separate work.
