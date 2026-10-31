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
