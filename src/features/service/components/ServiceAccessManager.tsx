import { useCallback, useEffect, useState } from 'react';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { serviceClient, type ServiceInstallation, type ServicePerson } from '../services/serviceClient';
export function ServiceAccessManager({ installation }: {
  installation: ServiceInstallation;
}) {
  const [role, setRole] = useState('SUPPORT'), [person, setPerson] = useState<ServicePerson | null>(null), [rows, setRows] = useState<Awaited<ReturnType<typeof serviceClient.grants>>['data']>([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [error, setError] = useState(''), [retry, setRetry] = useState(0), load = useCallback((q: RecordQuery) => serviceClient.people(role, installation.id, q), [
    role, installation.id
  ]);
  useEffect(() => {
    let live = true;
    setError('');
    serviceClient.grants(installation.id, page).then(r => {
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
    <IdempotentActionForm title="Grant Scoped Service Access" build={reason => {
      if (!person)
        throw new Error('Choose an active support or warehouse user.');
      const old = rows.find(r => r.userId === person.id);
      return {
        userId: person.id, version: old?.version ?? null, reason
      };
    }} send={body => serviceClient.grant(installation.id, body)} onSaved={async () => {
      setRetry(v => v + 1);
    }}>
      <Select label="Service Grantee Role" value={role} options={[
        {
          value: 'SUPPORT', label: 'Support Case Access'
        }, {
          value: 'WAREHOUSE', label: 'Limited Parts-request Handoff'
        }
      ]} onChange={e => {
        setRole(e.target.value);
        setPerson(null);
      }} />
      <PagedRecordSelect label="Service Access User" selected={person} onChange={setPerson} load={load} describe={r => r.name} required />
      <p className="text-sm">For reactivation, open the page containing the existing grant so its current version is used.</p>
    </IdempotentActionForm>
    {error ? <p role="alert">
      {error}
    </p> : <Card>
      <h2 className="font-semibold">Existing Service Grants</h2>
      {rows.map(r => <div className="border-t mt-3 pt-3" key={r.id}>
        <p>
          {r.userId} - {r.role}: {r.isActive ? 'Active' : 'Revoked'}
        </p>
        {r.isActive && <IdempotentActionForm key={r.version} title={'Revoke Service Grant ' + r.id} build={reason => ({
          version: r.version, reason
        })} send={body => serviceClient.revoke(r.id, body)} onSaved={async () => {
          setRetry(v => v + 1);
        }}>
          <p>Preserves access history.</p>
        </IdempotentActionForm>}
      </div>)}
      {!rows.length && <p>No service grants on this page.</p>}
      <div className="flex gap-3 items-center mt-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Grants</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
        </span>
        <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Grants</Button>
      </div>
    </Card>}
  </div>;
}
