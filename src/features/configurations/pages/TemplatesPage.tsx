import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
import {Card} from '../../../components/ui/Card';
import {Button} from '../../../components/ui/Button';
import {Input} from '../../../components/ui/Input';
import {Select} from '../../../components/ui/Select';
import {DataTable,type Column} from '../../../components/ui/DataTable';
import {solarTemplates,type TemplateRecord} from '../services/solarClient';
export function TemplatesPage(){
 const {user}=useAuth();const [rows,setRows]=useState<TemplateRecord[]>([]),[q,setQ]=useState(''),[type,setType]=useState(''),[active,setActive]=useState<'true'|'false'>('true'),[page,setPage]=useState(1),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;setLoading(true);setError('');solarTemplates.list({q:q||undefined,systemType:type||undefined,active,page,pageSize:20}).then(r=>{if(live){setRows(r.data);setTotal(r.total);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[q,type,active,page]);
 const columns:Column<TemplateRecord>[]=[{key:'code',header:'Code'},{key:'name',header:'Template',render:r=><Link className="font-semibold text-green-700" to={`/configurations/templates/${r.id}`}>{r.name}</Link>},{key:'systemType',header:'System Type',render:r=>r.systemType.replaceAll('_',' ')},{key:'nominalCapacityKw',header:'Nominal Capacity',render:r=>r.nominalCapacityKw+' kW'},{key:'range',header:'Capacity Range',render:r=>`${r.minimumCapacityKw} - ${r.maximumCapacityKw} kW`},{key:'version',header:'Revision'}];
 return <div className="space-y-5 max-w-7xl mx-auto"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3"><div><h1 className="text-2xl font-bold text-slate-800">System Templates</h1><p className="text-sm text-slate-500">Versioned material compositions and explicitly selected design policies.</p></div>{user?.role==='admin'&&<Link to="/configurations/templates/new"><Button>Create Template</Button></Link>}</div><Card><div className="grid sm:grid-cols-3 gap-3"><Input label="Search Templates" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/><Select label="Template System Type" value={type} options={[{value:'',label:'All System Types'},{value:'ON_GRID',label:'On Grid'},{value:'OFF_GRID',label:'Off Grid'}]} onChange={e=>{setType(e.target.value);setPage(1);}}/><Select label="Template Status" value={active} options={[{value:'true',label:'Active'},{value:'false',label:'Archived'}]} onChange={e=>{setActive(e.target.value as 'true'|'false');setPage(1);}}/></div></Card>{error?<p role="alert" className="text-red-700">{error}</p>:<DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r=>r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No templates match these filters."/>}</div>;
}
