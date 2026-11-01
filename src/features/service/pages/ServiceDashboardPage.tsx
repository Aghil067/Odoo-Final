import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { serviceClient } from '../services/serviceClient';
export function ServiceDashboardPage() {
  const { user } = useAuth(), [data, setData] = useState<Awaited<ReturnType<typeof serviceClient.summary>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    serviceClient.summary().then(r => {
      if (live)
        setData(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    retry
  ]);
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold">Service and Maintenance Dashboard</h1>
      <div className="flex flex-wrap gap-2">
        <Link to="/service/tickets">
          <Button variant="outline">Tickets</Button>
        </Link>
        {user?.role !== 'sales_executive' && <Link to="/service/assignments">
          <Button variant="outline">Scheduled Visits</Button>
        </Link>}
        {user?.role === 'admin' && <Link to="/service/maintenance">
          <Button variant="outline">Maintenance Plans</Button>
        </Link>}
        {[
          'admin', 'service_manager'
        ].includes(user?.role ?? '') && <Link to="/service/sla-policies">
            <Button variant="outline">SLA Policies</Button>
          </Link>}
      </div>
    </div>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : !data ? <p>Loading authorized service summary...</p> : <>
      <div className="grid sm:grid-cols-3 gap-4">
        {Object.entries(data).filter(([k]) => ![
          'asOf', 'notificationDelivery'
        ].includes(k)).map(([key, value]) => <Card key={key}>
          <p className="text-sm text-slate-500">
            {key.replace(/([a-z])([A-Z])/g, '$1 $2')}
          </p>
          <p className="text-2xl font-semibold">
            {value}
          </p>
        </Card>)}
      </div>
      <p className="text-sm text-slate-500">As of {new Date(data.asOf).toLocaleString()}. No automatic notifications are sent.</p>
    </>}
  </div>;
}
