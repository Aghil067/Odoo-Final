import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { financeClient, financeCurrencies, money } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
export function FinanceDashboardPage() {
  const { user } = useAuth(), finance = [
    'admin', 'finance_officer'
  ].includes(user?.role ?? ''), [currency, setCurrency] = useState(''), [result, setResult] = useState<{
    summary: Awaited<ReturnType<typeof financeClient.summary>>;
    payments: Awaited<ReturnType<typeof financeClient.paymentSummary>>;
    expenses: Awaited<ReturnType<typeof financeClient.expenseSummary>>;
  } | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!finance)
      return;
    let live = true;
    setResult(null);
    setError('');
    const q = {
      currency: currency || undefined
    };
    Promise.all([
      financeClient.summary(q), financeClient.paymentSummary(q), financeClient.expenseSummary(q)
    ]).then(([summary, payments, expenses]) => {
      if (live)
        setResult({
          summary, payments, expenses
        });
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    finance, currency, retry
  ]);
  if (!finance)
    return <Navigate to={user?.role === 'sales_executive' ? '/finance/quotations' : '/finance/service-charges'} replace />;
  return <div className="space-y-5">
    <FinanceNavigation />
    <h1 className="text-2xl font-bold">Finance Dashboard</h1>
    <Card>
      <Select label="Financial Summary Currency" value={currency} options={[
        {
          value: '', label: 'All Currencies Separately'
        }, ...financeCurrencies.map(v => ({
          value: v, label: v
        }))
      ]} onChange={e => setCurrency(e.target.value)} />
      <p className="text-sm text-slate-500 mt-3">Operational issued billing and verified manual receipts, not bank reconciliation or statutory accounts. Currencies are never combined.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : !result ? <p>Loading authorized financial aggregates...</p> : <>
      {result.summary.byCurrency.map(row => <Card key={row.currency}>
        <h2 className="font-semibold">
          {row.currency} Issued Billing</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-3">
          {Object.entries(row).filter(([k]) => k !== 'currency').map(([key, value]) => <div key={key}>
            <p className="text-xs text-slate-500">
              {key.replace(/([a-z])([A-Z])/g, '$1 $2')}
            </p>
            <p className="font-semibold">
              {money(row.currency, value)}
            </p>
          </div>)}
        </div>
      </Card>)}
      {!result.summary.byCurrency.length && <Card>No issued invoices in this authorized scope.</Card>}
      <Card>
        <h2 className="font-semibold">Actual Payment Records by State and Currency</h2>
        {result.payments.payments.map(p => <p className="mt-2" key={p.currency + p.status}>
          {p.currency} {p.status}: {p._sum.amount ?? 'Unavailable'} across {p._count} records</p>)}
        {!result.payments.payments.length && <p>No recorded payments.</p>}
        <h3 className="font-medium mt-4">Refund Records</h3>
        {result.payments.refunds.map(r => <p key={r.currency + r.status}>
          {r.currency} {r.status}: {r._sum.amount ?? 'Unavailable'} across {r._count} records</p>)}
      </Card>
      <Card>
        <h2 className="font-semibold">Expense Records by State and Currency</h2>
        {result.expenses.data.map(e => <p className="mt-2" key={e.currency + e.status}>
          {e.currency} {e.status}: {e._sum.amount ?? 'Unavailable'} across {e._count} records</p>)}
        {!result.expenses.data.length && <p>No expense records.</p>}
        <p className="text-sm text-slate-500 mt-3">Only RECORDED net actual cost is recognized operationally; this does not execute a bank payment.</p>
      </Card>
    </>}
  </div>;
}
