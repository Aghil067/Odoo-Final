import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { installationClient, installationStates, type InstallationJob } from '../services/installationClient';
export function InstallationsPage() {
  const { user } = useAuth(), [q, setQ] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<InstallationJob[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    installationClient.list({
      q: q || undefined, status: status || undefined, page, pageSize: 20
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
    q, status, page, retry
  ]);
  const columns: Column<InstallationJob>[] = [
    {
      key: 'reference', header: 'Installation', render: r => <Link className="font-semibold text-green-700" to={'/installations/' + r.id}>
        {r.name}
        <span className="block text-xs text-slate-500">
          {r.reference}
        </span>
      </Link>
    }, {
      key: 'status', header: 'Status'
    }, {
      key: 'plannedStartAt', header: 'Planned Start', render: r => new Date(r.plannedStartAt).toLocaleString()
    }, {
      key: 'plannedEndAt', header: 'Planned End', render: r => new Date(r.plannedEndAt).toLocaleString()
    }, {
      key: 'deliveryConfirmedAt', header: 'Site Receipt', render: r => r.deliveryConfirmedAt ? new Date(r.deliveryConfirmedAt).toLocaleString() : 'Not fully verified'
    }, {
      key: 'commissionedAt', header: 'Internal Commissioning', render: r => r.commissionedAt ? new Date(r.commissionedAt).toLocaleString() : 'Pending'
    }
  ];
  return <div className="space-y-5 max-w-7xl mx-auto">
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Installation Management</h1>
        <p className="text-sm text-slate-500">Real project execution, equipment receipt and internal commissioning.</p>
      </div>
      <div className="flex gap-2">
        <Link to="/installations/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
        {user?.role === 'admin' && <Link to="/installations/new">
          <Button>Plan Installation</Button>
        </Link>}
      </div>
    </div>
    <Card>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Find Installation" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
        <Select label="Installation Status" value={status} options={[
          {
            value: '', label: 'All Authorized States'
          }, ...installationStates.map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => {
          setStatus(e.target.value);
          setPage(1);
        }} />
      </div>
    </Card>
    {error ? <Card>
      <p role="alert" className="text-red-700">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No installations match these filters." />}
  </div>;
}
