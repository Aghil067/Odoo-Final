import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { financeClient, type FinanceGroup } from '../services/financeClient';
interface History {
  id: string;
  version: number;
  actorId: string;
  event: string;
  reason?: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}
export function FinanceHistory({ group, id }: {
  group: FinanceGroup;
  id: string;
}) {
  const [rows, setRows] = useState<History[]>([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    financeClient.history<History>(group, id, page).then(r => {
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
    group, id, page, retry
  ]);
  return <div className="space-y-4">
    <h2 className="font-semibold">Financial Audit History</h2>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading audit records...</p> : <>
      {rows.map(r => <Card key={r.id}>
        <p className="font-semibold">
          {r.event.replaceAll('_', ' ')} | Version {r.version}
        </p>
        <p>
          {r.fromStatus ?? 'New'} to {r.toStatus}
        </p>
        {r.reason && <p>
          {r.reason}
        </p>}
        <p className="text-sm">Actor {r.actorId}; {new Date(r.createdAt).toLocaleString()}
        </p>
      </Card>)}
      {!rows.length && <Card>No audit records available.</Card>}
    </>}
    <div className="flex gap-3 items-center">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous History</Button>
      <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next History</Button>
    </div>
  </div>;
}
