import {useRef,useState,type FormEvent,type ReactNode} from 'react';
import {ApiError} from '../../services/apiClient';
import {Button} from '../ui/Button';
import {Textarea} from '../ui/Textarea';
import {Card} from '../ui/Card';
export function IdempotentActionForm({title,children,build,send,onSaved}:{title:string;children:ReactNode;build:(reason:string)=>Record<string,unknown>;send:(body:unknown)=>Promise<unknown>;onSaved:()=>Promise<void>}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const lock=useRef(false),key=useRef(crypto.randomUUID()),pending=useRef<Record<string,unknown>|null>(null),posted=useRef(false);
 async function submit(e:FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setSaved(false);
  try{
   if(!posted.current){const body=pending.current??{...build(reason),idempotencyKey:key.current};pending.current=body;await send(body);posted.current=true;}
   await onSaved();setSaved(true);setUncertain(false);pending.current=null;posted.current=false;key.current=crypto.randomUUID();
  }catch(e){
   const unknownOutcome=posted.current||(e instanceof ApiError&&(e.status===0||e.status>=500));
   setUncertain(unknownOutcome);if(!unknownOutcome)pending.current=null;
   setError((e instanceof Error?e.message:'Could not save.')+(unknownOutcome?' The result needs confirmation. Retry keeps the exact original request and prevents duplicate posting.':''));
  }finally{setBusy(false);lock.current=false;}
 }
 return <Card><form onSubmit={submit} className="space-y-4"><h2 className="font-semibold text-lg">{title}</h2><fieldset disabled={busy||uncertain} className="space-y-4">{children}<Textarea label={title+' Reason'} required value={reason} onChange={e=>{setReason(e.target.value);setSaved(false);}} maxLength={2000}/></fieldset>{error&&<p role="alert" className="text-red-700">{error}</p>}{saved&&<p role="status" className="text-green-700">Saved to the record.</p>}<Button type="submit" isLoading={busy}>{uncertain?'Confirm Original '+title:title}</Button></form></Card>;
}
