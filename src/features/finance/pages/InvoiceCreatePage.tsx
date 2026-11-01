import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, money, type FinanceOrder, type FinanceInvoice, type InvoiceBalance } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
const orders = (q: RecordQuery) => financeClient.list<FinanceOrder>('orders', q), local = (v: string) => new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export function InvoiceCreatePage() {
  const { id } = useParams(), { user } = useAuth(), [record, setRecord] = useState<InvoiceBalance | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(!!id), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!id)
      return;
    let live = true;
    setLoading(true);
    setError('');
    financeClient.detail<InvoiceBalance>('invoices', id).then(r => {
      if (live)
        setRecord(r);
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
    id, retry
  ]);
  if (![
    'admin', 'finance_officer'
  ].includes(user?.role ?? ''))
    return <Navigate to="/finance/invoices" replace />;
  return <div className="max-w-5xl mx-auto space-y-5">
    <FinanceNavigation />
    <Link className="text-green-700" to="/finance/invoices">Back to Invoices</Link>
    <h1 className="text-2xl font-bold">
      {id ? 'Edit Draft Invoice Due Date and Notes' : 'Draft Invoice from Accepted Order'}
    </h1>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading invoice...</p> : record && record.invoice.status !== 'DRAFT' ? <Card>Issued or voided invoices are immutable. Use explicit credit or correction workflows.</Card> : <InvoiceDraftForm key={id ?? 'new'} invoice={record?.invoice ?? null} />}
  </div>;
}
function InvoiceDraftForm({ invoice }: {
  invoice: FinanceInvoice | null;
}) {
  const navigate = useNavigate(), [order, setOrder] = useState<FinanceOrder | null>(null), [due, setDue] = useState(invoice ? local(invoice.dueAt) : ''), [notes, setNotes] = useState(invoice?.notes ?? ''), created = useRef('');
  return <IdempotentActionForm title={invoice ? 'Save Draft Invoice Changes' : 'Create Order-backed Draft Invoice'} build={reason => {
    if (invoice)
      return {
        version: invoice.version, reason, dueAt: new Date(due).toISOString(), notes
      };
    if (!order)
      throw new Error('Choose an actual customer-accepted commercial order.');
    return {
      orderId: order.id, orderVersion: order.version, dueAt: new Date(due).toISOString(), notes, reason
    };
  }} send={async (body) => {
    const row = invoice ? await financeClient.edit<FinanceInvoice>('invoices', invoice.id, body) : await financeClient.create<FinanceInvoice>('invoices', body);
    created.current = row.id;
  }} onSaved={async () => {
    navigate('/finance/invoices/' + created.current);
  }}>
    {!invoice && <PagedRecordSelect label="Customer-accepted Commercial Order" selected={order} onChange={setOrder} load={orders} describe={o => o.reference + ' | ' + money(o.currency, o.totalAmount)} required />}
    <Input label="Explicit Invoice Due Time (Local Time)" type="datetime-local" required value={due} onChange={e => setDue(e.target.value)} />
    <Textarea label="Invoice Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm text-slate-500">All financial lines and totals come from the frozen accepted quotation through its order. The frontend does not recalculate them. Due time must be future and within 730 days.</p>
  </IdempotentActionForm>;
}
