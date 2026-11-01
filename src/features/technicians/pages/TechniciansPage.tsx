import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { workforceClient, type WorkforceUser } from '../services/workforceClient';
export function TechniciansPage() {
  const { user } = useAuth(), [q, setQ] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<WorkforceUser[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    workforceClient.list({
      q: q || undefined, page, pageSize: 20
    }).then(r => {
      if (live) {
        setRows(r.data);
        setTotal(r.total);
      }
    }).catch(e => {
      if (live)
        setError(e.message);
    }).finally(() => {
      if (live)
        setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [
    q, page, retry
  ]);
  const columns: Column<WorkforceUser>[] = [
    {
      key: 'name', header: 'Technician', render: r => <Link className="text-green-700 font-semibold" to={'/technicians/' + r.id}>
        {r.name}
      </Link>
    }, {
      key: 'employmentStatus', header: 'Employment', render: r => r.technicianProfile?.employmentStatus ?? 'Profile Not Created'
    }, {
      key: 'isActive', header: 'Account', render: r => r.isActive ? 'Active' : 'Inactive'
    }, {
      key: 'baseLocation', header: 'Base Location', render: r => r.technicianProfile?.baseLocation ?? 'Not Recorded'
    }, {
      key: 'managed', header: 'Scheduling Policy', render: r => !r.technicianProfile ? 'Profile Missing; Availability Unknown' : r.technicianProfile.enforceScheduling ? 'Managed Eligibility Required' : 'Legacy Assignment Checks'
    }
  ];
  return <div className="max-w-7xl mx-auto space-y-5">
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold">Technician Workforce</h1>
      <div className="flex flex-wrap gap-2">
        <Link to="/technicians/availability">
          <Button variant="outline">Availability</Button>
        </Link>
        <Link to="/technicians/assignments">
          <Button variant="outline">Assignments</Button>
        </Link>
        <Link to="/technicians/teams">
          <Button variant="outline">Teams</Button>
        </Link>
        {user?.role === 'admin' && <Link to="/technicians/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>}
      </div>
    </div>
    <Card>
      <Input label="Find Technician" value={q} onChange={e => {
        setQ(e.target.value);
        setPage(1);
      }} />
      <p className="text-sm text-slate-500 mt-3">Profiles extend existing technician accounts. Open an account to create its workforce profile. Missing calendar or qualifications never means verified availability.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized technician accounts match." />}
  </div>;
}
