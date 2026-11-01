import { useEffect, useState } from 'react';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { warrantyClient } from '../services/warrantyClient';
interface Record {
  id: string;
  event?: string;
  reason?: string;
  version?: number;
  createdAt?: string;
  fromStatus?: string | null;
  toStatus?: string;
  decision?: string;
  reviewedVersion?: number;
  notes?: string;
  reviewerId?: string;
  checklist?: {
    [key: string]: boolean;
  };
  result?: string;
  findings?: {
    code: string;
    message: string;
    kind: string;
  }[];
  claimVersion?: number;
  contentRevision?: number;
  providerReference?: string;
  response?: string;
  respondedAt?: string;
}
export function WarrantyCaseHistory({ id, parent }: {
  id: string;
  parent: 'registrations' | 'claims';
}) {
  const [kind, setKind] = useState('history'), [page, setPage] = useState(1), [rows, setRows] = useState<Record[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    warrantyClient.collection<Record>(id, parent, kind, page).then(r => {
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
    id, parent, kind, page, retry
  ]);
  return <div className="space-y-4">
    <Card>
      <Select label="Warranty Audit Collection" value={kind} options={[
        'history', 'decisions', ...(parent === 'claims' ? [
          'assessments', 'provider-responses'
        ] : [])
      ].map(v => ({
        value: v, label: v.replaceAll('-', ' ')
      }))} onChange={e => {
        setKind(e.target.value);
        setPage(1);
      }} />
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading audit records...</p> : <>
      {rows.map(r => <Card key={r.id}>
        <h3 className="font-semibold">
          {r.event ?? r.decision ?? r.result ?? r.response}
        </h3>
        <p>
          {r.reason ?? r.notes}
        </p>
        {r.fromStatus !== undefined && <p className="text-sm">
          {r.fromStatus ?? 'New'} to {r.toStatus}
        </p>}
        <p className="text-sm">Version {r.version ?? r.reviewedVersion ?? r.claimVersion}; {r.createdAt ? new Date(r.createdAt).toLocaleString() : r.respondedAt?.slice(0, 10)}
        </p>
        {r.providerReference && <p>Provider reference: {r.providerReference}
        </p>}
        {r.checklist && <ul className="text-sm">
          {Object.entries(r.checklist).map(([k, v]) => <li key={k}>
            {k.replace(/([a-z])([A-Z])/g, '$1 $2')}: {v ? 'Acknowledged' : 'Not Acknowledged'}
          </li>)}
        </ul>}
        {r.findings && <ul className="text-sm text-amber-800">
          {r.findings.map((f, i) => <li key={i}>
            {f.message} ({f.kind})</li>)}
        </ul>}
      </Card>)}
      {!rows.length && <Card>No records in this collection.</Card>}
    </>}
    <div className="flex gap-3 items-center">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous Records</Button>
      <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Records</Button>
    </div>
  </div>;
}
