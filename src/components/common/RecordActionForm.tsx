import {useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Button} from '../ui/Button';
import {Textarea} from '../ui/Textarea';
import {Card} from '../ui/Card';
export function RecordActionForm({title,children,submit,disabled=false}:{title:string;children:ReactNode;submit:(reason:string)=>Promise<unknown>;disabled?:boolean}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false),lock=useRef(false);
 async function save(e:FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setSaved(false);try{await submit(reason);setSaved(true);}catch(e){setError((e instanceof Error?e.message:'Could not save.')+' If the connection failed, refresh the record before submitting again.');}finally{setBusy(false);lock.current=false;}}
 return <Card><form onSubmit={save} className="space-y-4"><h2 className="font-semibold text-lg">{title}</h2><fieldset disabled={busy||disabled} className="space-y-4">{children}<Textarea label={title+' Reason'} value={reason} onChange={e=>{setReason(e.target.value);setSaved(false);}} required maxLength={2000}/><Button type="submit" isLoading={busy}>{title}</Button></fieldset>{error&&<p role="alert" className="text-red-700">{error}</p>}{saved&&<p role="status" className="text-green-700">Saved to the record.</p>}</form></Card>;
}
