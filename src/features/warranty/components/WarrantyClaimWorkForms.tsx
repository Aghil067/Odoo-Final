import { useCallback, useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { warrantyClient, type WarrantyClaim, type WarrantyEvidence } from '../services/warrantyClient';
import { WarrantyEvidenceChoice } from './WarrantyEvidencePanel';
type Context = {
  claim: WarrantyClaim;
  onSaved: () => Promise<void>;
};
export function WarrantyInvestigationForm({ claim: c, onSaved }: Context) {
  const [failure, setFailure] = useState(c.failureDate?.slice(0, 10) ?? ''), [notes, setNotes] = useState(c.investigationNotes ?? '');
  return <IdempotentActionForm title="Save Claim Investigation" build={reason => ({
    version: c.version, reason, failureDate: failure || null, investigationNotes: notes
  })} send={body => warrantyClient.editClaim(c.id, body)} onSaved={onSaved}>
    <Input label="Verified Reported Failure Date" type="date" value={failure} onChange={e => setFailure(e.target.value)} />
    <Textarea label="Investigation Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
  </IdempotentActionForm>;
}
export function WarrantyReviewerForm({ claim: c, onSaved }: Context) {
  const [role, setRole] = useState<'ADMIN' | 'SUPPORT'>('ADMIN'), [person, setPerson] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null), load = useCallback((q: RecordQuery) => warrantyClient.assignees(role, q), [
    role
  ]);
  return <IdempotentActionForm title="Assign Internal Claim Reviewer" build={reason => {
    if (!person)
      throw new Error('Choose a reviewer.');
    return {
      version: c.version, reason, reviewerId: person.id
    };
  }} send={body => warrantyClient.claimCommand(c.id, 'assign', body)} onSaved={onSaved}>
    <Select label="Reviewer Account Role" value={role} options={[
      {
        value: 'ADMIN', label: 'Administrator'
      }, {
        value: 'SUPPORT', label: 'Explicitly Granted Support User'
      }
    ]} onChange={e => {
      setRole(e.target.value as 'ADMIN' | 'SUPPORT');
      setPerson(null);
    }} />
    <PagedRecordSelect label="Internal Warranty Reviewer" selected={person} onChange={setPerson} load={load} describe={r => r.name} required />
    <p className="text-sm">Support users must already have an explicit warranty access grant for this installation.</p>
  </IdempotentActionForm>;
}
export function WarrantyAssessmentForm({ claim: c, onSaved }: Context) {
  const names = [
    'identityConfirmed', 'reportedDateVerified', 'documentsReviewed', 'installationReviewed', 'previousClaimsReviewed', 'providerResponseReviewed'
  ], [checks, setChecks] = useState<Record<string, boolean>>({}), [exclusion, setExclusion] = useState('unknown'), [conditions, setConditions] = useState('unknown'), [notes, setNotes] = useState('');
  return <IdempotentActionForm title="Record Advisory Claim Assessment" build={reason => ({
    version: c.version, reason, notes, attestation: {
      ...Object.fromEntries(names.map(n => [
        n, checks[n] ?? false
      ])), exclusionApplies: exclusion === 'unknown' ? null : exclusion === 'yes', conditionsSatisfied: conditions === 'unknown' ? null : conditions === 'yes'
    }
  })} send={body => warrantyClient.claimCommand(c.id, 'assess', body)} onSaved={onSaved}>
    {names.map(n => <label key={n} className="block">
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Select label="Does a Contractual Exclusion Apply?" value={exclusion} options={[
      {
        value: 'unknown', label: 'Not Determined'
      }, {
        value: 'yes', label: 'Yes - Exclusion Applies'
      }, {
        value: 'no', label: 'No Applicable Exclusion'
      }
    ]} onChange={e => setExclusion(e.target.value)} />
    <Select label="Are Contractual Claim Conditions Satisfied?" value={conditions} options={[
      {
        value: 'unknown', label: 'Not Determined'
      }, {
        value: 'yes', label: 'Yes - Verified Satisfied'
      }, {
        value: 'no', label: 'No - Conditions Not Satisfied'
      }
    ]} onChange={e => setConditions(e.target.value)} />
    <Textarea label="Assessment Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm text-amber-800">An advisory potentially eligible result is not provider acceptance or final claim approval. Changes to case facts or evidence require a fresh assessment.</p>
  </IdempotentActionForm>;
}
export function WarrantyDecisionForm({ claim: c, admin, onSaved }: Context & {
  admin: boolean;
}) {
  const [decision, setDecision] = useState('ELIGIBLE'), [checks, setChecks] = useState<Record<string, boolean>>({}), [notes, setNotes] = useState(''), names = [
    'assessmentReviewed', 'identityReviewed', 'termsReviewed', 'providerDecisionReviewed'
  ];
  return <IdempotentActionForm title="Record Human Claim Decision" build={reason => ({
    version: c.version, reason, decision, notes, checklist: Object.fromEntries(names.map(n => [
      n, checks[n] ?? false
    ]))
  })} send={body => warrantyClient.claimCommand(c.id, 'review', body)} onSaved={onSaved}>
    <Select label="Claim Decision" value={decision} options={[
      'ELIGIBLE', 'INELIGIBLE', ...(admin ? [
        'APPROVED', 'DENIED'
      ] : [])
    ].map(v => ({
      value: v, label: v.replaceAll('_', ' ')
    }))} onChange={e => setDecision(e.target.value)} />
    {names.map(n => <label key={n} className="block">
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Textarea label="Human Decision Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm text-amber-800">Final approval or denial requires an administrator who did not submit the claim. External provider coverage requires an actual recorded provider approval.</p>
  </IdempotentActionForm>;
}
export function WarrantyProviderForm({ claim: c, files, response = false, onSaved }: Context & {
  files: WarrantyEvidence[];
  response?: boolean;
}) {
  const [reference, setReference] = useState(c.providerClaimReference ?? ''), [decision, setDecision] = useState('INFORMATION'), [at, setAt] = useState(''), [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <IdempotentActionForm title={response ? 'Record Actual Provider Response' : 'Record Provider Submission'} build={reason => ({
    version: c.version, reason, evidenceIds: evidence, ...(response ? {
      providerReference: reference, response: decision, respondedAt: at, notes
    } : {
      providerClaimReference: reference
    })
  })} send={body => warrantyClient.claimCommand(c.id, response ? 'provider-response' : 'submit-provider', body)} onSaved={onSaved}>
    <Input label={response ? 'Provider Response Reference' : 'Actual Provider Claim Reference'} required value={reference} onChange={e => setReference(e.target.value)} />
    {response && <>
      <Select label="Observed Provider Response" value={decision} options={[
        'INFORMATION', 'APPROVED', 'DENIED', 'EVIDENCE_REQUIRED'
      ].map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setDecision(e.target.value)} />
      <Input label="Observed Provider Response Date" type="date" required value={at} onChange={e => setAt(e.target.value)} />
      <Textarea label="Provider Response Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    </>}
    <WarrantyEvidenceChoice files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Records communication that already occurred. The application sends no message and creates no replacement shipment, service ticket or financial transaction.</p>
  </IdempotentActionForm>;
}
export function WarrantyResolutionForm({ claim: c, files, onSaved }: Context & {
  files: WarrantyEvidence[];
}) {
  const [resolution, setResolution] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <IdempotentActionForm title="Record Approved Claim Resolution" build={reason => ({
    version: c.version, reason, resolution, evidenceIds: evidence
  })} send={body => warrantyClient.claimCommand(c.id, 'resolve', body)} onSaved={onSaved}>
    <Textarea label="Actual Claim Resolution" required value={resolution} onChange={e => setResolution(e.target.value)} />
    <WarrantyEvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </IdempotentActionForm>;
}
