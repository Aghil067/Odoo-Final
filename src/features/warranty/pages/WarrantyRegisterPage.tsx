import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyInstallation, type WarrantyPolicy, type CoverageCandidate, type WarrantyAccess } from '../services/warrantyClient';
const installations = (q: RecordQuery) => warrantyClient.installations(q), policies = (q: RecordQuery) => warrantyClient.policies(q), support = (q: RecordQuery) => warrantyClient.assignees('SUPPORT', q);
export function WarrantyRegisterPage() {
  const { user } = useAuth(), navigate = useNavigate(), [installation, setInstallation] = useState<WarrantyInstallation | null>(null), [policy, setPolicy] = useState<WarrantyPolicy | null>(null), [result, setResult] = useState<Awaited<ReturnType<typeof warrantyClient.eligibility>> | null>(null), [candidate, setCandidate] = useState<CoverageCandidate | null>(null), [page, setPage] = useState(1), [error, setError] = useState(''), [retry, setRetry] = useState(0), created = useRef('');
  const worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? '');
  useEffect(() => {
    setResult(null);
    setCandidate(null);
    setError('');
    if (!installation || !policy || !worker)
      return;
    let live = true;
    warrantyClient.eligibility(installation.id, policy.id, page).then(r => {
      if (live)
        setResult(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    installation, policy, page, worker, retry
  ]);
  if (!worker)
    return <Navigate to="/warranty/dashboard" replace />;
  return <div className="max-w-5xl mx-auto space-y-5">
    <Link className="text-green-700" to="/warranty/records">Back to Registrations</Link>
    <h1 className="text-2xl font-bold">Register Installed Warranty Coverage</h1>
    <Card>
      <div className="grid md:grid-cols-2 gap-4">
        <PagedRecordSelect label="Commissioned Installation" selected={installation} onChange={r => {
          setInstallation(r);
          setPage(1);
        }} load={installations} describe={r => r.name + ' - ' + r.reference} />
        <PagedRecordSelect label="Configured Warranty Policy" selected={policy} onChange={r => {
          setPolicy(r);
          setPage(1);
        }} load={policies} describe={r => r.reference + ' - ' + r.name + (r.isActive ? '' : ' (Inactive)')} />
      </div>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : installation && policy && !result ? <p>Checking exact installed identities and policy version...</p> : result && <>
      <Card>
        <h2 className="font-semibold">Installed Coverage Candidates</h2>
        <p className="text-sm text-slate-500">Policy version {result.policyVersion}. Eligibility permits registration only; activation still requires explicit date evidence and review.</p>
        <Select label="Exact Installed Coverage Identity" value={candidate?.coverageKey ?? ''} options={[
          {
            value: '', label: 'Select Installed Identity'
          }, ...result.data.map(c => ({
            value: c.coverageKey, label: (c.component ? c.component.sku + ' - ' + c.component.name : 'Project Workmanship') + (c.serialNumber ? ' | Serial ' + c.serialNumber : ' | Quantity ' + c.quantity) + (c.canRegister ? '' : ' (Already Registered)')
          }))
        ]} onChange={e => setCandidate(result.data.find(c => c.coverageKey === e.target.value) ?? null)} />
        {!result.data.length && <p>No equipment matches this policy.</p>}
        <div className="flex gap-3 items-center mt-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Candidates</Button>
          <span>Page {page} of {Math.max(1, Math.ceil(result.pagination.totalItems / 20))}
          </span>
          <Button variant="outline" disabled={page * 20 >= result.pagination.totalItems} onClick={() => setPage(v => v + 1)}>Next Candidates</Button>
        </div>
      </Card>
      {candidate?.canRegister && result.policyActive && <IdempotentActionForm key={candidate.coverageKey} title="Create Warranty Registration" build={reason => ({
        installationId: installation!.id, policyId: policy!.id, policyVersion: result.policyVersion, equipmentId: candidate.equipmentId, serialUnitId: candidate.serialUnitId, reason
      })} send={async (body) => {
        const row = await warrantyClient.createRegistration(body);
        created.current = row.id;
      }} onSaved={async () => {
        navigate('/warranty/' + created.current);
      }}>
        <p className="text-sm">Creates a draft pinned to this exact policy version and commissioned identity. It does not establish a warranty start date.</p>
      </IdempotentActionForm>}
    </>}
    {user?.role === 'admin' && installation && <WarrantyAccessManager key={installation.id} installation={installation} />}
  </div>;
}
function WarrantyAccessManager({ installation }: {
  installation: WarrantyInstallation;
}) {
  const [person, setPerson] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null), [rows, setRows] = useState<WarrantyAccess[]>([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    warrantyClient.access(installation.id, page).then(r => {
      if (live) {
        setRows(r.data);
        setTotal(r.total);
      }
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    installation.id, page, retry
  ]);
  return <div className="space-y-4">
    <IdempotentActionForm title="Grant Scoped Warranty Support Access" build={reason => {
      if (!person)
        throw new Error('Choose an active support user.');
      return {
        userId: person.id, reason
      };
    }} send={body => warrantyClient.grant(installation.id, body)} onSaved={async () => {
      setRetry(v => v + 1);
    }}>
      <PagedRecordSelect label="Warranty Support User" selected={person} onChange={setPerson} load={support} describe={r => r.name} />
      <p className="text-sm">Access applies only to this installation's warranty cases. It does not grant installation execution or finance access.</p>
    </IdempotentActionForm>
    {error ? <p role="alert">
      {error}
    </p> : <Card>
      <h2 className="font-semibold">Existing Warranty Access Grants</h2>
      {rows.map(r => <div key={r.id} className="border-t mt-3 pt-3">
        <p>
          {r.user.name}: {r.isActive ? 'Active' : 'Revoked'}
        </p>
        {r.isActive && <IdempotentActionForm key={r.version} title={'Revoke ' + r.user.name + ' Warranty Access'} build={reason => ({
          version: r.version, reason
        })} send={body => warrantyClient.revoke(r.id, body)} onSaved={async () => {
          setRetry(v => v + 1);
        }}>
          <p className="text-sm">Preserves the access history.</p>
        </IdempotentActionForm>}
      </div>)}
      {!rows.length && <p>No grants on this page.</p>}
      <div className="flex gap-3 items-center mt-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Grants</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
        </span>
        <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Grants</Button>
      </div>
    </Card>}
  </div>;
}
