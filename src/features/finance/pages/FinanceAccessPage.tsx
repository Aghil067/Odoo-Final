import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, type FinanceCustomer } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
const customers = (q: RecordQuery) => financeClient.customers(q), people = (q: RecordQuery) => financeClient.people(q);
export function FinanceAccessPage() {
  const { user } = useAuth(), [customer, setCustomer] = useState<FinanceCustomer | null>(null), [person, setPerson] = useState<{
    id: string;
    name: string;
  } | null>(null), [page, setPage] = useState(1), [rows, setRows] = useState<Awaited<ReturnType<typeof financeClient.grants>>['data']>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    setRows([]);
    setTotal(0);
    setError('');
    if (!customer || user?.role !== 'admin')
      return;
    let live = true;
    financeClient.grants(customer.id, page).then(r => {
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
    customer, user?.role, page, retry
  ]);
  if (user?.role !== 'admin')
    return <Navigate to="/finance/dashboard" replace />;
  return <div className="max-w-5xl mx-auto space-y-5">
    <FinanceNavigation />
    <h1 className="text-2xl font-bold">Scoped Finance Access</h1>
    <Card>
      <PagedRecordSelect label="Finance Grant Customer" selected={customer} onChange={r => {
        setCustomer(r);
        setPage(1);
      }} load={customers} describe={c => c.reference + ' - ' + c.name} />
    </Card>
    {customer && <IdempotentActionForm title="Grant Explicit Customer Finance Access" build={reason => {
      if (!person)
        throw new Error('Choose an active finance user.');
      return {
        userId: person.id, version: rows.find(r => r.userId === person.id)?.version ?? null, reason
      };
    }} send={body => financeClient.grant(customer.id, body)} onSaved={async () => {
      setRetry(v => v + 1);
    }}>
      <PagedRecordSelect label="Authorized Finance User" selected={person} onChange={setPerson} load={people} describe={u => u.name} required />
      <p className="text-sm">Access applies only to this customer's financial records. For reactivation, open the existing grant's page so its exact current version is used.</p>
    </IdempotentActionForm>}
    {error ? <p role="alert">
      {error}
    </p> : customer && <Card>
      <h2 className="font-semibold">Existing Customer Finance Grants</h2>
      {rows.map(r => <div className="border-t mt-3 pt-3" key={r.id}>
        <p>
          {r.user.name}: {r.isActive ? 'Active Grant' : 'Revoked'}
          {!r.user.isActive ? ' (Account Inactive)' : ''}
        </p>
        {r.isActive && <IdempotentActionForm key={r.version} title={'Revoke ' + r.user.name + ' Customer Finance Access'} build={reason => ({
          version: r.version, reason
        })} send={body => financeClient.revoke(r.id, body)} onSaved={async () => {
          setRetry(v => v + 1);
        }}>
          <p>Revocation preserves the access and financial history.</p>
        </IdempotentActionForm>}
      </div>)}
      {!rows.length && <p>No finance grants on this page.</p>}
      <div className="flex gap-3 items-center mt-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Grants</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
        </span>
        <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Grants</Button>
      </div>
    </Card>}
  </div>;
}
