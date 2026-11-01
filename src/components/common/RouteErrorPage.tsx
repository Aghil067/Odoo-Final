import {Link,isRouteErrorResponse,useRouteError} from 'react-router-dom';
import {Button} from '../ui/Button';
import {Card} from '../ui/Card';
export function RouteErrorPage(){const error=useRouteError();return <div className="max-w-xl mx-auto p-6"><Card><h1 className="text-xl font-semibold">Page Could Not Be Loaded</h1><p role="alert" className="text-slate-600 mt-3">{isRouteErrorResponse(error)&&error.status===404?'This page is unavailable.':'The page could not finish loading. Check the connection and reload to retry.'}</p><div className="flex flex-wrap gap-3 mt-4"><Button onClick={()=>window.location.reload()}>Reload Page</Button><Link to="/dashboard"><Button variant="outline">Return to Dashboard</Button></Link></div></Card></div>;}
