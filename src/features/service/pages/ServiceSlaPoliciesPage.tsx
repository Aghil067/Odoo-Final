import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { serviceClient, serviceCategories, servicePriorities, type ServiceSlaPolicy } from '../services/serviceClient';
export function ServiceSlaPoliciesPage() {
  const { user } = useAuth(), coordinator = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [q, setQ] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<ServiceSlaPolicy[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!coordinator)
      return;
    let live = true;
    setLoading(true);
    setError('');
    serviceClient.policies({
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
    coordinator, q, page, retry
  ]);
  if (!coordinator)
    return <Navigate to="/service/dashboard" replace />;
  const columns: Column<ServiceSlaPolicy>[] = [
    {
      key: 'reference', header: 'Policy'
    }, {
      key: 'revision', header: 'Immutable Revision'
    }, {
      key: 'category', header: 'Category'
    }, {
      key: 'priority', header: 'Priority'
    }, {
      key: 'firstResponseMinutes', header: 'Response Target (Elapsed Minutes)'
    }, {
      key: 'resolutionMinutes', header: 'Resolution Target (Elapsed Minutes)'
    }, {
      key: 'terms', header: 'Configured Terms'
    }
  ];
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Service SLA Policies</h1>
      <Link to="/service/dashboard">
        <Button variant="outline">Service Dashboard</Button>
      </Link>
    </div>
    <Card>
      <Input label="Find SLA Policy Reference" value={q} onChange={e => {
        setQ(e.target.value);
        setPage(1);
      }} />
      <p className="text-sm text-slate-500 mt-2">Policies use elapsed UTC minutes without business-hours pauses. Existing ticket clocks are pinned and cannot be silently replaced.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No SLA policies configured." />}
    {user?.role === 'admin' && <SlaPolicyForm onSaved={async () => {
      setRetry(v => v + 1);
    }} />}
  </div>;
}
function SlaPolicyForm({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState(''), [revision, setRevision] = useState(''), [category, setCategory] = useState(''), [priority, setPriority] = useState(''), [response, setResponse] = useState(''), [resolution, setResolution] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [terms, setTerms] = useState('');
  return <IdempotentActionForm title="Publish Immutable SLA Policy Revision" build={reason => ({
    reference, revision: Number(revision), category, priority, firstResponseMinutes: Number(response), resolutionMinutes: Number(resolution), effectiveFrom: new Date(from).toISOString(), effectiveTo: to ? new Date(to).toISOString() : null, clock: 'ELAPSED_UTC_NO_PAUSE', terms, reason
  })} send={serviceClient.createSla} onSaved={onSaved}>
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="SLA Policy Reference" required value={reference} onChange={e => setReference(e.target.value)} />
      <Input label="Next Explicit Policy Revision" required type="number" min={1} value={revision} onChange={e => setRevision(e.target.value)} />
      <Select label="Policy Service Category" required value={category} options={[
        {
          value: '', label: 'Choose Category'
        }, ...serviceCategories.map(v => ({
          value: v, label: v.replaceAll('_', ' ')
        }))
      ]} onChange={e => setCategory(e.target.value)} />
      <Select label="Policy Priority" required value={priority} options={[
        {
          value: '', label: 'Choose Priority'
        }, ...servicePriorities.map(v => ({
          value: v, label: v
        }))
      ]} onChange={e => setPriority(e.target.value)} />
      <Input label="Contractual First Response Minutes" required type="number" min={1} max={525600} value={response} onChange={e => setResponse(e.target.value)} />
      <Input label="Contractual Resolution Minutes" required type="number" min={1} max={5256000} value={resolution} onChange={e => setResolution(e.target.value)} />
      <Input label="SLA Effective From (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
      <Input label="SLA Effective Through (Exclusive, Optional)" type="datetime-local" min={from} value={to} onChange={e => setTo(e.target.value)} />
    </div>
    <Textarea label="Configured SLA Terms" required value={terms} onChange={e => setTerms(e.target.value)} />
  </IdempotentActionForm>;
}
