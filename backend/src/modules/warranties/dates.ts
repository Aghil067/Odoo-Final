import {ApiError} from '../../lib/http.js';
import type {WarrantyDurationUnit} from '@prisma/client';
export const civil=(value:string|Date)=>new Date((typeof value==='string'?value:value.toISOString().slice(0,10))+'T00:00:00.000Z');
export const day=(value:Date)=>value.toISOString().slice(0,10);
export const today=()=>civil(new Date());
export function addDays(date:Date,days:number){const result=new Date(date);result.setUTCDate(result.getUTCDate()+days);return result;}
export function expiry(start:Date,duration:number,unit:WarrantyDurationUnit){
 if(unit==='DAYS'){const end=addDays(start,duration);if(end.getUTCFullYear()>9999)throw new ApiError(422,'WARRANTY_DATE_RANGE','Coverage exceeds supported civil date range');return end;}
 const months=unit==='YEARS'?duration*12:duration,total=start.getUTCFullYear()*12+start.getUTCMonth()+months,y=Math.floor(total/12),m=total%12;
 if(y>9999)throw new ApiError(422,'WARRANTY_DATE_RANGE','Coverage exceeds supported civil date range');
 return new Date(Date.UTC(y,m,Math.min(start.getUTCDate(),new Date(Date.UTC(y,m+1,0)).getUTCDate())));
}
export function effective(row:{status:string;verifiedStartDate:Date|null;expiresAt:Date|null},asOf=today()){
 return row.status!=='ACTIVE'?row.status:!row.verifiedStartDate||!row.expiresAt?'NEEDS_REVIEW':asOf<row.verifiedStartDate?'NOT_STARTED':asOf>=row.expiresAt?'EXPIRED':'ACTIVE';
}
