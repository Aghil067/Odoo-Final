import {apiClient,getData,getPage,postData,patchData} from '../../../services/apiClient';
export const componentCategories=['SOLAR_PANEL','INVERTER','BATTERY','CHARGE_CONTROLLER','MOUNTING_STRUCTURE','DC_CABLE','AC_CABLE','CONNECTOR','COMBINER_BOX','ISOLATOR','SURGE_PROTECTION','EARTHING','OTHER'] as const;
export type ComponentCategory=typeof componentCategories[number];
export type Specifications=Record<string,string|number|boolean|string[]>;
export interface CatalogComponent {id:string;version:number;sku:string;name:string;category:ComponentCategory;manufacturer:string|null;modelNumber:string|null;description:string|null;specifications:Specifications;specificationSource:string|null;unit:'PCS'|'M'|'SET'|'PAIR'|'KG';unitCost:string;currency:string;warrantyMonths:number|null;serializationRequired:boolean;isActive:boolean;createdAt:string;updatedAt:string}
export interface CatalogWrite {sku:string;name:string;category:ComponentCategory;manufacturer:string|null;modelNumber:string|null;description:string|null;specifications:Specifications;specificationSource:string|null;unit:CatalogComponent['unit'];unitCost:string;currency:string;warrantyMonths:number|null;serializationRequired:boolean}
export const solarCatalog={
 list:(filters:{q?:string;category?:string;active?:'true'|'false';page?:number;pageSize?:number}={})=>getPage<CatalogComponent>('/solar/components',filters),
 get:(id:string)=>getData<CatalogComponent>(`/solar/components/${id}`),
 create:(data:CatalogWrite)=>postData<CatalogComponent>('/solar/components',data),
 update:(id:string,version:number,data:Omit<CatalogWrite,'sku'|'category'|'unit'>,reason:string)=>patchData<CatalogComponent>(`/solar/components/${id}`,{...data,version,reason}),
 setActive:(component:CatalogComponent,isActive:boolean,reason:string)=>patchData<CatalogComponent>(`/solar/components/${component.id}`,{version:component.version,isActive,reason})
};
export interface DesignPolicy {capacityTolerancePercent:string;minDcAcRatio:string;maxDcAcRatio:string;voltageHeadroomPercent:string;batteryRequired:boolean;requiredCategories:ComponentCategory[];pvInputMode:'INVERTER'|'EXTERNAL_CONTROLLER';basis:string}
export interface TemplateLineInput {componentId:string;defaultQuantity:string;unit:CatalogComponent['unit'];required:boolean;notes:string|null;position:number}
export interface TemplateWrite {code:string;name:string;description:string|null;systemType:'ON_GRID'|'OFF_GRID';nominalCapacityKw:string;minimumCapacityKw:string;maximumCapacityKw:string;validationPolicy:DesignPolicy;components:TemplateLineInput[]}
export interface TemplateRecord extends Omit<TemplateWrite,'components'> {id:string;version:number;isActive:boolean;createdAt:string;updatedAt:string;components?: (TemplateLineInput&{id:string;component:CatalogComponent})[]}
export const solarTemplates={
 list:(filters:{q?:string;systemType?:string;active?:'true'|'false';page?:number;pageSize?:number}={})=>getPage<TemplateRecord>('/solar/templates',filters),
 get:(id:string)=>getData<TemplateRecord>(`/solar/templates/${id}`),
 create:(data:TemplateWrite)=>postData<TemplateRecord>('/solar/templates',data),
 update:(template:TemplateRecord,data:Omit<TemplateWrite,'code'>,reason:string)=>patchData<TemplateRecord>(`/solar/templates/${template.id}`,{...data,version:template.version,reason}),
 setActive:(template:TemplateRecord,isActive:boolean,reason:string)=>patchData<TemplateRecord>(`/solar/templates/${template.id}`,{isActive,version:template.version,reason}),
 revision:(id:string,version:number)=>getData<{id:string;version:number;snapshot:TemplateRecord;reason:string;createdAt:string}>(`/solar/templates/${id}/versions/${version}`)
};
export interface SurveyApproval {surveyId:string;leadId:string;siteId:string;customerId:string;reference:string;approvedVersion:number;reviewId:string;recommendedCapacityKw:string|null;recommendedSystemType:'ON_GRID'|'OFF_GRID'|'UNDECIDED';additionalWorkRequired:string|null;technicalAssumptions:string|null;suitability:string;snapshot:{customer:{name:string;phone:string};site:{name:string;addressLine1:string;city:string}}}
export interface PVArray {panelComponentId:string;deviceComponentId:string;deviceUnit:number;mpptInput:number;seriesPanels:number;parallelStrings:number;coldVocPerPanelV:string;hotVmpPerPanelV:string;maximumVmpPerPanelV:string;operatingCurrentPerStringA:string;shortCircuitCurrentPerStringA:string;basis:string}
export interface ElectricalDesign {arrays:PVArray[];batteryBank:{componentId:string;seriesUnits:number;parallelStrings:number}|null}
export interface ValidationReport {blockingErrors:number;warnings:number;conditionalRequirements:number;findings:{severity:'BLOCKER'|'WARNING'|'CONDITION';code:string;message:string;componentId?:string}[];calculations:{totalPanelDcCapacityKw:string|null;totalInverterAcCapacityKw:string|null;dcAcRatio:string|null;batteryNominalEnergyKwh:string|null;totalEstimatedMaterialCost:string;categoryCosts:{category:ComponentCategory;total:string}[]};scope:string}
export interface BOMRecord {id:string;reference:string;version:number;currency:string;totalEstimatedMaterialCost:string;status:string;lines:{id:string;componentId:string;componentVersion:number;skuSnapshot:string;descriptionSnapshot:string;componentSnapshot:CatalogComponent;category:ComponentCategory;quantity:string;unit:CatalogComponent['unit'];unitCostSnapshot:string;currency:string;lineTotal:string;technicalNotes:string|null;position:number}[]}
export const configurationStates=['DRAFT','READY_FOR_REVIEW','REVISION_REQUIRED','APPROVED','REJECTED','ARCHIVED'] as const;
export interface ConfigurationRecord {id:string;reference:string;name:string;version:number;revisionNumber:number;status:typeof configurationStates[number];customerId:string;siteId:string;leadId:string;approvedSurveyId:string;approvedSurveyVersion:number;surveyReviewId:string;surveySnapshot:SurveyApproval;templateId:string|null;templateVersion:number|null;systemType:'ON_GRID'|'OFF_GRID';outputPhase:'SINGLE_PHASE'|'THREE_PHASE';targetCapacityKw:string;technicalAssumptions:string;conditionalWorkRequirements:string|null;validationPolicy:DesignPolicy;electricalDesign:ElectricalDesign;validationReport:ValidationReport;calculatedDcCapacityKw:string|null;inverterAcCapacityKw:string|null;batteryNominalEnergyKwh:string|null;approvedVersion:number|null;createdById:string;createdAt:string;updatedAt:string;bom?:BOMRecord;nextRevision?:{id:string;reference:string;revisionNumber:number;status:string}|null}
export interface ConfigurationWrite {name:string;approvedSurveyId:string;approvedSurveyVersion:number;surveyReviewId:string;templateId?:string;templateVersion?:number;systemType:'ON_GRID'|'OFF_GRID';outputPhase:'SINGLE_PHASE'|'THREE_PHASE';targetCapacityKw:string;currency:string;technicalAssumptions:string;conditionalWorkRequirements:string|null;validationPolicy?:DesignPolicy;electricalDesign?:ElectricalDesign;reason:string}
export const solarConfigurations={
 list:(filters:{q?:string;status?:string;leadId?:string;approvedSurveyId?:string;page?:number;pageSize?:number}={})=>getPage<ConfigurationRecord>('/solar/configurations',filters),
 get:(id:string)=>getData<ConfigurationRecord>(`/solar/configurations/${id}`),
 approvedSurvey:(id:string)=>getData<SurveyApproval>(`/surveys/${id}/approved`),
 create:(data:ConfigurationWrite)=>postData<{configuration:ConfigurationRecord;bom:BOMRecord;validation:ValidationReport}>('/solar/configurations',data),
 revise:(id:string,data:ConfigurationWrite)=>postData<{configuration:ConfigurationRecord;bom:BOMRecord;validation:ValidationReport}>(`/solar/configurations/${id}/revisions`,data),
 update:(id:string,version:number,data:{name?:string;targetCapacityKw?:string;technicalAssumptions?:string;conditionalWorkRequirements?:string|null;validationPolicy?:DesignPolicy;electricalDesign?:ElectricalDesign;reason:string})=>patchData<ConfigurationRecord>(`/solar/configurations/${id}`,{version,...data}),
 calculations:(id:string)=>getData<ValidationReport>(`/solar/configurations/${id}/calculations`),
 async bom(id:string,version:number,reason:string,lines:{componentId:string;componentVersion:number;quantity:string;unit:string;technicalNotes:string|null}[]){return (await apiClient.put<{data:{configuration:ConfigurationRecord;bom:BOMRecord;validation:ValidationReport}}>(`/solar/configurations/${id}/bom`,{version,reason,lines})).data.data;},
 command:(id:string,action:'bom/generate'|'validate'|'submit'|'archive',version:number,reason:string)=>postData(`/solar/configurations/${id}/${action}`,{version,reason}),
 review:(id:string,version:number,decision:string,notes:string,checklist:Record<string,boolean>)=>postData(`/solar/configurations/${id}/review`,{version,decision,notes,checklist}),
 history:(id:string,page=1)=>getPage<{id:string;event:string;fromStatus:string|null;toStatus:string;reason:string;version:number;createdAt:string}>(`/solar/configurations/${id}/history`,{page,pageSize:20}),
 approved:(id:string)=>getData<{configurationId:string;approvedVersion:number;reviewId:string;configuration:ConfigurationRecord;bom:BOMRecord}>(`/solar/configurations/${id}/approved`)
};
