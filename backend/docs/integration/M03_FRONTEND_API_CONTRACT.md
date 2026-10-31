# M03 frontend API contract

Backend-only implementation under `/api/solar`. Existing React configuration/inventory screens are preserved, not wired to real services here. Examples are shape illustrations, not seeds, product specifications or engineering recommendations. Replace IDs with real API UUIDs and all technical facts with actual manufacturer/designer data.

M03 depends on M02 PR #2 and must follow its merge/migration. Reuse login/me/logout, HttpOnly cookie (`credentials:'include'` / `withCredentials:true`), trusted Origin and X-CSRF-Token for POST/PATCH/PUT. JSON writes only, max 32 KiB. Existing `{data:...}` success, `{data:[],pagination:{page,pageSize,totalItems,totalPages}}` lists and `{error:{code,message,details?,requestId}}` errors are unchanged. Defaults: page=1/pageSize=20; maximum pageSize=100. Unknown fields are rejected. Omission retains PATCH values; null clears nullable fields only. Decimal outputs may omit trailing zeros.

## Types and enums

```ts
type UUID=string;
type DecimalString=string;
type ISODateTime=string;
type SystemType='ON_GRID'|'OFF_GRID';
type Unit='PCS'|'M'|'SET'|'PAIR'|'KG';
type Currency='INR'|'USD'|'EUR'|'GBP';
type Category='SOLAR_PANEL'|'INVERTER'|'BATTERY'|'CHARGE_CONTROLLER'|'MOUNTING_STRUCTURE'|'DC_CABLE'|'AC_CABLE'|'CONNECTOR'|'COMBINER_BOX'|'ISOLATOR'|'SURGE_PROTECTION'|'EARTHING'|'OTHER';
type Status='DRAFT'|'READY_FOR_REVIEW'|'REVISION_REQUIRED'|'APPROVED'|'REJECTED'|'ARCHIVED';
type Phase='SINGLE_PHASE'|'THREE_PHASE';
type Decision='APPROVED'|'REVISION_REQUIRED'|'REJECTED';
type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
interface Policy {
 capacityTolerancePercent:DecimalString;minDcAcRatio:DecimalString;maxDcAcRatio:DecimalString;
 voltageHeadroomPercent:DecimalString;batteryRequired:boolean;
 requiredCategories:Category[];pvInputMode:'INVERTER'|'EXTERNAL_CONTROLLER';basis:string;
}
interface PVInputSpecs {
 mpptInputs?:number;maxDcVoltageV?:DecimalString;minMpptVoltageV?:DecimalString;maxMpptVoltageV?:DecimalString;
 maxInputCurrentPerMpptA?:DecimalString;maxIscPerMpptA?:DecimalString;
}
interface BatteryInputSpecs {
 batteryVoltageMinV?:DecimalString;batteryVoltageMaxV?:DecimalString;supportedBatteryChemistries?:string[];
}
interface PanelSpecs {ratedPowerW?:DecimalString;vmpV?:DecimalString;vocV?:DecimalString;impA?:DecimalString;iscA?:DecimalString;efficiencyPercent?:DecimalString}
interface InverterSpecs extends PVInputSpecs,BatteryInputSpecs {
 ratedAcPowerKw?:DecimalString;maxPvPowerW?:DecimalString;supportedSystemTypes?:SystemType[];phase?:Phase;
 integratedChargeController?:boolean;maxChargeCurrentA?:DecimalString;efficiencyPercent?:DecimalString;
 batterylessSupported?:boolean;externalControllerSupported?:boolean;
}
interface BatterySpecs {nominalVoltageV?:DecimalString;minimumOperatingVoltageV?:DecimalString;maximumChargeVoltageV?:DecimalString;capacityAh?:DecimalString;nominalEnergyKwh?:DecimalString;chemistry?:string;maxChargeCurrentA?:DecimalString;maxDischargeCurrentA?:DecimalString}
interface ControllerSpecs extends PVInputSpecs,BatteryInputSpecs {maxPvPowerW?:DecimalString;maxChargeCurrentA?:DecimalString}
type Specifications=PanelSpecs|InverterSpecs|BatterySpecs|ControllerSpecs|{notes?:string};
interface Component {
 id:UUID;sku:string;name:string;category:Category;manufacturer:string|null;modelNumber:string|null;
 description:string|null;specifications:Specifications;specificationSource:string|null;unit:Unit;
 unitCost:DecimalString;currency:Currency;warrantyMonths:number|null;serializationRequired:boolean;
 lastChangeReason:string;isActive:boolean;version:number;createdById:UUID;createdAt:ISODateTime;updatedAt:ISODateTime;
}
interface TemplateLine {
 id:UUID;templateId:UUID;componentId:UUID;defaultQuantity:DecimalString;unit:Unit;required:boolean;
 notes:string|null;position:number;createdAt:ISODateTime;updatedAt:ISODateTime;
}
interface Template {
 id:UUID;code:string;name:string;description:string|null;systemType:SystemType;nominalCapacityKw:DecimalString;
 minimumCapacityKw:DecimalString;maximumCapacityKw:DecimalString;validationPolicy:Policy;isActive:boolean;
 version:number;createdById:UUID;createdAt:ISODateTime;updatedAt:ISODateTime;
}
interface TemplateDetail extends Template {components:(TemplateLine&{component:Component})[]}
interface TemplateRevision {id:UUID;templateId:UUID;version:number;actorId:UUID;snapshot:TemplateDetail;reason:string;createdAt:ISODateTime}
interface ArrayDesign {
 panelComponentId:UUID;deviceComponentId:UUID;deviceUnit:number;mpptInput:number;seriesPanels:number;parallelStrings:number;
 coldVocPerPanelV:DecimalString;hotVmpPerPanelV:DecimalString;maximumVmpPerPanelV:DecimalString;
 operatingCurrentPerStringA:DecimalString;shortCircuitCurrentPerStringA:DecimalString;basis:string;
}
interface ElectricalDesign {arrays:ArrayDesign[];batteryBank:{componentId:UUID;seriesUnits:number;parallelStrings:number}|null}
interface Finding {severity:'BLOCKER'|'WARNING'|'CONDITION';code:string;message:string;componentId?:UUID}
interface Calculations {
 totalPanelDcCapacityKw:DecimalString|null;totalInverterAcCapacityKw:DecimalString|null;dcAcRatio:DecimalString|null;
 batteryNominalEnergyKwh:DecimalString|null;totalEstimatedMaterialCost:DecimalString;
 categoryCosts:{category:Category;total:DecimalString}[];
 differenceFromTargetKw:DecimalString|null;differenceFromRecommendedKw:DecimalString|null;differenceFromRequestedKw:DecimalString|null;
}
interface ValidationReport {
 findings:Finding[];blockingErrors:number;warnings:number;conditionalRequirements:number;
 calculations:Calculations;policy:Policy;scope:'PRELIMINARY_COMPONENT_COMPATIBILITY_NOT_CERTIFICATION';
}
interface Configuration {
 id:UUID;reference:string;name:string;seriesId:UUID;revisionNumber:number;previousConfigurationId:UUID|null;
 leadId:UUID;siteId:UUID;customerId:UUID;approvedSurveyId:UUID;approvedSurveyVersion:number;surveyReviewId:UUID;
 surveySnapshot:Json;templateId:UUID|null;templateVersion:number|null;templateSnapshot:TemplateDetail|null;
 systemType:SystemType;outputPhase:Phase;targetCapacityKw:DecimalString;
 calculatedDcCapacityKw:DecimalString|null;inverterAcCapacityKw:DecimalString|null;batteryNominalEnergyKwh:DecimalString|null;
 status:Status;technicalAssumptions:string;conditionalWorkRequirements:string|null;
 validationPolicy:Policy;electricalDesign:ElectricalDesign;validationReport:ValidationReport;
 createdById:UUID;reviewerId:UUID|null;approvedVersion:number|null;version:number;createdAt:ISODateTime;updatedAt:ISODateTime;
}
interface BOMLine {
 id:UUID;bomId:UUID;componentId:UUID;componentVersion:number;skuSnapshot:string;descriptionSnapshot:string;
 componentSnapshot:Component;category:Category;quantity:DecimalString;unit:Unit;unitCostSnapshot:DecimalString;
 currency:Currency;lineTotal:DecimalString;technicalNotes:string|null;position:number;createdAt:ISODateTime;
}
interface BOM {
 id:UUID;reference:string;configurationId:UUID;version:number;status:Status;
 totalEstimatedMaterialCost:DecimalString;currency:Currency;createdAt:ISODateTime;updatedAt:ISODateTime;lines:BOMLine[];
}
interface Detail extends Configuration {bom:BOM|null;nextRevision:{id:UUID;reference:string;revisionNumber:number;status:Status}|null}
interface CompositionResult {configuration:Configuration;bom:BOM;validation:ValidationReport}
interface Checklist {compatibilityReviewed:boolean;costingReviewed:boolean;assumptionsReviewed:boolean;surveyConditionsAcknowledged:boolean;designLimitationsAcknowledged:boolean}
interface Review {
 id:UUID;configurationId:UUID;reviewerId:UUID;decision:Decision;configurationVersion:number;notes:string;
 checklist:Checklist|Record<string,never>;snapshot:Omit<Detail,'nextRevision'>;createdAt:ISODateTime;
}
interface History {id:UUID;configurationId:UUID;actorId:UUID;event:string;fromStatus:Status|null;toStatus:Status;version:number;reason:string;details:Json;createdAt:ISODateTime}
```

Review.snapshot has configuration fields plus BOM, with the fresh review-time validation report; it does not include nextRevision. surveySnapshot is the immutable full M02 approved-handoff object and contains original conditions/assumptions and reviewed visit data; do not replace it with a frontend assertion of approval.

## Endpoints

All paths below follow `/api/solar`. GETs require ADMIN/TECHNICIAN/SALES; configuration/BOM reads additionally enforce record scope. ADMIN sees all, TECHNICIAN sees configurations whose survey is assigned to self, SALES follows M01 leadScope. Other backend roles are denied. Catalog/template writes are ADMIN-only. Configuration design writes are ADMIN or scoped TECHNICIAN. Review requires an independent ADMIN.

| Method/path | Input | Success data |
|---|---|---|
| POST `/components` | Component creation fields | Component, 201 |
| GET `/components` | page/pageSize,q?,category?,active=true\|false | Component[] + pagination |
| GET `/components/:id` | UUID | Component |
| PATCH `/components/:id` | version,reason,editable fields | Component |
| POST `/components/:id/archive` | version,reason | Inactive Component |
| POST `/templates` | Template creation fields + component lines | TemplateDetail, 201 |
| GET `/templates` | page/pageSize,q?,systemType?,active=true\|false | Template[] + pagination |
| GET `/templates/:id` | UUID | TemplateDetail |
| PATCH `/templates/:id` | version,reason,editable fields/optional full components array | TemplateDetail |
| POST `/templates/:id/archive` | version,reason | Inactive TemplateDetail with new version snapshot |
| GET `/templates/:id/versions/:revision` | template version | TemplateRevision |
| POST `/configurations` | creation body below | CompositionResult, 201 |
| GET `/configurations` | page/pageSize,q?,status?,leadId?,siteId?,approvedSurveyId? | Configuration[] + pagination |
| GET `/configurations/:id` | UUID | Detail |
| PATCH `/configurations/:id` | version,reason + allowed draft fields | Configuration |
| POST `/configurations/:id/revisions` | creation body without previousConfigurationId | CompositionResult, 201; new configuration ID |
| PUT `/configurations/:id/bom` | version,reason,lines[] | CompositionResult |
| POST `/configurations/:id/bom/generate` | version,reason | CompositionResult; explicit current-catalog refresh |
| GET `/configurations/:id/bom` | none | BOM |
| GET `/configurations/:id/calculations` | none | Fresh ValidationReport; does not persist/update prices |
| POST `/configurations/:id/validate` | version,reason | `{configuration,validation}`; increments configuration version |
| POST `/configurations/:id/submit` | version,reason | Configuration at READY_FOR_REVIEW |
| POST `/configurations/:id/review` | version,decision,notes,checklist? | `{configuration,review}` |
| POST `/configurations/:id/archive` | version,reason | Unapproved Configuration at ARCHIVED |
| GET `/configurations/:id/history` | paging | History[] + pagination |
| GET `/configurations/:id/reviews` | paging | Review[] + pagination |
| GET `/configurations/:id/approved` | none | Guarded approved configuration/BOM/snapshot reference |

All successes are 200 except creation. Lists default newest createdAt then ID descending; history orders version descending. Template/BOM lines sort position ascending. Empty lists are `[]` with zero totals/pages. No DELETE or stock/warehouse endpoint exists. Archive never changes an approved configuration; create a new revision instead. Reactivation of catalog/template is explicit PATCH `isActive:true` with version/reason.

## Input rules

Component create: sku,name,category,specifications,unit,unitCost,currency required; manufacturer/modelNumber/description/specificationSource/warrantyMonths optional nullable; serializationRequired defaults false as a catalog business policy. SKU is ASCII alphanumeric with `_ . -`, <=64, uppercased; name <=160; description/source/reason <=2000; model/manufacturer <=160. SKU/category/unit are immutable. PATCH editable fields exclude those three and require at least one field besides version/reason. No missing default silently resets serializationRequired on PATCH. Last change reason is retained; no full catalog edit-history API is claimed.

Specifications are strict and category-specific using the interfaces above; accessories use only `{notes?:string}`. Missing critical fields are allowed in catalog/drafts but block approval. All numerical spec fields use positive canonical decimal strings (max four fractional digits); phase/boolean/count/list fields use their stated types. Source reference is required before power-component approval, not fabricated by the API. MPPT count is 1..32; bounds and pair-order constraints are listed in technical documentation. No automatic manufacturer lookup occurs.

Template create: code,name,systemType,nominal/minimum/maximumCapacityKw,validationPolicy,components required; description optional nullable. Components are 1..100 `{componentId,defaultQuantity,unit,required,position,notes?}`. No duplicate component/position; default quantity positive and uses catalog unit. min<=nominal<=max. PATCH may replace the full components array and/or metadata/policy; code is immutable. Active templates can still become stale when a catalog item changes; configuration generation checks current catalog state.

Configuration create: name,approvedSurveyId,approvedSurveyVersion,surveyReviewId,systemType,outputPhase,targetCapacityKw,currency,technicalAssumptions,reason required. Optional templateId/templateVersion must occur together and match a current active template compatible with system/range. validationPolicy is required for custom designs, otherwise may inherit the template policy. electricalDesign defaults to `{arrays:[],batteryBank:null}`, which is an unverified draft, not an approvable wiring plan. Optional conditionalWorkRequirements is supplemental; original M02 conditions remain immutable. Optional previousConfigurationId identifies a new revision; `/revisions` supplies it from the URL.

Draft PATCH allows only name,targetCapacityKw,technicalAssumptions,conditionalWorkRequirements,validationPolicy,electricalDesign. It cannot change identities, selected template, currency, system type or phase; select those correctly in a new revision. All writes use current `version`; read or save responses replace the frontend's cached version. Review version N becomes approvedVersion N and final configuration.version N+1. BOM.version increments on composition/price regeneration, not parent status changes.

Quantities are positive decimal strings with <=3 fractional digits and <=9 integer digits. PCS/SET/PAIR are whole counts; power devices require PCS and <=1,000,000 per line. Unit cost is a nonnegative decimal string with <=14 integer and <=4 fractional digits. A BOM is one currency; mixed currencies fail with no FX conversion. Material totals round each line to two decimals and sum; no tax/labor/quotation pricing is added. BOM PUT accepts only `{componentId,componentVersion,quantity,unit,technicalNotes?}` per line (max 100); client prices/totals/SKU/specifications/category are rejected.

Policy is explicit and snapshotted: capacityTolerancePercent 0..100; positive minDcAcRatio<=maxDcAcRatio; voltageHeadroomPercent 0..<100; requiredCategories nonempty unique; batteryRequired and pvInputMode explicit; basis required. These are authorized designer choices, not default engineering recommendations. ON_GRID phase is checked against the approved survey. Selected system type must match the approved survey recommendation. Template requirements/range remain attached to that revision.

Array design identifies one panel SKU, receiving device SKU/unit/MPPT, positive series/parallel counts and sourced design bounds. Each panel must be allocated exactly once; each receiving unit needs an allocation; duplicate/mixed allocations on one MPPT are unsupported. BatteryBank is null or one component with integer series/parallel topology; mixed battery SKUs are unsupported. Unknown compatibility is a BLOCKER, not a successful check. Null capacity/ratio/energy outputs mean unknown or not applicable; never display an incomplete result as approved equipment capacity.

## Example flow (documentation only)

1. ADMIN creates real catalog entries from manufacturer data. For an unknown panel definition, the request shape is:

```json
{"sku":"PANEL-DEFINITION","name":"Operator-entered panel definition","category":"SOLAR_PANEL","manufacturer":null,"modelNumber":null,"specifications":{},"specificationSource":null,"unit":"PCS","unitCost":"0","currency":"INR"}
```

This intentionally has unverified specs and an operator-selected illustrative cost: it is not a real product recommendation and cannot pass configuration approval. Response is `{data:Component}` with generated UUID, active=true, version=1, nullable unknown metadata, default serializationRequired=false, lastChangeReason="Catalog created", server timestamps/creator. Replace all unknowns/costs with actual data before real use.

2. A template may be created with real component UUIDs and an explicit policy. Example policy *shape* (values require designer justification, not universal recommendations):

```json
{"capacityTolerancePercent":"5","minDcAcRatio":"0.8","maxDcAcRatio":"1.4","voltageHeadroomPercent":"5","batteryRequired":false,"requiredCategories":["SOLAR_PANEL","INVERTER","MOUNTING_STRUCTURE"],"pvInputMode":"INVERTER","basis":"Replace with the documented rationale and applicable manufacturer/design guidance."}
```

3. GET `/api/surveys/:id/approved`, then POST `/api/solar/configurations` with exact returned references:

```json
{
 "name":"Customer-specific preliminary proposal",
 "approvedSurveyId":"11111111-1111-4111-8111-111111111111","approvedSurveyVersion":11,"surveyReviewId":"22222222-2222-4222-8222-222222222222",
 "templateId":"33333333-3333-4333-8333-333333333333","templateVersion":1,
 "systemType":"ON_GRID","outputPhase":"SINGLE_PHASE","targetCapacityKw":"3","currency":"INR",
 "technicalAssumptions":"Record the actual design basis; further engineering and utility permissions remain separate.",
 "conditionalWorkRequirements":null,"reason":"Prepare a proposed system from the internally approved survey."
}
```

Response is `{data:{configuration,bom,validation}}`, with configuration.status=DRAFT, configuration.version=1, revisionNumber=1, BOM.version=1, server line snapshots/totals and real findings. Initial template quantities are copied without scaling and all optional lines are included initially. Custom/no-template designs start with an empty BOM and blocking findings until populated. This operation inserts no default products/templates and never modifies survey approval.

4. PUT `/configurations/:id/bom` with current configuration.version and actual catalog component versions:

```json
{"version":1,"reason":"Select actual equipment quantities.","lines":[{"componentId":"44444444-4444-4444-8444-444444444444","componentVersion":1,"quantity":"6","unit":"PCS","technicalNotes":"Actual module allocation is recorded separately in electricalDesign."},{"componentId":"55555555-5555-4555-8555-555555555555","componentVersion":1,"quantity":"1","unit":"PCS"}]}
```

Response is CompositionResult with incremented configuration/BOM versions. Required template lines still apply, so this illustrative two-line body may intentionally report missing-required findings for a template with more required materials. No cost or capacity is inferred from these placeholder IDs. Complete the actual component quantities, phase and electricalDesign through PATCH. To deliberately refresh prices/specifications later use POST `/bom/generate` with `{version,reason}`; it never runs on an approved BOM.

5. GET `/calculations` or POST `/validate` to inspect findings. BLOCKER count must be zero to submit. Read-time calculations can reflect a later inactive/stale catalog without modifying historical BOM prices; stored review snapshots remain historical.

6. POST `/submit` with `{version,reason}` → READY_FOR_REVIEW. Another ADMIN who did not create/edit this revision POSTs `/review`:

```json
{"version":8,"decision":"APPROVED","notes":"Internal configuration review completed with all recorded survey/design conditions retained.","checklist":{"compatibilityReviewed":true,"costingReviewed":true,"assumptionsReviewed":true,"surveyConditionsAcknowledged":true,"designLimitationsAcknowledged":true}}
```

Actual version must come from the current record. Approval requires all five checklist values true and no current blocker. Response `{data:{configuration,review}}` saves the full reviewed snapshot; approvedVersion=review.configurationVersion=N while final configuration.version=N+1. The actual review snapshot type is `Omit<Detail,'nextRevision'>`. REVISION_REQUIRED/REJECTED use the same request schema with nonempty notes; their checklist may be omitted. Previous snapshots cannot be overwritten.

7. GET `/approved` returns `{configurationId,reference,revisionNumber,approvedVersion,reviewId,approvedSurveyId,approvedSurveyVersion,surveyReviewId,surveyConditions,conditionalWorkRequirements,configuration,bom,approvalSnapshot,scope}`. Scope is INTERNAL_PRELIMINARY_CONFIGURATION_NOT_REGULATORY_CERTIFICATION. This rejects superseded/unapproved/ineligible records; it does not reserve stock. A new `/revisions` request requires current eligible survey references and fresh design inputs, yields a new UUID/series revision/version 1, and preserves the prior approved row/BOM.

## Frontend integration differences

Existing main's services use mock arrays, lowercase/different categories/statuses, free-text specifications/units, JavaScript numeric costs and `ready_for_quotation`. They are not equivalent to this approved/reviewed lifecycle. Adapt services/types deliberately: UUIDs, uppercase categories, exact enum units, structured/sourced specs, Decimal strings, versioned writes, real M02 handoff and server findings. Do not blindly uppercase/map state strings, treat client structural booleans as certification, trust client totals or connect M04 mock stock values to BOM quantities. No frontend code was changed by this backend work.

422: invalid input/unit/currency/missing required data or CONFIGURATION_BLOCKED; 409: stale version/template/catalog, immutable status, superseded/incorrect survey/review or SQL conflict; 403: role/self-review; scoped missing IDs 404. Fetch calculations for full blocking detail. Refresh after 409 and let the user decide; do not blindly retry unknown-outcome creations. No idempotency-key promise is implemented.
