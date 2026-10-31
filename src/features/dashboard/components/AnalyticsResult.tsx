import {Activity} from 'lucide-react';
import {Card} from '../../../components/ui/Card';
import {KPICard} from './KPICard';

type RecordValue=Record<string,unknown>;
function record(v:unknown):v is RecordValue{return typeof v==='object'&&v!==null&&!Array.isArray(v);}
export const label=(key:string)=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,s=>s.toUpperCase());
export function display(value:unknown):string{
 if(value===null||value===undefined)return 'Unavailable';
 if(typeof value==='number')return Number.isInteger(value)?value.toLocaleString():value.toLocaleString(undefined,{maximumFractionDigits:2});
 if(typeof value==='boolean')return value?'Yes':'No';
 if(typeof value==='string'){if(/^-?\d+(\.\d+)?$/.test(value)){const [whole,fraction]=value.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction!==undefined?'.'+fraction:'');}if(/^\d{4}-\d{2}-\d{2}T/.test(value))return new Date(value).toLocaleString(undefined,{timeZone:'UTC'})+' UTC';return value;}
 return '';
}
const hidden=(key:string)=>['source','definition','definitions','scope','asOf','dataAsOf','meta','filters','pagination','snapshot','notes','createdById','issuedById','recordedById','approvedById'].includes(key)||/Snapshot$/.test(key);
function rowValues(value:unknown):RecordValue{if(!record(value))return {value};const out:RecordValue={};for(const [key,v]of Object.entries(value)){if(hidden(key))continue;if(key==='_sum'&&record(v))Object.assign(out,v);else if(key==='_count')out.count=record(v)?v._all:v;else if(key==='invoice'&&record(v))Object.assign(out,Object.fromEntries(Object.entries(v).filter(([k,x])=>!hidden(k)&&(!record(x))&&!Array.isArray(x))));else if(!record(v)&&!Array.isArray(v)&&!key.endsWith('Id')&&key!=='id')out[key]=v;}return out;}
function Rows({title,rows}:{title:string;rows:unknown[]}){
 if(!rows.length)return <Card><h3 className="font-semibold text-slate-800">{label(title)}</h3><p className="py-5 text-sm text-slate-500">No matching records.</p></Card>;
 const data=rows.map(rowValues),columns=[...new Set(data.flatMap(r=>Object.keys(r)))];
 if(rows.every(r=>record(r)&&typeof r.bucket==='string'&&typeof r.count==='number')){
  const points=rows as {bucket:string;count:number}[],max=Math.max(1,...points.map(r=>r.count));
  return <Card><h3 className="font-semibold mb-4">{label(title)}</h3><div className="flex h-48 items-end gap-2 overflow-x-auto">{points.map(point=><div key={point.bucket} className="flex min-w-12 flex-1 flex-col items-center justify-end h-full text-xs"><span>{point.count}</span><div className="w-full max-w-14 rounded-t bg-green-600" style={{height:`${point.count/max*80}%`,minHeight:point.count?2:0}}/><span className="mt-2 text-slate-500">{point.bucket.slice(0,10)}</span></div>)}</div></Card>;
 }
 return <Card><h3 className="font-semibold text-slate-800 mb-4">{label(title)}</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map(key=><th key={key} className="p-3">{label(key)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.map((row,index)=><tr key={index}>{columns.map(key=><td key={key} className="p-3 whitespace-nowrap">{display(row[key])}</td>)}</tr>)}</tbody></table></div></Card>;
}
export function AnalyticsResult({value,title='Results',depth=0}:{value:unknown;title?:string;depth?:number}){
 if(value===null)return <Card><p className="text-sm text-slate-500">{label(title)} is unavailable for this scope.</p></Card>;
 if(Array.isArray(value))return <Rows title={title} rows={value}/>;
 if(!record(value)||depth>4)return null;
 const entries=Object.entries(value).filter(([key])=>!hidden(key));
 const metrics=entries.filter(([,v])=>record(v)&&'value'in v&&'definition'in v);
 const scalars=entries.filter(([,v])=>!record(v)&&!Array.isArray(v));
 const groups=entries.filter(([,v])=>Array.isArray(v)||(record(v)&&!('value'in v)));
 return <div className="space-y-6">{metrics.length>0&&<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{metrics.map(([key,v])=><div key={key} title={String((v as RecordValue).definition)}><KPICard title={label(key)} value={display((v as RecordValue).value)} subtitle={String((v as RecordValue).unit??'')} icon={Activity}/></div>)}</div>}{scalars.length>0&&<Rows title={title} rows={[Object.fromEntries(scalars)]}/>} {groups.map(([key,v])=><AnalyticsResult key={key} title={key} value={v} depth={depth+1}/>)}{!entries.length&&<p className="text-sm text-slate-500">No matching results.</p>}</div>;
}
