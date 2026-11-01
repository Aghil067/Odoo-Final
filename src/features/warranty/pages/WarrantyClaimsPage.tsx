import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { warrantyClient, claimStates, type WarrantyClaim } from '../services/warrantyClient';
export function WarrantyClaimsPage() {
  const { user } = useAuth(), worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [q, setQ] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<WarrantyClaim[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!worker)
      return;
    let live = true;
    setLoading(true);
    setError('');
    warrantyClient.claims({
      q: q || undefined, claimStatus: status || undefined, page, pageSize: 20
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
    worker, q, status, page, retry
  ]);
  if (!worker)
    return <Navigate to="/warranty/dashboard" replace />;
  const columns: Column<WarrantyClaim>[] = [
    {
      key: 'reference', header: 'Claim', render: r => <Link className="text-green-700 font-semibold" to={'/warranty/claims/' + r.id}>
        {r.reference}
      </Link>
    }, {
      key: 'reportedIssue', header: 'Reported Issue'
    }, {
      key: 'priority', header: 'Priority'
    }, {
      key: 'status', header: 'Workflow State'
    }, {
      key: 'finalDecision', header: 'Final Decision', render: r => r.finalDecision ?? 'Not Decided'
    }, {
      key: 'failureDate', header: 'Reported Failure Date', render: r => r.failureDate?.slice(0, 10) ?? 'Unknown'
    }
  ];
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Warranty Claims</h1>
      <Link to="/warranty/claims/new">
        <Button>Report Claim</Button>
      </Link>
    </div>
    <Card>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Find Claim Reference" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
        <Select label="Claim Workflow State" value={status} options={[
          {
            value: '', label: 'All States'
          }, ...claimStates.map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => {
          setStatus(e.target.value);
          setPage(1);
        }} />
      </div>
      <p className="text-sm text-slate-500 mt-2">Advisory eligibility, provider responses and final decisions remain separate records.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized warranty claims match." />}
  </div>;
}
