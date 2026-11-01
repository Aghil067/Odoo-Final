import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
import {Card} from '../../../components/ui/Card';
import {Button} from '../../../components/ui/Button';
import {Input} from '../../../components/ui/Input';
import {DataTable,type Column} from '../../../components/ui/DataTable';
import {inventoryClient,type StockOperation} from '../services/inventoryClient';
const settings={RECEIPT:{title:'Warehouse Receipts',route:'receipts',action:'Record Warehouse Receipt'},TRANSFER:{title:'Warehouse Transfers',route:'transfers',action:'Post Warehouse Transfer'},ADJUSTMENT:{title:'Stock Adjustments',route:'adjustments',action:'Post Stock Adjustment'}};
export function StockOperationsList({kind}:{kind:keyof typeof settings}){
 const {user}=useAuth(),s=settings[kind],canPost=kind==='ADJUSTMENT'?user?.role==='admin':['admin','inventory_manager'].includes(user?.role??'');const [q,setQ]=useState(''),[page,setPage]=useState(1),[rows,setRows]=useState<StockOperation[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;setLoading(true);setError('');inventoryClient.operations({kind,q:q||undefined,page,pageSize:20}).then(r=>{if(live){setRows(r.data);setTotal(r.total);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[kind,q,page]);
 const columns:Column<StockOperation>[]=[{key:'reference',header:'Posting Reference',render:r=><Link className="text-green-700 font-semibold" to={`/inventory/operations/${r.id}`}>{r.reference}</Link>},{key:'kind',header:'Operation',render:r=>r.kind.replaceAll('_',' ')},{key:'createdAt',header:'Posted At',render:r=>new Date(r.createdAt).toLocaleString()},{key:'reason',header:'Recorded Reason'}];
 return <div className="space-y-5 max-w-7xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3"><div><h1 className="text-2xl font-bold text-slate-800">{s.title}</h1><p className="text-sm text-slate-500">Posted, audited warehouse operations. Historical postings are retained.</p></div>{canPost&&<Link to={`/inventory/${s.route}/new`}><Button>{s.action}</Button></Link>}</div><Card><Input label="Find Posting Reference" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></Card>{error?<p role="alert" className="text-red-700">{error}</p>:<DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r=>r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No posted operations match this reference."/>}</div>;
}
