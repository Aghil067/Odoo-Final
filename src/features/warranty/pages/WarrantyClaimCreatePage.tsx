import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyRegistration } from '../services/warrantyClient';
const registrations = (q: RecordQuery) => warrantyClient.registrations(q);
export function WarrantyClaimCreatePage() {
  const { user } = useAuth(), navigate = useNavigate(), [params] = useSearchParams(), id = params.get('registration'), [registration, setRegistration] = useState<WarrantyRegistration | null>(null), [issue, setIssue] = useState(''), [type, setType] = useState(''), [priority, setPriority] = useState('NORMAL'), [failure, setFailure] = useState(''), [error, setError] = useState(''), created = useRef('');
  useEffect(() => {
    if (!id)
      return;
    let live = true;
    warrantyClient.registration(id).then(r => {
      if (live)
        setRegistration(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    id
  ]);
  if (![
    'admin', 'service_manager'
  ].includes(user?.role ?? ''))
    return <Navigate to="/warranty/dashboard" replace />;
  return <div className="max-w-4xl mx-auto space-y-5">
    <Link className="text-green-700" to="/warranty/claims">Back to Claims</Link>
    <h1 className="text-2xl font-bold">Report Warranty Claim</h1>
    {error && <p role="alert">
      {error}
    </p>}
    <IdempotentActionForm title="Submit Warranty Claim" build={reason => {
      if (!registration)
        throw new Error('Choose an authorized registration.');
      return {
        registrationId: registration.id, reportedIssue: issue, claimType: type, priority, failureDate: failure || null, reason
      };
    }} send={async (body) => {
      const r = await warrantyClient.createClaim(body);
      created.current = r.id;
    }} onSaved={async () => {
      navigate('/warranty/claims/' + created.current);
    }}>
      <PagedRecordSelect label="Warranty Registration" selected={registration} onChange={setRegistration} load={registrations} describe={r => r.reference + ' - ' + r.policySnapshot.policyName + ' (' + r.effectiveStatus + ')'} required />
      <Textarea label="Reported Failure or Issue" required value={issue} onChange={e => setIssue(e.target.value)} />
      <Input label="Claim Type" required value={type} onChange={e => setType(e.target.value)} />
      <Input label="Observed Failure Date (If Known)" type="date" value={failure} onChange={e => setFailure(e.target.value)} />
      <Select label="Claim Priority" value={priority} options={[
        'LOW', 'NORMAL', 'HIGH', 'URGENT'
      ].map(v => ({
        value: v, label: v
      }))} onChange={e => setPriority(e.target.value)} />
      <p className="text-sm text-slate-500">Submission records the reported issue. It does not approve coverage or authorize a replacement, service charge or refund.</p>
    </IdempotentActionForm>
  </div>;
}
