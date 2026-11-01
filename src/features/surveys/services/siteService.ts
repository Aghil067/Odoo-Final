import {getData,getPage,postData,patchData} from '../../../services/apiClient';
import type {Site,SiteFormData} from '../types/site.types';
export interface SiteRecord {id:string;customerId:string;name:string;addressLine1:string;addressLine2:string|null;city:string;state:string;postalCode:string;country:string;version:number;createdAt:string;updatedAt:string}
function map(r:SiteRecord):Site{return {id:r.id,customerId:r.customerId,siteName:r.name,addressLine1:r.addressLine1,addressLine2:r.addressLine2??undefined,city:r.city,state:r.state,pinCode:r.postalCode,country:r.country,propertyType:null,contactPersonOnSite:'Not recorded separately',contactPhoneOnSite:'Use customer contact',createdAt:r.createdAt,updatedAt:r.updatedAt,version:r.version};}
export const siteService={
 async list(customerId:string,query:{q?:string;page?:number;pageSize?:number}={}){const r=await getPage<SiteRecord>(`/customers/${customerId}/sites`,query);return {...r,data:r.data.map(map)};},
 async getByCustomerId(customerId:string):Promise<Site[]>{return (await getPage<SiteRecord>(`/customers/${customerId}/sites`,{pageSize:100})).data.map(map);},
 async getById(id:string){return map(await getData<SiteRecord>(`/sites/${id}`));},
 async create(data:SiteFormData){return map(await postData<SiteRecord>(`/customers/${data.customerId}/sites`,{name:data.siteName,addressLine1:data.addressLine1,addressLine2:data.addressLine2||null,city:data.city,state:data.state,postalCode:data.pinCode,country:data.country==='India'?'IN':data.country??'IN'}));},
 async update(id:string,version:number,data:Omit<SiteFormData,'customerId'>){return map(await patchData<SiteRecord>(`/sites/${id}`,{version,name:data.siteName,addressLine1:data.addressLine1,addressLine2:data.addressLine2||null,city:data.city,state:data.state,postalCode:data.pinCode,country:data.country==='India'?'IN':data.country??'IN'}));}
};
