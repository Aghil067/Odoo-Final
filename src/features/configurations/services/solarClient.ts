import {getData,getPage,postData,patchData} from '../../../services/apiClient';
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
