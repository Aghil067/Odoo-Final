import {getData,getPage,postData,patchData} from '../../../services/apiClient';
import type {Site,SiteFormData} from '../types/site.types';
export interface SiteRecord {
  id:string;
  customerId:string;
  name:string;
  addressLine1:string;
  addressLine2:string|null;
  city:string;
  state:string;
  postalCode:string;
  country:string;
  latitude?:number|string|null;
  longitude?:number|string|null;
  version:number;
  createdAt:string;
  updatedAt:string;
}
function map(r:SiteRecord):Site{
  return {
    id:r.id,
    customerId:r.customerId,
    siteName:r.name,
    addressLine1:r.addressLine1,
    addressLine2:r.addressLine2??undefined,
    city:r.city,
    state:r.state,
    pinCode:r.postalCode,
    country:r.country,
    latitude:r.latitude!==null&&r.latitude!==undefined?Number(r.latitude):null,
    longitude:r.longitude!==null&&r.longitude!==undefined?Number(r.longitude):null,
    propertyType:null,
    contactPersonOnSite:'Not recorded separately',
    contactPhoneOnSite:'Use customer contact',
    createdAt:r.createdAt,
    updatedAt:r.updatedAt,
    version:r.version
  };
}
export const siteService={
 async list(customerId:string,query:{q?:string;page?:number;pageSize?:number}={}){const r=await getPage<SiteRecord>(`/customers/${customerId}/sites`,query);return {...r,data:r.data.map(map)};},
 async getByCustomerId(customerId:string):Promise<Site[]>{return (await getPage<SiteRecord>(`/customers/${customerId}/sites`,{pageSize:100})).data.map(map);},
 async getById(id:string){return map(await getData<SiteRecord>(`/sites/${id}`));},
 async create(data:SiteFormData){
   return map(await postData<SiteRecord>(`/customers/${data.customerId}/sites`,{
     name:data.siteName,
     addressLine1:data.addressLine1,
     addressLine2:data.addressLine2||null,
     city:data.city,
     state:data.state,
     postalCode:data.pinCode,
     country:data.country==='India'?'IN':data.country??'IN',
     ...(data.latitude!==undefined?{latitude:data.latitude}:null),
     ...(data.longitude!==undefined?{longitude:data.longitude}:null)
   }));
 },
 async update(id:string,version:number,data:Partial<SiteFormData>){
   const payload:Record<string,unknown>={version};
   if(data.siteName!==undefined)payload.name=data.siteName;
   if(data.addressLine1!==undefined)payload.addressLine1=data.addressLine1;
   if(data.addressLine2!==undefined)payload.addressLine2=data.addressLine2||null;
   if(data.city!==undefined)payload.city=data.city;
   if(data.state!==undefined)payload.state=data.state;
   if(data.pinCode!==undefined)payload.postalCode=data.pinCode;
   if(data.country!==undefined)payload.country=data.country==='India'?'IN':data.country;
   if(data.latitude!==undefined)payload.latitude=data.latitude;
   if(data.longitude!==undefined)payload.longitude=data.longitude;
   return map(await patchData<SiteRecord>(`/sites/${id}`,payload));
 }
};
