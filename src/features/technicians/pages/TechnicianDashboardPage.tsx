import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { workforceClient } from '../services/workforceClient';
export function TechnicianDashboardPage() {
  const { user } = useAuth(), [data, setData] = useState<Awaited<ReturnType<typeof workforceClient.summary>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (user?.role !== 'admin')
      return;
    let live = true;
    setData(null);
    setError('');
    workforceClient.summary().then(r => {
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
    user?.role, retry
  ]);
  if (user?.role !== 'admin')
    return <Navigate to="/technicians/my-assignments" replace />;
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Workforce Dashboard</h1>
      <Link to="/technicians">
        <Button variant="outline">Technicians</Button>
      </Link>
    </div>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : !data ? <p>Loading workforce summary...</p> : <div className="grid sm:grid-cols-3 gap-4">
      {Object.entries(data).filter(([k]) => k !== 'skillCoverage').map(([key, value]) => <Card key={key}>
        <p className="text-sm text-slate-500">
          {key.replace(/([a-z])([A-Z])/g, '$1 $2')}
        </p>
        <p className="text-2xl font-semibold">
          {value === null ? 'Not Measured' : String(value)}
        </p>
      </Card>)}
    </div>}
    <p className="text-sm text-slate-500">Counts come from workforce profiles and authoritative source assignments. Attendance, worked hours and utilization are not invented.</p>
  </div>;
}
