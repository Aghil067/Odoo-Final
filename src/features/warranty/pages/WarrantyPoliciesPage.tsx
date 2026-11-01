import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyPolicy, type WarrantyPolicyVersion } from '../services/warrantyClient';
export function WarrantyPoliciesPage() {
  const { user } = useAuth(), worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [params, setParams] = useSearchParams(), selected = params.get('policy'), [q, setQ] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<WarrantyPolicy[]>([]), [total, setTotal] = useState(0), [versions, setVersions] = useState<WarrantyPolicyVersion[]>([]), [versionPage, setVersionPage] = useState(1), [versionTotal, setVersionTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!worker)
      return;
    let live = true;
    setError('');
    setLoading(true);
    Promise.all([
      warrantyClient.policies({
        q: q || undefined, page, pageSize: 20
      }), selected ? warrantyClient.policyVersions(selected, versionPage) : Promise.resolve({
        data: [], total: 0
      })
    ]).then(([p, v]) => {
      if (live) {
        setRows(p.data);
        setTotal(p.total);
        setVersions(v.data);
        setVersionTotal(v.total);
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
    worker, q, page, selected, versionPage, retry
  ]);
  if (!worker)
    return <Navigate to="/warranty/dashboard" replace />;
  const columns: Column<WarrantyPolicy>[] = [
    {
      key: 'reference', header: 'Policy Reference'
    }, {
      key: 'name', header: 'Policy', render: r => <Button variant="ghost" onClick={() => {
        setVersionPage(1);
        setParams({
          policy: r.id
        });
      }}>
        {r.name}
      </Button>
    }, {
      key: 'currentVersion', header: 'Published Version'
    }, {
      key: 'isActive', header: 'State', render: r => r.isActive ? 'Active' : 'Deactivated'
    }, {
      key: 'actions', header: 'Administration', render: r => user?.role === 'admin' ? <div className="space-y-2">
        <Link className="text-green-700" to={'/warranty/policies/new?policy=' + r.id}>Publish New Revision</Link>
        {r.isActive && <IdempotentActionForm title={'Deactivate ' + r.reference} build={reason => ({
          version: r.version, reason
        })} send={body => warrantyClient.policyCommand(r.id, 'deactivate', body)} onSaved={async () => {
          setRetry(v => v + 1);
        }}>
          <p className="text-xs">Preserves existing registration snapshots.</p>
        </IdempotentActionForm>}
      </div> : 'Read Only'
    }
  ];
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Warranty Policies</h1>
      {user?.role === 'admin' && <Link to="/warranty/policies/new">
        <Button>Create Policy</Button>
      </Link>}
    </div>
    <Card>
      <Input label="Find Policy" value={q} onChange={e => {
        setQ(e.target.value);
        setPage(1);
      }} />
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No configured warranty policies." />}
    {selected && !error && <>
      <h2 className="text-lg font-semibold">Immutable Published Policy Terms</h2>
      {versions.map(v => <Card key={v.id}>
        <h3 className="font-semibold">Version {v.version}: {v.coverageType.replaceAll('_', ' ')}
        </h3>
        <p>
          {v.providerName} ({v.providerType}); {v.duration} {v.durationUnit}; start rule {v.startRule.replaceAll('_', ' ')}
        </p>
        <p className="whitespace-pre-wrap mt-2">
          {v.coverageDescription}
        </p>
        <p className="mt-2">Exclusions: {v.exclusions ?? 'None Configured'}
        </p>
        <p>Claim conditions: {v.claimConditions ?? 'None Configured'}
        </p>
        <p className="text-sm">Registration documents: {v.requiredDocuments.join(', ') || 'None Configured'}
        </p>
        <p className="text-sm">Claim documents: {v.claimRequiredDocuments.join(', ') || 'None Configured'}
        </p>
        <p className="text-sm">Effective {v.effectiveFrom.slice(0, 10)} through {v.effectiveTo?.slice(0, 10) ?? 'No Configured End'} (exclusive).</p>
      </Card>)}
      <div className="flex gap-3 items-center">
        <Button variant="outline" disabled={versionPage <= 1} onClick={() => setVersionPage(v => v - 1)}>Previous Versions</Button>
        <span>Page {versionPage} of {Math.max(1, Math.ceil(versionTotal / 20))}
        </span>
        <Button variant="outline" disabled={versionPage * 20 >= versionTotal} onClick={() => setVersionPage(v => v + 1)}>Next Versions</Button>
      </div>
    </>}
  </div>;
}
