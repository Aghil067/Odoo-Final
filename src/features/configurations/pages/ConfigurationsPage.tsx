import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
import {Card} from '../../../components/ui/Card';
import {Button} from '../../../components/ui/Button';
import {Input} from '../../../components/ui/Input';
import {Select} from '../../../components/ui/Select';
import {DataTable,type Column} from '../../../components/ui/DataTable';
import {solarConfigurations,configurationStates,type ConfigurationRecord} from '../services/solarClient';
export function ConfigurationsPage(){
 const {user}=useAuth();const [rows,setRows]=useState<ConfigurationRecord[]>([]),[q,setQ]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;setLoading(true);setError('');solarConfigurations.list({q:q||undefined,status:status||undefined,page,pageSize:20}).then(r=>{if(live){setRows(r.data);setTotal(r.total);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[q,status,page]);
 const columns:Column<ConfigurationRecord>[]=[{key:'name',header:'Configuration',render:r=><Link className="font-semibold text-green-700" to={`/configurations/${r.id}`}>{r.name}<span className="block text-xs text-slate-500 break-all">{r.reference}</span></Link>},{key:'customer',header:'Customer / Site',render:r=><div>{r.surveySnapshot.snapshot.customer.name}<span className="block text-xs text-slate-500">{r.surveySnapshot.snapshot.site.name}</span></div>},{key:'systemType',header:'System',render:r=>r.systemType.replaceAll('_',' ')},{key:'targetCapacityKw',header:'Target',render:r=>r.targetCapacityKw+' kW'},{key:'status',header:'Status',render:r=>r.status.replaceAll('_',' ')},{key:'revisionNumber',header:'Revision'}];
 return <div className="space-y-5 max-w-7xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3"><div><h1 className="text-2xl font-bold text-slate-800">Solar Configurations</h1><p className="text-sm text-slate-500">Survey-linked design revisions and their actual approval states.</p></div>{['admin','technician'].includes(user?.role??'')&&<Link to="/configurations/new"><Button>Create Configuration</Button></Link>}</div><Card><div className="grid sm:grid-cols-2 gap-3"><Input label="Search Configurations" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/><Select label="Configuration Status" value={status} options={[{value:'',label:'All States'},...configurationStates.map(v=>({value:v,label:v.replaceAll('_',' ')}))]} onChange={e=>{setStatus(e.target.value);setPage(1);}}/></div></Card>{error?<p role="alert" className="text-red-700">{error}</p>:<DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r=>r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No configurations match these filters."/>}</div>;
}
