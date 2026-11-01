import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { installationClient, installationStates } from '../services/installationClient';
export function InstallationDashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof installationClient.summary>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    setData(null);
    installationClient.summary().then(r => {
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
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Installation Dashboard</h1>
      <div className="flex gap-2">
        <Link to="/installations/map">
          <Button variant="primary">Interactive Map</Button>
        </Link>
        <Link to="/installations">
          <Button variant="outline">View Installations</Button>
        </Link>
      </div>
    </div>
    <p className="text-sm text-slate-500">Current authorized jobs by execution state. Commissioning is internal verification; it is not utility permission to energize.</p>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : !data ? <p>Loading installation summary...</p> : <>
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {installationStates.map(status => <Card key={status}>
          <p className="text-xs text-slate-500">
            {status.replaceAll('_', ' ')}
          </p>
          <p className="text-2xl font-semibold">
            {data.byStatus.find(r => r.status === status)?._count._all ?? 0}
          </p>
        </Card>)}
      </div>
      <Card>
        <p>Open blocking, high or critical issues: <strong>
          {data.blockingOpenIssues}
        </strong>
        </p>
      </Card>
    </>}
  </div>;
}
