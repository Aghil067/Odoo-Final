import {useEffect,useState} from 'react';
import {API_FAILURE,API_RECOVERED} from '../../services/apiClient';
export function ApiErrorBanner(){
 const [message,setMessage]=useState<string|null>(null);
 useEffect(()=>{const show=(event:Event)=>setMessage((event as CustomEvent<string>).detail),recovered=()=>setMessage(null);window.addEventListener(API_FAILURE,show);window.addEventListener(API_RECOVERED,recovered);return ()=>{window.removeEventListener(API_FAILURE,show);window.removeEventListener(API_RECOVERED,recovered);};},[]);
 if(!message)return null;
 return <div role="alert" className="fixed bottom-4 right-4 z-[100] max-w-lg rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 shadow-lg"><p className="font-semibold">The request did not complete</p><p>{message}</p><button type="button" className="mt-2 underline" onClick={()=>setMessage(null)}>Dismiss</button></div>;
}
