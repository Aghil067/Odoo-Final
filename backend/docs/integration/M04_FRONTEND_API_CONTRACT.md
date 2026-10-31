# M04 frontend API contract

Base `/api/inventory`. This contract describes actual backend implementation; React mocks are unchanged. All IDs are UUIDs. All quantities are decimal **strings**, including read aggregates; timestamps are ISO strings. No acquisition costs, client-calculated available quantities, arbitrary statuses or stock-value totals are accepted. M03 `/api/solar/components` remains the only component catalog.

## Authentication, authorization and transport

Reuse existing login/me/logout and HttpOnly session cookies (`credentials:'include'` / Axios withCredentials). Mutations require exact trusted Origin, application/json and X-CSRF-Token from login/me. No bearer-token/localStorage role authorization is added. JSON bodies are limited to 32 KiB. Backend roles are uppercase ADMIN, WAREHOUSE, FINANCE, SALES, TECHNICIAN, SUPPORT.

Role abbreviations below: A = ADMIN; O = ADMIN/WAREHOUSE; R = ADMIN/WAREHOUSE/FINANCE; P = R plus scoped SALES/TECHNICIAN. SALES scope uses M01 assigned/self-created unassigned leads; TECHNICIAN scope uses currently assigned survey. SUPPORT has no M04 routes. Project reads cannot search global stock/serials/operation payloads.

Success `{data:T}`, lists `{data:T[],pagination:{page,pageSize,totalItems,totalPages}}`, failure `{error:{code,message,details?:{field,message}[],requestId}}`. Creation POST returns 201 (including identical replay), other success 200. Decimal strings may omit trailing zeros. List defaults page=1/pageSize=20; maximum page=100000/pageSize=100. Unknown query/body fields are rejected for list/write routes. Detail routes use UUID path validation; unused detail query parameters have no effect. GET availability requires warehouseId. No server/sample data is started/created by these documentation examples.

## Exact endpoint inventory

| Method/path | Role | Query/input and result |
|---|---|---|
| POST /warehouses | A | WarehouseCreate → Warehouse |
| GET /warehouses | R | page,pageSize,q,active='true'/'false' → Warehouse[] |
| GET /warehouses/:id | R | → Warehouse |
| PATCH /warehouses/:id | A | WarehousePatch → {before,warehouse} |
| GET /balances | R | page,pageSize,warehouseId,componentId,q → Balance[] with component/warehouse labels |
| PATCH /balances/reorder | A | ReorderCommand → Balance |
| GET /movements | R | page,pageSize,warehouseId,componentId,type,operationId,from,to → Movement[] with operation/reference/actor/reason and balance component/warehouse IDs |
| POST /receipts | O | ReceiptCommand → {operationId,movement,balance} |
| POST /adjustments | A | AdjustmentCommand → {operationId,movement,balance} |
| POST /transfers | O | TransferCommand → {operationId,transfer,movements:[out,in]} |
| GET /serials | R | page,pageSize,warehouseId,componentId,q,state → SerialUnit[] |
| GET /serials/:id | R | → SerialUnit with component/warehouse/original receipt operation |
| GET /serials/:id/history | R | page,pageSize → SerialEvent[] descending version |
| GET /availability/:configurationId | P | warehouseId required → Availability |
| POST /reservations | O | ReserveCommand → {operationId,reservation:ReservationDetail} |
| GET /reservations | P | page,pageSize,warehouseId,configurationId,status → Reservation[] |
| GET /reservations/:id | P | → ReservationDetail |
| GET /reservations/:id/availability | P | → {reservationId,status,lines:[{componentId,reservedForThisProject,warehouseBalance:Balance|null}]} |
| POST /reservations/:id/release | O | VersionCommand → {operationId,reservation:Reservation} |
| POST /reservations/:id/cancel | O | VersionCommand → {operationId,reservation:Reservation} |
| POST /dispatches | O | DispatchCommand → {operationId,dispatch:DispatchDetail,scope:'WAREHOUSE_RELEASE_ONLY'} |
| GET /dispatches | P | page,pageSize,warehouseId,configurationId → Dispatch[] |
| GET /dispatches/:id | P | → DispatchDetail/handoff with reservation identities and scope |
| POST /returns | O | ReturnCommand → {operationId,dispatchId,movements,disposition:'QUARANTINED_NOT_AVAILABLE'} |
| GET /summary | R | warehouseId; page/pageSize accepted but unused → Summary |
| GET /low-stock | R | page,pageSize,warehouseId,componentId → (Balance & {sku,name,unit})[] |
| GET /operations | R | page,pageSize,q(reference substring) → OperationSummary[] |
| GET /operations/:id | R | → OperationSummary & {payload:Json,result:Json} |

No partial dispatch, arbitrary issue, delete, financial valuation or installation-complete endpoint exists. Operation reads provide immutable receipt/supplier/reference, adjustment and transfer audit documents; filter/reference search plus ledger operationId identifies records.

## TypeScript shapes

```ts
type UUID=string;type DecimalString=string;type ISODateTime=string;
type Json=null|string|number|boolean|Json[]|{[k:string]:Json};
type Unit='PCS'|'M'|'SET'|'PAIR'|'KG';
type SerialState='AVAILABLE'|'RESERVED'|'DISPATCHED'|'QUARANTINED'|'RETIRED';
type ReservationStatus='ACTIVE'|'RELEASED'|'CANCELLED'|'DISPATCHED';
type Fulfillment='AVAILABLE'|'PARTIAL'|'UNAVAILABLE';
type AdjustmentAction='OPENING_BALANCE'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT'|'INSPECTION_RELEASE'|'QUARANTINE_DISPOSAL';
type MovementType=AdjustmentAction|'RECEIPT'|'RESERVATION'|'RESERVATION_RELEASE'|'DISPATCH'|'RETURN'|'TRANSFER_IN'|'TRANSFER_OUT';
interface Command{idempotencyKey:string;reference:string;reason:string}
interface VersionCommand extends Command{version:number}
interface WarehouseFields{code:string;name:string;address:string;contactName?:string|null;contactPhone?:string|null;contactEmail?:string|null}
interface WarehouseCreate extends WarehouseFields,Command{}
type WarehousePatch=Partial<Omit<WarehouseFields,'code'>>&VersionCommand&{isActive?:boolean};
interface Warehouse extends WarehouseFields{id:UUID;contactName:string|null;contactPhone:string|null;contactEmail:string|null;isActive:boolean;version:number;createdAt:ISODateTime;updatedAt:ISODateTime}
interface Balance{id:UUID;componentId:UUID;warehouseId:UUID;serializationRequired:boolean;onHandQuantity:DecimalString;reservedQuantity:DecimalString;availableQuantity:DecimalString;quarantinedQuantity:DecimalString;reorderLevel:DecimalString;reorderQuantity:DecimalString|null;version:number;lastMovementAt:ISODateTime|null;createdAt:ISODateTime;updatedAt:ISODateTime}
interface ReorderCommand extends VersionCommand{componentId:UUID;warehouseId:UUID;reorderLevel:DecimalString;reorderQuantity:DecimalString|null}
interface ReceiptCommand extends Command{warehouseId:UUID;componentId:UUID;quantity:DecimalString;receivedAt:ISODateTime;supplierNotes?:string|null;serialNumbers?:string[]}
interface AdjustmentCommand extends Command{warehouseId:UUID;componentId:UUID;quantity:DecimalString;action:AdjustmentAction;serialNumbers?:string[];serialIds?:UUID[]}
interface TransferCommand extends Command{sourceWarehouseId:UUID;destinationWarehouseId:UUID;componentId:UUID;quantity:DecimalString;serialIds?:UUID[]}
interface Movement{id:UUID;operationId:UUID;balanceId:UUID;type:MovementType;quantity:DecimalString;onHandBefore:DecimalString;onHandAfter:DecimalString;reservedBefore:DecimalString;reservedAfter:DecimalString;quarantinedBefore:DecimalString;quarantinedAfter:DecimalString;reservationLineId:UUID|null;dispatchLineId:UUID|null;createdAt:ISODateTime}
interface SerialUnit{id:UUID;serialNumber:string;componentId:UUID;warehouseId:UUID;state:SerialState;receiptOperationId:UUID;receivedAt:ISODateTime;reservationLineId:UUID|null;dispatchLineId:UUID|null;version:number;updatedAt:ISODateTime}
interface SerialEvent{id:UUID;serialUnitId:UUID;operationId:UUID;movementId:UUID;version:number;fromState:SerialState|null;toState:SerialState;fromWarehouseId:UUID|null;toWarehouseId:UUID;reservationLineId:UUID|null;dispatchLineId:UUID|null;createdAt:ISODateTime}
interface ReserveCommand extends Command{configurationId:UUID;approvedVersion:number;reviewId:UUID;bomId:UUID;bomVersion:number;warehouseId:UUID;serialSelections?:{componentId:UUID;serialIds:UUID[]}[]}
interface Reservation{id:UUID;reference:string;configurationId:UUID;bomId:UUID;configurationVersion:number;configurationReviewId:UUID;bomVersion:number;warehouseId:UUID;operationId:UUID;status:ReservationStatus;version:number;createdAt:ISODateTime;updatedAt:ISODateTime}
interface ReservationLine{id:UUID;reservationId:UUID;bomLineId:UUID;componentId:UUID;quantity:DecimalString;serialUnitIds:UUID[]}
interface ReservationDetail extends Reservation{lines:(ReservationLine&{serials:Pick<SerialUnit,'id'|'serialNumber'|'state'>[];dispatchLine?:DispatchLine|null})[];dispatch?:Pick<Dispatch,'id'|'reference'|'status'|'dispatchedAt'>|null;handoffSnapshot?:Json}
interface DispatchCommand extends VersionCommand{reservationId:UUID;dispatchedAt:ISODateTime;notes?:string|null}
interface Dispatch{id:UUID;reference:string;reservationId:UUID;warehouseId:UUID;operationId:UUID;status:'POSTED';dispatchedAt:ISODateTime;notes:string|null;createdAt:ISODateTime}
interface DispatchLine{id:UUID;dispatchId:UUID;reservationLineId:UUID;quantity:DecimalString;returnedQuantity:DecimalString;serialUnitIds:UUID[]}
interface DispatchDetail extends Dispatch{lines:(DispatchLine&{serials:Partial<SerialUnit>[];reservationLine?:{componentId:UUID;bomLineId:UUID;bomLine:{unit:Unit;skuSnapshot:string;descriptionSnapshot:string}}})[];reservation?:Reservation&{configuration:{customerId:UUID;leadId:UUID;siteId:UUID;approvedSurveyId:UUID;approvedSurveyVersion:number;surveyReviewId:UUID}};scope?:'WAREHOUSE_RELEASE_NOT_INSTALLATION_OR_WARRANTY'}
interface ReturnCommand extends Command{dispatchId:UUID;warehouseId:UUID;lines:{dispatchLineId:UUID;quantity:DecimalString;serialIds?:UUID[]}[]}
interface Transfer{id:UUID;operationId:UUID;sourceWarehouseId:UUID;destinationWarehouseId:UUID;componentId:UUID;quantity:DecimalString;createdAt:ISODateTime}
interface Availability{configurationId:UUID;approvedVersion:number;reviewId:UUID;bomId:UUID;bomVersion:number;warehouseId:UUID;fulfillmentStatus:Fulfillment;scope:'WAREHOUSE_AVAILABILITY_NOT_STOCK_RESERVATION';lines:{bomLineId:UUID;componentId:UUID;unit:Unit;requiredQuantity:DecimalString;onHandQuantity:DecimalString;reservedQuantity:DecimalString;availableQuantity:DecimalString;quarantinedQuantity:DecimalString;shortageQuantity:DecimalString;componentActive:boolean;status:Fulfillment}[]}
interface Summary{byUnit:{unit:Unit;onHandQuantity:DecimalString;reservedQuantity:DecimalString;availableQuantity:DecimalString;quarantinedQuantity:DecimalString;balanceCount:number;lowStockCount:number}[];activeWarehouseCount:number;activeReservationCount:number;scope:'QUANTITIES_ONLY_NO_INVENTORY_VALUATION'}
interface OperationSummary{id:UUID;kind:string;reference:string;actorId:UUID;reason:string;createdAt:ISODateTime}
```

Creation reservation results include the internally frozen handoffSnapshot and full currently selected serial records for operators; paged/scoped reservation GET responses deliberately omit that costing/survey snapshot and expose only project allocation details. POST dispatch returns its posted lines/current serial rows without the enriched reservation/BOM labels; GET detail adds the stable integration identities above. Read actual endpoint envelopes instead of assuming all detail expansions appear on every mutation.

## Write validation and retries

Command fields are required on every mutation, **in the JSON body**, not in an Idempotency-Key header. Key/reference max 100 characters; reason max 2000 nonblank. Codes max64 ASCII letters/digits/._-, normalized uppercase; warehouse name max160, address max2000, contact max160/40/254. Version must be a JSON integer 1..2147483646. Quantity strings allow up to 12 integer/3 fractional digits and must be >0 except reorderLevel may be zero. Counted units/serialized parts cannot be fractional. Accumulated balances fit Decimal(18,3); overflow is rejected. Null clears optional nullable contact/notes values; omission retains PATCH contact values.

SerialNumbers are trimmed uppercase, max160 each; serial ID/number arrays max100; reservation selections and return lines max100. Duplicate component selections/serial IDs/return lines are rejected; whole BOM reservations contain every server-derived line. For incoming adjustments use serialNumbers; for outgoing/inspection/disposal use serialIds. Nonserialized components omit serial lists. Receipt receivedAt is actual receipt date and cannot be future. Dispatch date must fall between reservation creation and now.

A global idempotency key is bound to exact parsed body/array ordering, actor and operation kind. Retry the identical body/key after uncertain network results. A different body or actor yields IDEMPOTENCY_CONFLICT. New keys with duplicate (kind,reference) yield DUPLICATE_VALUE. Scope-specific target IDs are part of hashing. Release/cancel/dispatch require the current reservation version. Replayed mutation results are historical posting-time snapshots. UI should refresh GET detail/balances after replay rather than treating them as current.

409 CONCURRENT_UPDATE/DUPLICATE_VALUE can also mean a competing request won. Refresh, then retry the unchanged key/body if resolving an uncertain original outcome. Use a new key/reference only for a deliberately new business operation; never blindly increment references to overcome insufficient stock or duplicate dispatch checks.

## Shape examples (illustrative only)

Nonserialized receiving request; use real IDs, actual receipt date/reference and actual observed quantities:

```json
{"warehouseId":"11111111-1111-4111-8111-111111111111","componentId":"22222222-2222-4222-8222-222222222222","quantity":"12.500","receivedAt":"2026-10-31T08:00:00Z","supplierNotes":"Document reference entered by operator","serialNumbers":[],"idempotencyKey":"unique-receipt-key","reference":"actual-receipt-reference","reason":"Receive verified material"}
```

Response shape (quantities/IDs below illustrate shape, not existing inventory):

```json
{"data":{"operationId":"33333333-3333-4333-8333-333333333333","movement":{"type":"RECEIPT","quantity":"12.5","onHandBefore":"0","onHandAfter":"12.5","reservedBefore":"0","reservedAfter":"0","quarantinedBefore":"0","quarantinedAfter":"0","id":"movement UUID","operationId":"operation UUID","balanceId":"balance UUID","reservationLineId":null,"dispatchLineId":null,"createdAt":"posting timestamp"},"balance":{"id":"balance UUID","componentId":"component UUID","warehouseId":"warehouse UUID","serializationRequired":false,"onHandQuantity":"12.5","reservedQuantity":"0","availableQuantity":"12.5","quarantinedQuantity":"0","reorderLevel":"0","reorderQuantity":null,"version":2,"lastMovementAt":"posting timestamp","createdAt":"timestamp","updatedAt":"timestamp"}}}
```

Full reservation command:

```json
{"configurationId":"configuration UUID","approvedVersion":4,"reviewId":"approval review UUID","bomId":"approved BOM UUID","bomVersion":2,"warehouseId":"warehouse UUID","serialSelections":[{"componentId":"serialized component UUID","serialIds":["available serial UUID"]}],"idempotencyKey":"unique-reservation-key","reference":"actual-reservation-reference","reason":"Allocate exact approved BOM"}
```

Availability shape:

```json
{"data":{"configurationId":"configuration UUID","approvedVersion":4,"reviewId":"approval UUID","bomId":"BOM UUID","bomVersion":2,"warehouseId":"warehouse UUID","fulfillmentStatus":"PARTIAL","scope":"WAREHOUSE_AVAILABILITY_NOT_STOCK_RESERVATION","lines":[{"bomLineId":"line UUID","componentId":"component UUID","unit":"PCS","requiredQuantity":"2","onHandQuantity":"1","reservedQuantity":"0","availableQuantity":"1","quarantinedQuantity":"0","shortageQuantity":"1","componentActive":true,"status":"PARTIAL"}]}}
```

Dispatch command `{reservationId,version,dispatchedAt,notes?,idempotencyKey,reference,reason}` has no client quantity or serial override: it releases the **entire** exact reservation. Return command contains `{dispatchId,warehouseId,lines:[{dispatchLineId,quantity,serialIds}],idempotencyKey,reference,reason}` and always yields quarantine. Return less than a full dispatch is allowed cumulatively; partial reservation/dispatch is not.

Example error: `{"error":{"code":"INSUFFICIENT_STOCK","message":"Available, reserved or quarantined stock is insufficient","requestId":"request UUID"}}`. Other relevant errors: VALIDATION_ERROR(422), NOT_FOUND(404), INVENTORY_FORBIDDEN(403), CSRF_FAILED/ORIGIN_FORBIDDEN(403), WAREHOUSE_INACTIVE/COMPONENT_INACTIVE, WAREHOUSE_OBLIGATIONS, VERSION_CONFLICT, RESERVATION_STATE_CONFLICT, SERIAL_STATE_CONFLICT, PROJECT_ALREADY_ALLOCATED, BOM_VERSION_MISMATCH, CONFIGURATION_NOT_APPROVED/CONFIGURATION_SUPERSEDED/SURVEY_SUPERSEDED/HANDOFF_NOT_ELIGIBLE, EXCESS_RETURN, INVENTORY_CONSTRAINT (409); SERIAL_COUNT_MISMATCH/FRACTIONAL_QUANTITY/INVALID_SERIAL_SELECTION/QUANTITY_OVERFLOW (422). Do not assume a checked UI role replaces authorization.

## Workflow and existing mock differences

1. ADMIN creates real warehouses and maintains the existing M03 catalog; no Product duplicate.
2. Receive/adjust observed stock and real serial numbers. Set reorder thresholds using current balance versions. A zero-stock row may be initialized through PATCH /balances/reorder with version=1; later updates require returned version.
3. Read current approved single-warehouse BOM availability, then select exact serial IDs and reserve the complete BOM. Any shortage rolls back every allocation.
4. Release/cancel the whole active reservation, or dispatch it completely after exact approval recheck. Refresh its version after changes.
5. Accept referenced returns into quarantine. ADMIN may record a separate inspection release/disposal. Neither implies installation or warranty activation.
6. Use dispatch GET detail for M05 handoff; original serial IDs remain stable after returns. Inventory readers use serial detail/history for future M07 traceability.

Existing inventory services use in-memory mock stores/delays, productId/free-text tracking methods, lowercase states, number quantities, storageAreas, purchase costs, arbitrary installation/service/manual issues and draft/submit receipt flows. Backend uses real M03 componentId, global immutable serials, exact approved-BOM reservations, posted operation records, uppercase enums, Decimal strings, strict cookies/CSRF and separate quarantine. These require deliberate frontend adaptation by Abisha; no UI file is edited here. Backend has no automatic purchasing, stock valuation, lot/bin hierarchy, partial dispatch, warranty or installation-complete behavior.
