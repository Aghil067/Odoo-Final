import {useState,useEffect,type FormEvent} from 'react';
import {siteService} from '../../surveys/services/siteService';
import type {Site} from '../../surveys/types/site.types';
import {Card} from '../../../components/ui/Card';
import {Input} from '../../../components/ui/Input';
import {Button} from '../../../components/ui/Button';
import {useAuth} from '../../auth/hooks/useAuth';
export function CustomerSites({customerId}:{customerId:string}){
 const {getModulePermission}=useAuth(),[sites,setSites]=useState<Site[]>([]),[error,setError]=useState<string|null>(null),[saving,setSaving]=useState(false),[open,setOpen]=useState(false);
 const [form,setForm]=useState({siteName:'',addressLine1:'',city:'',state:'',pinCode:'',country:'IN'});
 useEffect(()=>{void siteService.getByCustomerId(customerId).then(setSites).catch(e=>setError(e.message));},[customerId]);
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError(null);try{await siteService.create({...form,customerId,propertyType:null,contactPersonOnSite:'',contactPhoneOnSite:''});setSites(await siteService.getByCustomerId(customerId));setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Site was not saved.');}finally{setSaving(false);}}
 return <Card><div className="flex justify-between"><h3 className="font-semibold text-slate-800">Installation Sites</h3>{getModulePermission('customers')==='full'&&<Button variant="outline" size="sm" onClick={()=>setOpen(v=>!v)}>Add Site</Button>}</div>{error&&<p role="alert" className="text-red-700 mt-2">{error}</p>}<div className="divide-y">{sites.map(site=><div key={site.id} className="py-3"><p className="font-medium">{site.siteName}</p><p className="text-sm text-slate-500">{site.addressLine1}, {site.city}, {site.state} {site.pinCode}</p></div>)}</div>{!error&&!sites.length&&<p className="text-sm text-slate-500 mt-3">No installation sites have been recorded.</p>}{open&&<form onSubmit={submit} className="grid md:grid-cols-2 gap-3 mt-4">{Object.entries({siteName:'Site Name',addressLine1:'Site Address',city:'City',state:'State',pinCode:'Postal Code',country:'Country Code (ISO 2 letters)'}).map(([field,label])=><Input key={field} label={label} required value={form[field as keyof typeof form]} onChange={e=>setForm({...form,[field]:e.target.value})}/>)}<Button type="submit" isLoading={saving}>Save Site</Button></form>}</Card>;
}
