import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { financeClient, financeCurrencies, money, type FinanceGroup, type FinanceDocument, type InvoiceBalance } from '../services/financeClient';
import { FinanceNavigation, financeRecordUrl, financeGroupAllowed } from '../components/FinanceNavigation';
export function FinanceRecordsPage({ group }: {
  group: FinanceGroup;
}) {
  const { user } = useAuth(), allowed = financeGroupAllowed(user?.role, group), [q, setQ] = useState(''), [currency, setCurrency] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<(FinanceDocument | InvoiceBalance)[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!allowed)
      return;
    let live = true;
    setLoading(true);
    setError('');
    financeClient.list<FinanceDocument | InvoiceBalance>(group, {
      q: q || undefined, currency: currency || undefined, ...(group === 'quotations' ? {
        quoteStatus: status || undefined
      } : group === 'payments' ? {
        paymentStatus: status || undefined
      } : [
        'credit-notes', 'refunds', 'expenses', 'service-charges'
      ].includes(group) ? {
        approvalStatus: status || undefined
      } : {}), page, pageSize: 20
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
    allowed, group, q, currency, status, page, retry
  ]);
  if (!allowed)
    return <Navigate to="/finance/dashboard" replace />;
  const document = (r: FinanceDocument | InvoiceBalance) => 'invoice' in r ? r.invoice : r;
  const columns: Column<FinanceDocument | InvoiceBalance>[] = [
    {
      key: 'reference', header: 'Document Reference', render: r => {
        const d = document(r);
        return <Link className="font-semibold text-green-700" to={financeRecordUrl(group, d.id)}>
          {d.reference}
        </Link>;
      }
    }, {
      key: 'status', header: 'State', render: r => 'invoice' in r ? r.effectiveStatus : r.status ?? (group === 'orders' ? 'Accepted Commercial Commitment' : 'Not Recorded')
    }, {
      key: 'amount', header: 'Original Amount', render: r => {
        const d = document(r);
        return money(d.currency, d.totalAmount ?? d.amount ?? d.proposedAmount);
      }
    }, {
      key: 'outstanding', header: 'Outstanding Receivable', render: r => 'invoice' in r ? money(r.invoice.currency, r.outstanding) : 'Not an Invoice'
    }, {
      key: 'createdAt', header: 'Created', render: r => new Date(document(r).createdAt).toLocaleString()
    }
  ];
  const statuses = group === 'quotations' ? [
    'DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'EXPIRED', 'CANCELLED'
  ] : group === 'payments' ? [
    'RECORDED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'REVERSED'
  ] : [
    'credit-notes', 'refunds', 'expenses', 'service-charges'
  ].includes(group) ? [
    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RECORDED', 'ISSUED', 'REQUESTED', 'COMPLETED', 'CANCELLED'
  ] : [];
  const finance = [
    'admin', 'finance_officer'
  ].includes(user?.role ?? ''), create = group === 'quotations' || group === 'service-charges' || finance && [
    'invoices', 'payments', 'credit-notes', 'refunds', 'expenses'
  ].includes(group);
  return <div className="max-w-7xl mx-auto space-y-5">
    <FinanceNavigation />
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold capitalize">
        {group.replaceAll('-', ' ')}
      </h1>
      {create && <Link to={group === 'invoices' ? '/finance/invoices/new' : group === 'quotations' ? '/finance/quotations/new' : '/finance/new/' + group}>
        <Button>Create {group === 'payments' ? 'Observed Payment Record' : group.replaceAll('-', ' ')}
        </Button>
      </Link>}
    </div>
    <Card>
      <div className="grid sm:grid-cols-3 gap-3">
        <Input label="Find Financial Reference" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
        <Select label="Document Currency" value={currency} options={[
          {
            value: '', label: 'All Currencies Separately'
          }, ...financeCurrencies.map(v => ({
            value: v, label: v
          }))
        ]} onChange={e => {
          setCurrency(e.target.value);
          setPage(1);
        }} />
        {statuses.length > 0 && <Select label="Financial Workflow State" value={status} options={[
          {
            value: '', label: 'All States'
          }, ...statuses.map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => {
          setStatus(e.target.value);
          setPage(1);
        }} />}
      </div>
      <p className="text-sm text-slate-500 mt-3">Amounts remain exact decimal strings. Invoices are billing obligations; recorded or verified receipts are distinct from invoice allocation.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => document(r).id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized financial records match." />}
  </div>;
}
