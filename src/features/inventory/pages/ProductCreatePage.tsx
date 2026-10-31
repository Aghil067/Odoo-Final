import {Navigate} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
export function ProductCreatePage(){const {user}=useAuth();return user?.role==='admin'?<Navigate to="/configurations/components" replace/>:<p role="alert" className="text-slate-700">An administrator maintains components in the shared solar catalog. Warehouse records reuse those components.</p>;}
