import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { warrantyClient, registrationStates, type WarrantyRegistration } from '../services/warrantyClient';
import { WarrantyCoveragePage } from './WarrantyCoveragePage';
export function WarrantyRecordsPage({ expiring = false }: {
  expiring?: boolean;
}) {
  const { user } = useAuth(), worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [q, setQ] = useState(''), [status, setStatus] = useState(''), [effective, setEffective] = useState(''), [days, setDays] = useState('30'), [page, setPage] = useState(1), [rows, setRows] = useState<WarrantyRegistration[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!worker)
      return;
    let live = true;
    setLoading(true);
    setError('');
    warrantyClient.registrations({
      q: q || undefined, ...(!expiring ? {
        status: status || undefined, effective: effective || undefined
      } : {}), page, pageSize: 20
    }, expiring ? 'expiring' : 'registrations', expiring ? Number(days) : undefined).then(r => {
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
    worker, q, status, effective, days, page, expiring, retry
  ]);
  if (!worker)
    return <WarrantyCoveragePage />;
  const columns: Column<WarrantyRegistration>[] = [
    {
      key: 'reference', header: 'Registration', render: r => <Link className="text-green-700 font-semibold" to={'/warranty/' + r.id}>
        {r.reference}
      </Link>
    }, {
      key: 'policy', header: 'Frozen Policy', render: r => r.policySnapshot.policyName + ' v' + r.policyVersion
    }, {
      key: 'status', header: 'Review Status'
    }, {
      key: 'effectiveStatus', header: 'Effective Coverage'
    }, {
      key: 'verifiedStartDate', header: 'Verified Start', render: r => r.verifiedStartDate?.slice(0, 10) ?? 'Unverified'
    }, {
      key: 'expiresAt', header: 'Expiry (Exclusive)', render: r => r.expiresAt?.slice(0, 10) ?? 'Unverified'
    }
  ];
  return <div className="space-y-5 max-w-7xl mx-auto">
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold">
        {expiring ? 'Expiring Warranties' : 'Warranty Registrations'}
      </h1>
      <div className="flex gap-2">
        <Link to="/warranty/policies">
          <Button variant="outline">Policies</Button>
        </Link>
        <Link to="/warranty/register">
          <Button>Register Coverage</Button>
        </Link>
        <Link to="/warranty/claims">
          <Button variant="outline">Claims</Button>
        </Link>
      </div>
    </div>
    <Card>
      <div className="grid md:grid-cols-3 gap-3">
        <Input label="Find Warranty Reference" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
        {expiring ? <Select label="Expiring Within" value={days} options={[
          '30', '60', '90', '180', '365'
        ].map(v => ({
          value: v, label: v + ' Days'
        }))} onChange={e => {
          setDays(e.target.value);
          setPage(1);
        }} /> : <>
          <Select label="Registration Review State" value={status} options={[
            {
              value: '', label: 'All States'
            }, ...registrationStates.map(v => ({
              value: v, label: v.replaceAll('_', ' ')
            }))
          ]} onChange={e => {
            setStatus(e.target.value);
            setPage(1);
          }} />
          <Select label="Effective Coverage Filter" value={effective} options={[
            {
              value: '', label: 'All Coverage Periods'
            }, ...[
              'ACTIVE', 'EXPIRED', 'NOT_STARTED'
            ].map(v => ({
              value: v, label: v.replaceAll('_', ' ')
            }))
          ]} onChange={e => {
            setEffective(e.target.value);
            setPage(1);
          }} />
        </>}
      </div>
      <p className="text-sm text-slate-500 mt-3">Verified civil dates are start-inclusive and expiry-exclusive. Review status and current effective coverage are distinct.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized warranty registrations match." />}
  </div>;
}
