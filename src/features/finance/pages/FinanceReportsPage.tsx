import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { financeClient, financeCurrencies, money, type FinanceCustomer, type InvoiceBalance } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
const customers = (q: RecordQuery) => financeClient.customers(q);
export function FinanceReportsPage() {
  const { user } = useAuth(), allowed = [
    'admin', 'finance_officer'
  ].includes(user?.role ?? ''), [customer, setCustomer] = useState<FinanceCustomer | null>(null), [currency, setCurrency] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<InvoiceBalance[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!allowed)
      return;
    let live = true;
    setLoading(true);
    setError('');
    financeClient.receivables({
      customerId: customer?.id, currency: currency || undefined, page, pageSize: 20
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
    allowed, customer, currency, page, retry
  ]);
  if (!allowed)
    return <Navigate to="/finance/dashboard" replace />;
  const columns: Column<InvoiceBalance>[] = [
    {
      key: 'reference', header: 'Issued Invoice', render: r => <Link className="text-green-700" to={'/finance/invoices/' + r.invoice.id}>
        {r.invoice.reference}
      </Link>
    }, {
      key: 'effectiveStatus', header: 'Effective Balance State'
    }, {
      key: 'original', header: 'Original Issued Gross', render: r => money(r.invoice.currency, r.invoice.totalAmount)
    }, {
      key: 'creditAmount', header: 'Issued Gross Credit', render: r => money(r.invoice.currency, r.creditAmount)
    }, {
      key: 'allocatedAmount', header: 'Allocated Verified Receipts', render: r => money(r.invoice.currency, r.allocatedAmount)
    }, {
      key: 'outstanding', header: 'Outstanding Receivable', render: r => money(r.invoice.currency, r.outstanding)
    }, {
      key: 'dueAt', header: 'Due', render: r => new Date(r.invoice.dueAt).toLocaleString()
    }
  ];
  return <div className="space-y-5">
    <FinanceNavigation />
    <h1 className="text-2xl font-bold">Authoritative Receivable Ledger</h1>
    <Card>
      <div className="grid sm:grid-cols-2 gap-4">
        <PagedRecordSelect label="Receivable Customer (Optional)" selected={customer} onChange={r => {
          setCustomer(r);
          setPage(1);
        }} load={customers} describe={c => c.reference + ' - ' + c.name} />
        <Select label="Receivable Currency" value={currency} options={[
          {
            value: '', label: 'All Currencies Separately'
          }, ...financeCurrencies.map(v => ({
            value: v, label: v
          }))
        ]} onChange={e => {
          setCurrency(e.target.value);
          setPage(1);
        }} />
      </div>
      <p className="text-sm text-slate-500 mt-3">The issued-invoice book includes settled zero balances. Outstanding is computed by the backend from issued credits and active verified payment allocations. No currencies are combined.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.invoice.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No issued invoices in this authorized scope." />}
    <Link className="text-green-700" to="/finance/profitability">Review Explicit Project Cost Comparison</Link>
  </div>;
}
