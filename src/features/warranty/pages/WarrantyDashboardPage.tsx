import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { warrantyClient } from '../services/warrantyClient';
import { WarrantyCoveragePage } from './WarrantyCoveragePage';
export function WarrantyDashboardPage() {
  const { user } = useAuth(), worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [data, setData] = useState<Awaited<ReturnType<typeof warrantyClient.summary>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!worker)
      return;
    let live = true;
    setData(null);
    setError('');
    warrantyClient.summary().then(r => {
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
    worker, retry
  ]);
  if (!worker)
    return <WarrantyCoveragePage />;
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold">Warranty Dashboard</h1>
      <div className="flex gap-2">
        <Link to="/warranty/records">
          <Button variant="outline">Registrations</Button>
        </Link>
        <Link to="/warranty/claims">
          <Button variant="outline">Claims</Button>
        </Link>
        <Link to="/warranty/expiring">
          <Button variant="outline">Expiring Coverage</Button>
        </Link>
      </div>
    </div>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : !data ? <p>Loading warranty summary...</p> : <>
      <div className="grid sm:grid-cols-3 gap-4">
        {Object.entries(data).filter(([k]) => ![
          'asOf', 'notificationDelivery'
        ].includes(k)).map(([key, value]) => <Card key={key}>
          <p className="text-sm text-slate-500">
            {key.replace(/([a-z])([A-Z0-9])/g, '$1 $2')}
          </p>
          <p className="text-2xl font-semibold">
            {value}
          </p>
        </Card>)}
      </div>
      <p className="text-sm text-slate-500">As of {data.asOf.slice(0, 10)} UTC. No automatic notifications are sent.</p>
    </>}
  </div>;
}
