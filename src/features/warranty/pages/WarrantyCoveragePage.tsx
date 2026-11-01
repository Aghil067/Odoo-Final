import { useEffect, useState } from 'react';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { warrantyClient, type WarrantyInstallation } from '../services/warrantyClient';
const load = (q: RecordQuery) => warrantyClient.installations(q);
export function WarrantyCoveragePage() {
  const [installation, setInstallation] = useState<WarrantyInstallation | null>(null), [page, setPage] = useState(1), [result, setResult] = useState<Awaited<ReturnType<typeof warrantyClient.coverage>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    setResult(null);
    setError('');
    if (!installation)
      return;
    let live = true;
    warrantyClient.coverage(installation.id, page).then(r => {
      if (live)
        setResult(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    installation, page, retry
  ]);
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Authorized Warranty Coverage</h1>
    <Card>
      <PagedRecordSelect label="Commissioned Installation" selected={installation} onChange={r => {
        setInstallation(r);
        setPage(1);
      }} load={load} describe={r => r.name + ' - ' + r.reference} />
      <p className="text-sm text-slate-500 mt-3">Summary access follows project ownership or assignment. Private warranty case evidence is not exposed.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : installation && !result ? <p>Loading authorized coverage...</p> : result && <>
      <div className="grid sm:grid-cols-2 gap-4">
        {result.data.map(r => <Card key={r.id}>
          <p className="font-semibold">
            {r.reference}
          </p>
          <p>
            {r.coverageType.replaceAll('_', ' ')} - {r.effectiveStatus}
          </p>
          <p>Policy version {r.policyVersion}; quantity {r.coverageQuantity}
          </p>
          <p>Verified start: {r.verifiedStartDate?.slice(0, 10) ?? 'Unknown'}; expiry (exclusive): {r.expiresAt?.slice(0, 10) ?? 'Unknown'}
          </p>
        </Card>)}
      </div>
      {!result.data.length && <Card>No registered coverage for this authorized installation.</Card>}
      <div className="flex gap-3 items-center">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(result.pagination.totalItems / 20))}
        </span>
        <Button variant="outline" disabled={page * 20 >= result.pagination.totalItems} onClick={() => setPage(v => v + 1)}>Next</Button>
      </div>
      <Card>
        <h2 className="font-semibold">Related Claim Outcomes</h2>
        {result.claimHistory.map(c => <p className="text-sm mt-2" key={c.id}>
          {c.reference}: {c.status}; final decision {c.finalDecision ?? 'Not Recorded'}
        </p>)}
        {!result.claimHistory.length && <p>No recorded claims.</p>}
        {result.claimHistoryTruncated && <p>Only the latest 100 claim references are shown.</p>}
      </Card>
    </>}
  </div>;
}
