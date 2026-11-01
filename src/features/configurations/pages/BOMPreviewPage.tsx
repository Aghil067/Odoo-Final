import {useEffect,useState} from 'react';
import {useParams,Link} from 'react-router-dom';
import {Card} from '../../../components/ui/Card';
import {ProjectBOM} from '../components/ProjectBOM';
import {solarConfigurations,type ConfigurationRecord} from '../services/solarClient';
export function BOMPreviewPage(){const {id}=useParams();const [record,setRecord]=useState<ConfigurationRecord|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);useEffect(()=>{if(id)solarConfigurations.get(id).then(setRecord).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[id]);if(loading)return <p role="status">Loading recorded BOM...</p>;if(error||!record?.bom)return <p role="alert" className="text-red-700">{error||'BOM not found.'}</p>;return <div className="max-w-7xl mx-auto space-y-5"><div><Link className="text-sm text-green-700" to={`/configurations/${record.id}`}>Back to Configuration</Link><h1 className="text-2xl font-bold text-slate-800">Bill of Materials</h1><p className="text-sm text-slate-500">{record.name}</p></div><Card><ProjectBOM bom={record.bom}/></Card></div>;}
