import {Navigate,useParams} from 'react-router-dom';
export function InstallationExecutionPage(){const {id}=useParams();return <Navigate to={'/installations/'+id+'?tab=milestones'} replace/>;}
