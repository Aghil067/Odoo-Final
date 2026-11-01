import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyEvidence } from '../services/warrantyClient';
import { WarrantyEvidencePanel } from '../components/WarrantyEvidencePanel';
import { WarrantyCaseHistory } from '../components/WarrantyCaseHistory';
import { WarrantyInvestigationForm, WarrantyReviewerForm, WarrantyAssessmentForm, WarrantyDecisionForm, WarrantyProviderForm, WarrantyResolutionForm } from '../components/WarrantyClaimWorkForms';
export function WarrantyClaimDetailsPage() {
  const { id } = useParams(), { user } = useAuth(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'overview', worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), admin = user?.role === 'admin';
  const [record, setRecord] = useState<Awaited<ReturnType<typeof warrantyClient.claim>> | null>(null), [files, setFiles] = useState<WarrantyEvidence[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id || !worker)
      return;
    const r = await warrantyClient.claim(id);
    let all: WarrantyEvidence[] = [];
    for (let page = 1;page <= 3;page++) {
      const result = await warrantyClient.collection<WarrantyEvidence>(id, 'claims', 'evidence', page);
      all = all.concat(result.data);
      if (all.length >= result.total)
        break;
    }
    if (generation !== requestGeneration.current) return;
    setRecord(r);
    setFiles(all);
    setError('');
  }, [
    id, worker
  ]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    refresh().catch(e => {
      if (live)
        setError(e.message);
    }).finally(() => {
      if (live)
        setLoading(false);
    });
    return () => {
      live = false;
      invalidate();
    };
  }, [
    invalidate, refresh, retry
  ]);
  if (!worker)
    return <Navigate to="/warranty/dashboard" replace />;
  if (loading)
    return <p>Loading authorized warranty claim...</p>;
  if (error || !record)
    return <Card>
      <p role="alert">
        {error || 'Claim unavailable.'}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card>;
  const c = record.claim, reviewer = admin || c.responsibleReviewerId === user?.id, terminal = [
    'CLOSED', 'CANCELLED'
  ].includes(c.status), context = {
    claim: c, onSaved: refresh
  };
  const actions = [
    {
      action: 'start-review', label: 'Begin Internal Claim Review', states: [
        'SUBMITTED', 'EVIDENCE_REQUIRED', 'INELIGIBLE', 'PROVIDER_RESPONSE_PENDING'
      ]
    }, {
      action: 'request-evidence', label: 'Request Additional Claim Evidence', states: [
        'UNDER_REVIEW', 'ELIGIBLE'
      ]
    }, {
      action: 'await-provider', label: 'Mark Provider Response Pending', states: [
        'SUBMITTED_TO_PROVIDER'
      ]
    }, {
      action: 'close', label: 'Close Warranty Claim', states: [
        'INELIGIBLE', 'DENIED', 'RESOLVED'
      ]
    }, {
      action: 'cancel', label: 'Cancel Warranty Claim', states: [
        'SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REQUIRED', 'ELIGIBLE', 'INELIGIBLE', 'SUBMITTED_TO_PROVIDER', 'PROVIDER_RESPONSE_PENDING'
      ]
    }
  ];
  return <div className="max-w-6xl mx-auto space-y-5">
    <Link className="text-green-700" to="/warranty/claims">Back to Claims</Link>
    <h1 className="text-2xl font-bold">
      {c.reference}
    </h1>
    <p className="text-sm text-slate-500">
      {c.status}; version {c.version}; content revision {c.contentRevision}
    </p>
    <div className="flex gap-2 border-b pb-3">
      {[
        'overview', 'investigation', 'provider', 'evidence', 'history'
      ].map(t => <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setParams({
        tab: t
      })}>
        {t}
      </Button>)}
    </div>
    <div className="space-y-5" key={c.version + ':' + tab}>
      {tab === 'overview' && <>
        <Card>
          <h2 className="font-semibold">Reported Issue</h2>
          <p className="whitespace-pre-wrap">
            {c.reportedIssue}
          </p>
          <p>Type: {c.claimType}; priority {c.priority}; reported failure {c.failureDate?.slice(0, 10) ?? 'Unknown'}
          </p>
          <Link className="text-green-700" to={'/warranty/' + record.registration.id}>Original Registration {record.registration.reference}
          </Link>
          <p>Frozen policy: {record.registration.policySnapshot.policyName} v{record.registration.policyVersion}
          </p>
          <p>Final decision: {c.finalDecision ?? 'Not Decided'}
          </p>
          {c.resolution && <p>Resolution: {c.resolution}
          </p>}
        </Card>
        {admin && !c.finalDecision && !terminal && <WarrantyReviewerForm {...context} />}
        {!terminal && actions.filter(a => a.states.includes(c.status) && (reviewer || (a.action === 'cancel' && c.submittedById === user?.id))).map(a => <IdempotentActionForm key={a.action} title={a.label} build={reason => ({
          version: c.version, reason
        })} send={body => warrantyClient.claimCommand(c.id, a.action, body)} onSaved={refresh}>
          <p className="text-sm">Preserves the explicit claim lifecycle and audit history.</p>
        </IdempotentActionForm>)}
        {reviewer && c.status === 'APPROVED' && <WarrantyResolutionForm {...context} files={files} />}
      </>}
      {tab === 'investigation' && <>
        <Card>
          <h2 className="font-semibold">Latest Advisory Assessment</h2>
          {record.latestAssessment ? <>
            <p>
              {record.latestAssessment.result}
            </p>
            <p>
              {record.latestAssessment.notes}
            </p>
            <p className="text-sm">Content revision {record.latestAssessment.contentRevision}; current claim content revision {c.contentRevision}.</p>
            <ul className="text-sm text-amber-800">
              {record.latestAssessment.findings.map((f, i) => <li key={i}>
                {f.message}
              </li>)}
            </ul>
          </> : <p>No assessment recorded.</p>}
          <p className="text-sm text-slate-500 mt-2">Advisory eligibility is not final approval or provider acceptance.</p>
        </Card>
        {!terminal && [
          'SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REQUIRED', 'INELIGIBLE'
        ].includes(c.status) && (reviewer || c.submittedById === user?.id) && <WarrantyInvestigationForm {...context} />}
        {reviewer && c.status === 'UNDER_REVIEW' && <WarrantyAssessmentForm {...context} />}
        {reviewer && [
          'UNDER_REVIEW', 'ELIGIBLE'
        ].includes(c.status) && <WarrantyDecisionForm {...context} admin={admin} />}
      </>}
      {tab === 'provider' && <>
        <Card>
          <h2 className="font-semibold">Recorded Provider Communication</h2>
          <p>Actual provider claim reference: {c.providerClaimReference ?? 'Not Recorded'}
          </p>
          <p className="text-sm">Provider records are evidence and do not automatically approve claims.</p>
        </Card>
        {reviewer && c.status === 'ELIGIBLE' && <WarrantyProviderForm {...context} files={files} />}
        {reviewer && c.providerClaimReference && [
          'SUBMITTED_TO_PROVIDER', 'PROVIDER_RESPONSE_PENDING', 'UNDER_REVIEW', 'EVIDENCE_REQUIRED'
        ].includes(c.status) && <WarrantyProviderForm {...context} files={files} response />}
      </>}
      {tab === 'evidence' && <WarrantyEvidencePanel id={c.id} parent="claims" version={c.version} files={files} editable={!terminal} onSaved={refresh} />}
      {tab === 'history' && <WarrantyCaseHistory id={c.id} parent="claims" />}
    </div>
  </div>;
}
