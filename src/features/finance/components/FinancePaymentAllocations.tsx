import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { financeClient, money, type FinancePayment, type FinanceAllocation } from '../services/financeClient';
import { financeRecordUrl } from './FinanceNavigation';
import { Link } from 'react-router-dom';
import { FinanceCommandForm } from './FinanceWorkForms';
export function FinancePaymentAllocations({ payment: p, onSaved }: {
  payment: FinancePayment;
  onSaved: () => Promise<void>;
}) {
  const [rows, setRows] = useState<FinanceAllocation[]>([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    financeClient.allocations(p.id, page).then(r => {
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
    p.id, p.version, page, retry
  ]);
  return <div className="space-y-4">
    <div className="flex justify-between">
      <h2 className="font-semibold">Actual Payment Allocations and Releases</h2>
      <Button variant="outline" onClick={() => setRetry(v => v + 1)}>Refresh Allocations</Button>
    </div>
    {error ? <p role="alert">
      {error}
    </p> : loading ? <p>Loading allocation history...</p> : <>
      {rows.map(a => <Card key={a.id}>
        <Link className="text-green-700" to={financeRecordUrl('invoices', a.invoiceId)}>
          {a.invoice.reference}
        </Link>
        <p>Original allocation: {money(p.currency, a.amount)}; current active allocation: {money(p.currency, a.activeAmount)}
        </p>
        <ul className="text-sm">
          {a.releases.map(r => <li key={r.id}>Released {money(p.currency, r.amount)}: {r.reason} ({new Date(r.createdAt).toLocaleString()})</li>)}
        </ul>
        {p.status === 'VERIFIED' && !/^0+(\.0+)?$/.test(a.activeAmount) && <AllocationRelease key={a.id + ':' + a.invoice.version} payment={p} allocation={a} onSaved={onSaved} />}
      </Card>)}
      {!rows.length && <Card>No invoice allocations.</Card>}
    </>}
    <div className="flex gap-3 items-center">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous Allocations</Button>
      <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Allocations</Button>
    </div>
  </div>;
}
function AllocationRelease({ payment: p, allocation: a, onSaved }: {
  payment: FinancePayment;
  allocation: FinanceAllocation;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  return <FinanceCommandForm group="payments" document={p} title="Release Existing Invoice Allocation" action="" fields={() => ({
    invoiceVersion: a.invoice.version, amount
  })} send={body => financeClient.release(p.id, a.id, body)} onSaved={onSaved}>
    <Input label="Exact Allocation Release Amount" required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
    <p className="text-sm">Explicit correction only. The backend checks both document versions and remaining active allocation. No money is sent.</p>
  </FinanceCommandForm>;
}
