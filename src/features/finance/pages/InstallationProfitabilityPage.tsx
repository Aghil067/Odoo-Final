import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { financeClient, money, type FinanceInstallation } from '../services/financeClient';
import { FinanceNavigation } from '../components/FinanceNavigation';
const installations = (q: RecordQuery) => financeClient.installations(q);
export function InstallationProfitabilityPage() {
  const { user } = useAuth(), allowed = [
    'admin', 'finance_officer'
  ].includes(user?.role ?? ''), [installation, setInstallation] = useState<FinanceInstallation | null>(null), [result, setResult] = useState<Awaited<ReturnType<typeof financeClient.profitability>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    setResult(null);
    setError('');
    if (!installation || !allowed)
      return;
    let live = true;
    financeClient.profitability(installation.id).then(r => {
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
    allowed, installation, retry
  ]);
  if (!allowed)
    return <Navigate to="/finance/dashboard" replace />;
  return <div className="space-y-5 max-w-6xl mx-auto">
    <FinanceNavigation />
    <h1 className="text-2xl font-bold">Project Billing and Recorded Cost Comparison</h1>
    <Card>
      <PagedRecordSelect label="Financial Installation Project" selected={installation} onChange={setInstallation} load={installations} describe={r => r.name + ' - ' + r.reference} />
      <p className="text-sm text-amber-800 mt-3">Only explicitly linked commercial orders and recorded net actual costs are included. Cost completeness is not established; gross margin and accounting profit remain unavailable. Planned labor and BOM costs are not automatically recognized.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : installation && !result ? <p>Loading actual project billing and recorded costs...</p> : result && <>
      {result.byCurrency.map(r => <Card key={r.currency}>
        <h2 className="font-semibold">
          {r.currency}
        </h2>
        <p>Net billed excluding tax: {money(r.currency, r.netBilled)}
        </p>
        <p>Recorded net actual costs: {money(r.currency, r.recordedNetCosts)}
        </p>
        <p>Net billing less recorded costs: {money(r.currency, r.netBilledLessRecordedCosts)}
        </p>
        <p className="text-sm text-amber-800">Gross margin: Unavailable. Cost completeness: {r.costCompleteness.replaceAll('_', ' ')}.</p>
      </Card>)}
      {!result.byCurrency.length && <Card>No explicitly linked issued billing or recorded costs for this project.</Card>}
    </>}
  </div>;
}
