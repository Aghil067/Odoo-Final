import {Navigate,useParams} from 'react-router-dom';
export function InstallationCompletionPage(){const {id}=useParams();return <Navigate to={'/installations/'+id+'?tab=completion'} replace/>;}
