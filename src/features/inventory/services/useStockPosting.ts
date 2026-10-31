import {useRef,useState} from 'react';
import {ApiError} from '../../../services/apiClient';
import type {StockCommand} from './inventoryClient';

export function useStockPosting<T extends StockCommand,R>(post:(body:T)=>Promise<R>){
 const [key]=useState(()=>crypto.randomUUID()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[uncertain,setUncertain]=useState(false);
 const submitted=useRef<T|null>(null);
 async function execute(body:Omit<T,'idempotencyKey'>):Promise<R|null>{
  if(busy)return null;
  const input=uncertain&&submitted.current?submitted.current:{...body,idempotencyKey:key} as T;
  submitted.current=input;setBusy(true);setError('');
  try{const result=await post(input);setUncertain(false);return result;}
  catch(e){const unknown=e instanceof ApiError&&(e.status===0||e.status>=500);setUncertain(unknown);setError((e instanceof Error?e.message:'The stock operation could not be completed.')+(unknown?' The posting outcome is unknown. Retry sends the same request. Search its reference before starting another operation.':''));return null;}
  finally{setBusy(false);}
 }
 return {execute,busy,error,uncertain};
}
