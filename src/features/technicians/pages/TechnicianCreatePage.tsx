import {Navigate,useParams} from 'react-router-dom';
export function TechnicianCreatePage(){const {id}=useParams();return <Navigate to={id?'/technicians/'+id+'?tab=profile':'/technicians'} replace/>;}
