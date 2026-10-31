import {useEffect,useMemo,useState} from 'react';
import {Input} from '../ui/Input';
import {Select} from '../ui/Select';
import {Button} from '../ui/Button';
export interface RecordQuery {q?:string;page:number;pageSize:number}
type Loader<T>=(query:RecordQuery)=>Promise<{data:T[];total:number}>;
export function PagedRecordSelect<T extends {id:string}>({label,selected,onChange,load,describe,required=false}:{label:string;selected:T|null;onChange:(value:T|null)=>void;load:Loader<T>;describe:(value:T)=>string;required?:boolean}){
 const [q,setQ]=useState(''),[search,setSearch]=useState(''),[position,setPosition]=useState<{load:Loader<T>;search:string;page:number}>({load,search:'',page:1});
 const page=position.load===load&&position.search===search?position.page:1;
 const key=useMemo(()=>({load,search,page}),[load,search,page]);
 const [result,setResult]=useState<{key:typeof key;data:T[];total:number;error:string}|null>(null);
 useEffect(()=>{const timer=setTimeout(()=>setSearch(q.trim()),250);return()=>clearTimeout(timer);},[q]);
 useEffect(()=>{let live=true;load({q:search||undefined,page,pageSize:20}).then(r=>{if(live)setResult({key,data:r.data,total:r.total,error:''});}).catch(e=>{if(live)setResult({key,data:[],total:0,error:e instanceof Error?e.message:'Could not load choices'});});return()=>{live=false;};},[key,load,page,search]);
 const current=result?.key===key?result:null,options=current?.data??[];
 const choices=[{value:'',label:current?'Select '+label:'Loading choices...'},...options.map(r=>({value:r.id,label:describe(r)}))];
 if(selected&&!options.some(r=>r.id===selected.id))choices.push({value:selected.id,label:describe(selected)});
 return <div className="space-y-2"><Input label={'Find '+label} value={q} onChange={e=>setQ(e.target.value)}/><Select label={label} required={required} value={selected?.id??''} options={choices} onChange={e=>onChange(options.find(r=>r.id===e.target.value)??(e.target.value===selected?.id?selected:null))}/>{current?.error&&<p role="alert" className="text-sm text-red-700">{current.error}</p>}<div className="flex items-center gap-2 text-xs"><Button type="button" size="sm" variant="outline" aria-label={'Previous '+label+' Choices'} disabled={!current||page<=1} onClick={()=>setPosition({load,search,page:page-1})}>Previous</Button><span>Page {page} of {Math.max(1,Math.ceil((current?.total??0)/20))}</span><Button type="button" size="sm" variant="outline" aria-label={'Next '+label+' Choices'} disabled={!current||page*20>=current.total} onClick={()=>setPosition({load,search,page:page+1})}>Next</Button></div></div>;
}
