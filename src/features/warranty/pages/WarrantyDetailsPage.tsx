import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyRegistration, type WarrantyEvidence } from '../services/warrantyClient';
import { WarrantyEvidencePanel } from '../components/WarrantyEvidencePanel';
import { WarrantyCaseHistory } from '../components/WarrantyCaseHistory';
export function WarrantyDetailsPage() {
  const { id } = useParams(), { user } = useAuth(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'overview', worker = [
    'admin', 'service_manager'
  ].includes(user?.role ?? '');
  const [record, setRecord] = useState<WarrantyRegistration | null>(null), [activation, setActivation] = useState<Awaited<ReturnType<typeof warrantyClient.activation>> | null>(null), [files, setFiles] = useState<WarrantyEvidence[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id || !worker)
      return;
    const [r, a] = await Promise.all([
      warrantyClient.registration(id), warrantyClient.activation(id)
    ]);
    let all: WarrantyEvidence[] = [];
    for (let page = 1;page <= 3;page++) {
      const result = await warrantyClient.collection<WarrantyEvidence>(id, 'registrations', 'evidence', page);
      all = all.concat(result.data);
      if (all.length >= result.total)
        break;
    }
    if (generation !== requestGeneration.current) return;
    setRecord(r);
    setActivation(a);
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
    return <p>Loading warranty registration...</p>;
  if (error || !record)
    return <Card>
      <p role="alert">
        {error || 'Registration unavailable.'}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card>;
  const editable = [
    'DRAFT', 'PENDING_EVIDENCE'
  ].includes(record.status);
  return <div className="max-w-6xl mx-auto space-y-5">
    <Link className="text-green-700" to="/warranty/records">Back to Registrations</Link>
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">
          {record.reference}
        </h1>
        <p className="text-sm text-slate-500">
          {record.status}; effective coverage {record.effectiveStatus}; version {record.version}
        </p>
      </div>
      <Link to={'/warranty/claims/new?registration=' + record.id}>
        <Button>Report Warranty Claim</Button>
      </Link>
    </div>
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {[
        'overview', 'evidence', 'history'
      ].map(t => <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setParams({
        tab: t
      })}>
        {t}
      </Button>)}
    </div>
    <div key={record.version + ':' + tab} className="space-y-5">
      {tab === 'overview' && <>
        <Card>
          <h2 className="font-semibold">Pinned Coverage and Identity</h2>
          <p>
            {record.policySnapshot.policyName} ({record.policySnapshot.policyReference}) version {record.policyVersion}
          </p>
          <p>
            {record.coverageType.replaceAll('_', ' ')}; provider {record.policySnapshot.providerName}
          </p>
          <p>Coverage quantity: {record.coverageQuantity}; equipment {record.equipmentId ?? 'Project Workmanship'}; serial identity {record.serialUnitId ?? 'Not Serialized'}
          </p>
          <p className="text-sm break-all">Commissioned installation: {record.installationId}
          </p>
          <p>Verified start: {record.verifiedStartDate?.slice(0, 10) ?? 'Unverified'}; expiry (exclusive): {record.expiresAt?.slice(0, 10) ?? 'Unverified'}
          </p>
          <p className="text-sm mt-2 whitespace-pre-wrap">
            {record.policySnapshot.coverageDescription}
          </p>
          <p className="text-sm mt-2">Exclusions: {record.policySnapshot.exclusions ?? 'None Configured'}
          </p>
          <p className="text-sm">Conditions: {record.policySnapshot.claimConditions ?? 'None Configured'}
          </p>
        </Card>
        {activation && <Card>
          <h2 className="font-semibold">Activation Findings</h2>
          <p>Contractual start rule: {activation.startRule.replaceAll('_', ' ')}
          </p>
          <p>Candidate start: {activation.candidateStart?.slice(0, 10) ?? 'Unknown'}; candidate expiry: {activation.candidateExpiry?.slice(0, 10) ?? 'Unknown'}
          </p>
          {activation.findings.length ? <ul className="mt-2 text-amber-800">
            {activation.findings.map((f, i) => <li key={i}>
              {f.message}
            </li>)}
          </ul> : <p>No activation findings. Independent review is still required.</p>}
        </Card>}
        {editable && <RegistrationEvidenceDetails record={record} onSaved={refresh} />}
        {editable && <IdempotentActionForm title="Submit Warranty Registration" build={reason => ({
          version: record.version, reason
        })} send={body => warrantyClient.registrationCommand(record.id, 'submit', body)} onSaved={refresh}>
          <p className="text-sm">Missing evidence keeps the registration pending evidence. Complete findings before independent review.</p>
        </IdempotentActionForm>}
        {record.status === 'PENDING_REVIEW' && user?.role === 'admin' && <RegistrationReview record={record} onSaved={refresh} />}
        {record.status !== 'VOIDED' && user?.role === 'admin' && <IdempotentActionForm title="Void Warranty Registration" build={reason => ({
          version: record.version, reason
        })} send={body => warrantyClient.registrationCommand(record.id, 'void', body)} onSaved={refresh}>
          <p className="text-sm text-amber-800">Preserves historical terms and decisions. Existing active coverage cannot be silently edited or reactivated.</p>
        </IdempotentActionForm>}
      </>}
      {tab === 'evidence' && <WarrantyEvidencePanel id={record.id} parent="registrations" version={record.version} files={files} editable={![
        'VOIDED', 'REJECTED'
      ].includes(record.status)} onSaved={refresh} />}
      {tab === 'history' && <WarrantyCaseHistory id={record.id} parent="registrations" />}
    </div>
  </div>;
}
function RegistrationEvidenceDetails({ record: r, onSaved }: {
  record: WarrantyRegistration;
  onSaved: () => Promise<void>;
}) {
  const [start, setStart] = useState(r.proposedStartDate?.slice(0, 10) ?? ''), [notes, setNotes] = useState(r.dateSourceNotes ?? ''), [reference, setReference] = useState(r.providerRegistrationReference ?? ''), [providerDate, setProviderDate] = useState(r.providerRegisteredAt?.slice(0, 10) ?? '');
  return <IdempotentActionForm title="Record Warranty Date Evidence" build={reason => ({
    version: r.version, reason, proposedStartDate: start || null, dateSourceNotes: notes || null, providerRegistrationReference: reference || null, providerRegisteredAt: providerDate || null
  })} send={body => warrantyClient.editRegistration(r.id, body)} onSaved={onSaved}>
    <Input label="Observed Contractual Start Date (If Required)" type="date" value={start} onChange={e => setStart(e.target.value)} />
    <Textarea label="Start Date Source and Verification Notes" value={notes} onChange={e => setNotes(e.target.value)} />
    <Input label="Actual Provider Registration Reference" value={reference} onChange={e => setReference(e.target.value)} />
    <Input label="Observed Provider Registration Date" type="date" value={providerDate} onChange={e => setProviderDate(e.target.value)} />
    <p className="text-sm text-amber-800">A physical site receipt is not automatically proof of customer delivery or warranty commencement. Upload the documents required by the pinned policy.</p>
  </IdempotentActionForm>;
}
function RegistrationReview({ record: r, onSaved }: {
  record: WarrantyRegistration;
  onSaved: () => Promise<void>;
}) {
  const [decision, setDecision] = useState('REJECTED'), [notes, setNotes] = useState(''), [checks, setChecks] = useState<Record<string, boolean>>({}), names = [
    'identityVerified', 'policyTermsVerified', 'startEvidenceVerified', 'requiredDocumentsVerified', 'providerRegistrationVerified'
  ];
  return <IdempotentActionForm title="Review Warranty Activation" build={reason => ({
    version: r.version, reason, decision, notes, checklist: Object.fromEntries(names.map(n => [
      n, checks[n] ?? false
    ]))
  })} send={body => warrantyClient.registrationCommand(r.id, 'review', body)} onSaved={onSaved}>
    <p className="text-sm text-amber-800">An independent administrator who did not register or change this record must review it.</p>
    <Select label="Warranty Activation Decision" value={decision} options={[
      {
        value: 'REJECTED', label: 'Reject'
      }, {
        value: 'ACTIVE', label: 'Approve Verified Activation'
      }
    ]} onChange={e => setDecision(e.target.value)} />
    {names.map(n => <label className="block" key={n}>
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Textarea label="Activation Review Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
  </IdempotentActionForm>;
}
