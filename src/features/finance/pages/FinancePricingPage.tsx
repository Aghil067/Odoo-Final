import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, money, type FinancePriceBook, type FinanceTaxRule } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
import { FinancePriceBookForm, FinanceTaxRuleForm } from '../components/FinancePricingForms';
export function FinancePricingPage() {
  const { user } = useAuth(), allowed = [
    'admin', 'finance_officer', 'sales_executive'
  ].includes(user?.role ?? ''), [kind, setKind] = useState<'price-books' | 'tax-rules'>('price-books'), [q, setQ] = useState(''), [page, setPage] = useState(1), [rows, setRows] = useState<(FinancePriceBook | FinanceTaxRule)[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!allowed)
      return;
    let live = true;
    setLoading(true);
    setError('');
    const request = kind === 'price-books' ? financeClient.books({
      q: q || undefined, page, pageSize: 20
    }) : financeClient.taxes({
      q: q || undefined, page, pageSize: 20
    });
    request.then(r => {
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
    allowed, kind, q, page, retry
  ]);
  if (!allowed)
    return <Navigate to="/finance/dashboard" replace />;
  return <div className="space-y-5 max-w-6xl mx-auto">
    <FinanceNavigation />
    <h1 className="text-2xl font-bold">Explicit Pricing and Tax Rules</h1>
    <Card>
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Financial Pricing Catalog" value={kind} options={[
          {
            value: 'price-books', label: 'Immutable Selling Price Books'
          }, {
            value: 'tax-rules', label: 'Immutable Configured Tax Rules'
          }
        ]} onChange={e => {
          setKind(e.target.value as typeof kind);
          setPage(1);
        }} />
        <Input label="Find Pricing Reference or Name" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
      </div>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading real pricing records...</p> : <>
      {rows.map(r => <Card key={r.id}>
        <h2 className="font-semibold">
          {r.reference} v{r.revision} - {r.name}
        </h2>
        <p>
          {r.currency}; {r.isActive ? 'Active Flag' : 'Deactivated'}; effective {new Date(r.effectiveFrom).toLocaleString()} through {r.effectiveTo ? new Date(r.effectiveTo).toLocaleString() : 'No Configured End'} (exclusive)</p>
        {'lines' in r ? <>
          <p>Discount review threshold {r.discountApprovalPercent}%; gross amount review threshold {money(r.currency, r.approvalThresholdAmount)}
          </p>
          <ul className="divide-y mt-3">
            {r.lines.map(l => <li key={l.id} className="py-2">
              <p>
                {l.code}: {l.description} ({l.kind})</p>
              <p>
                {money(r.currency, l.unitPrice)} / {l.unit}
              </p>
              {l.estimatedUnitCost !== undefined && <p className="text-sm">Comparable estimated cost: {money(r.currency, l.estimatedUnitCost)}; source {l.costSourceNotes ?? 'Not Established'}
              </p>}
            </li>)}
          </ul>
        </> : <>
          <p>
            {r.ratePercent}% {r.inclusive ? 'Included in Selling Price' : 'Added to Taxable Amount'}
          </p>
          <p>
            {r.jurisdictionNotes}
          </p>
        </>}
        {user?.role === 'admin' && r.isActive && <IdempotentActionForm key={r.version} title={'Deactivate ' + r.reference + ' v' + r.revision} build={reason => ({
          version: r.version, reason
        })} send={body => financeClient.deactivate(kind, r.id, body)} onSaved={async () => {
          setRetry(v => v + 1);
        }}>
          <p>Preserves historical quotations and invoice snapshots.</p>
        </IdempotentActionForm>}
      </Card>)}
      {!rows.length && <Card>No configured pricing records match.</Card>}
    </>}
    <div className="flex gap-3 items-center">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous Pricing Records</Button>
      <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Pricing Records</Button>
    </div>
    {user?.role === 'admin' && (kind === 'price-books' ? <FinancePriceBookForm onSaved={async () => {
      setRetry(v => v + 1);
    }} /> : <FinanceTaxRuleForm onSaved={async () => {
      setRetry(v => v + 1);
    }} />)}
  </div>;
}
