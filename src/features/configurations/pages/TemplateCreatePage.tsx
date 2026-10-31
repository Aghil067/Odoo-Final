import {useNavigate,Link} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
import {Card} from '../../../components/ui/Card';
import {SolarTemplateForm} from '../components/SolarTemplateForm';
import {solarTemplates} from '../services/solarClient';
export function TemplateCreatePage(){const navigate=useNavigate(),{user}=useAuth();if(user?.role!=='admin')return <p role="alert">Only administrators may create system templates.</p>;return <div className="max-w-5xl mx-auto space-y-5"><div><Link className="text-green-700 text-sm" to="/configurations/templates">Back to Templates</Link><h1 className="text-2xl font-bold text-slate-800">Create System Template</h1></div><Card><SolarTemplateForm onCancel={()=>navigate('/configurations/templates')} onSave={async data=>{const created=await solarTemplates.create(data);navigate(`/configurations/templates/${created.id}`);}}/></Card></div>;}
