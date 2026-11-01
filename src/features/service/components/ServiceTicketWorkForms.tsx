import { useCallback, useState, type ReactNode } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { serviceClient, serviceCategories, servicePriorities, serviceChecks, type ServiceTicket, type ServiceEvidence, type ServicePerson, type ServiceSlaPolicy } from '../services/serviceClient';
export type ServiceContext = {
  ticket: ServiceTicket;
  files: ServiceEvidence[];
  onSaved: () => Promise<void>;
};
export function ServiceCommandForm({ ticket, title, action, fields, children, onSaved, send }: {
  ticket: ServiceTicket;
  title: string;
  action: string;
  fields?: () => Record<string, unknown>;
  children: ReactNode;
  onSaved: () => Promise<void>;
  send?: (body: unknown) => Promise<unknown>;
}) {
  return <IdempotentActionForm title={title} build={reason => ({
    version: ticket.version, reason, ...fields?.()
  })} send={send ?? (body => serviceClient.command(ticket.id, action, body))} onSaved={onSaved}>
    {children}
  </IdempotentActionForm>;
}
export function ServiceEvidenceChoice({ ticket, files, value, onChange, visitId }: {
  ticket: ServiceTicket;
  files: ServiceEvidence[];
  value: string[];
  onChange: (ids: string[]) => void;
  visitId?: string;
}) {
  const eligible = files.filter(f => f.executionRevision === ticket.executionRevision && (!visitId || f.visitId === visitId));
  return <fieldset className="border rounded-lg p-3">
    <legend className="font-medium text-sm">Current-cycle Evidence{visitId ? ' for This Visit' : ''}
    </legend>
    {eligible.map(f => <label className="block text-sm py-1" key={f.id}>
      <input type="checkbox" checked={value.includes(f.id)} onChange={e => onChange(e.target.checked ? [
        ...value, f.id
      ] : value.filter(v => v !== f.id))} /> {f.fileName} ({f.type.replaceAll('_', ' ')})</label>)}
    {!eligible.length && <p className="text-sm text-amber-800">Upload evidence for this current cycle and visit where required.</p>}
  </fieldset>;
}
const policies = (q: RecordQuery) => serviceClient.policies(q), skills = (q: RecordQuery) => serviceClient.skills(q);
export function ServiceTriageForm({ ticket: t, admin, onSaved }: {
  ticket: ServiceTicket;
  admin: boolean;
  onSaved: () => Promise<void>;
}) {
  const [category, setCategory] = useState(t.category), [priority, setPriority] = useState(t.priority), [ownerRole, setOwnerRole] = useState('ADMIN'), [owner, setOwner] = useState<ServicePerson | null>(null), [impact, setImpact] = useState(t.customerImpact ?? ''), [safety, setSafety] = useState(t.safetyConcern), [reviewed, setReviewed] = useState(false), [visit, setVisit] = useState(t.requiresVisit), [notes, setNotes] = useState(t.troubleshootingNotes ?? ''), [escalation, setEscalation] = useState(t.escalationReason ?? ''), [checks, setChecks] = useState(t.requiredChecks), [skillIds, setSkillIds] = useState(t.requiredSkillIds), [skill, setSkill] = useState<{
    id: string;
    code: string;
    name: string;
    minimumLevel: number;
    requiresCertification: boolean;
  } | null>(null), [sla, setSla] = useState<ServiceSlaPolicy | null>(null), loadOwner = useCallback((q: RecordQuery) => serviceClient.people(ownerRole, t.installationId, q), [
    ownerRole, t.installationId
  ]);
  return <ServiceCommandForm ticket={t} title="Record Service Triage" action="triage" fields={() => {
    if (!owner && !t.supportOwnerId)
      throw new Error('Choose an authorized support owner.');
    return {
      category, priority, supportOwnerId: owner?.id ?? t.supportOwnerId, customerImpact: impact, safetyConcern: safety, safetyReviewed: reviewed, requiresVisit: visit, troubleshootingNotes: notes, escalationReason: escalation || null, requiredSkillIds: skillIds, requiredChecks: checks, slaPolicyId: t.slaPolicyId ?? sla?.id ?? null
    };
  }} onSaved={onSaved}>
    <div className="grid sm:grid-cols-2 gap-3">
      <Select label="Triaged Category" value={category} options={serviceCategories.map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setCategory(e.target.value)} />
      <Select label="Triaged Priority" value={priority} options={servicePriorities.map(v => ({
        value: v, label: v
      }))} onChange={e => setPriority(e.target.value)} />
    </div>
    <Select label="Support Owner Role" value={ownerRole} options={[
      {
        value: 'ADMIN', label: 'Administrator'
      }, {
        value: 'SUPPORT', label: 'Granted Support User'
      }
    ]} onChange={e => {
      setOwnerRole(e.target.value);
      setOwner(null);
    }} />
    <PagedRecordSelect label="Service Support Owner" selected={owner} onChange={setOwner} load={loadOwner} describe={u => u.name} />
    {t.supportOwnerId && !owner && <p className="text-sm">Retaining current support owner {t.supportOwnerId}.</p>}
    <Textarea label="Customer Impact" required value={impact} onChange={e => setImpact(e.target.value)} />
    <label className="block">
      <input type="checkbox" checked={safety || priority === 'CRITICAL'} disabled={t.safetyConcern || priority === 'CRITICAL'} onChange={e => setSafety(e.target.checked)} /> Safety Concern Identified</label>
    {admin && <label className="block">
      <input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> Administrator Has Completed Internal Safety Review</label>}
    <label className="block">
      <input type="checkbox" checked={visit || safety || priority === 'CRITICAL'} disabled={safety || priority === 'CRITICAL'} onChange={e => setVisit(e.target.checked)} /> On-site Visit Required</label>
    <Textarea label="Triage Troubleshooting Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <Textarea label="Escalation Reason (If Applicable)" value={escalation} onChange={e => setEscalation(e.target.value)} />
    <fieldset>
      <legend className="font-medium">Required Service Checks</legend>
      {serviceChecks.map(c => <label key={c} className="block text-sm py-1">
        <input type="checkbox" checked={checks.includes(c)} disabled={t.requiredChecks.includes(c)} onChange={e => setChecks(e.target.checked ? [
          ...checks, c
        ] : checks.filter(v => v !== c))} /> {c.replaceAll('_', ' ')}
      </label>)}
    </fieldset>
    <PagedRecordSelect label="Additional Required Workforce Skill" selected={skill} onChange={s => {
      setSkill(s);
      if (s && !skillIds.includes(s.id))
        setSkillIds(ids => [
          ...ids, s.id
        ]);
    }} load={skills} describe={s => s.code + ' - ' + s.name} />
    <ul className="text-sm">
      {skillIds.map(id => <li className="flex gap-2 items-center" key={id}>
        {id}
        <Button type="button" size="sm" variant="ghost" onClick={() => setSkillIds(ids => ids.filter(v => v !== id))}>Remove Skill Requirement</Button>
      </li>)}
    </ul>
    {t.slaPolicyId ? <p className="text-sm">Original SLA is pinned: {t.slaPolicyId}. Its elapsed clock remains unchanged.</p> : <PagedRecordSelect label="Applicable Triage SLA (Optional)" selected={sla} onChange={setSla} load={policies} describe={s => s.reference + ' v' + s.revision + ' | ' + s.category + ' | ' + s.priority} />}
  </ServiceCommandForm>;
}
export function ServiceAssignForm({ ticket: t, onSaved }: Omit<ServiceContext, 'files'>) {
  const [person, setPerson] = useState<ServicePerson | null>(null), load = useCallback((q: RecordQuery) => serviceClient.people('TECHNICIAN', t.installationId, q), [
    t.installationId
  ]);
  return <ServiceCommandForm ticket={t} title="Assign Service Technician" action="assign" fields={() => {
    if (!person)
      throw new Error('Choose an active technician.');
    return {
      userId: person.id
    };
  }} onSaved={onSaved}>
    <PagedRecordSelect label="Assigned Service Technician" selected={person} onChange={setPerson} load={load} describe={u => u.name} required />
    <p className="text-sm">Assignment does not confirm availability. The technician must acknowledge before a visit can be booked; scheduling rechecks workforce qualifications and conflicts.</p>
  </ServiceCommandForm>;
}
export function ServiceResponseForm({ ticket: t, files, onSaved }: ServiceContext) {
  const [at, setAt] = useState(''), [channel, setChannel] = useState(''), [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Actual First Response" action="response" fields={() => ({
    observedAt: new Date(at).toISOString(), channel, notes, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Input label="Observed First Customer Response (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
    <Input label="Actual Response Channel" required value={channel} onChange={e => setChannel(e.target.value)} />
    <Textarea label="Response Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} value={evidence} onChange={setEvidence} />
  </ServiceCommandForm>;
}
export function ServiceSafetyForm({ ticket: t, files, onSaved }: ServiceContext) {
  const [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Internal Service Safety Review" action="safety-review" fields={() => ({
    notes, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Textarea label="Safety Review Findings" required value={notes} onChange={e => setNotes(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Internal administrator review is not regulatory certification. Safety-related field work requires managed verified staffing.</p>
  </ServiceCommandForm>;
}
export function ServiceHoldForm({ ticket: t, onSaved }: Omit<ServiceContext, 'files'>) {
  const [status, setStatus] = useState('ON_HOLD');
  return <ServiceCommandForm ticket={t} title="Hold Service Work" action="hold" fields={() => ({
    status
  })} onSaved={onSaved}>
    <Select label="Service Hold State" value={status} options={[
      'ON_HOLD', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_PARTS'
    ].map(v => ({
      value: v, label: v.replaceAll('_', ' ')
    }))} onChange={e => setStatus(e.target.value)} />
    <p className="text-sm text-amber-800">Cancel or complete active visits before holding. SLA clocks continue during every hold.</p>
  </ServiceCommandForm>;
}
export function ServiceResolutionForm({ ticket: t, files, onSaved }: ServiceContext) {
  const [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Resolve Service Ticket" action="resolve" fields={() => ({
    resolutionNotes: notes, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Textarea label="Actual Technical Resolution" required value={notes} onChange={e => setNotes(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Required checks, visits, repairs, safety review, first response and pending parts must all be reconciled.</p>
  </ServiceCommandForm>;
}
export function ServiceClosureForm({ ticket: t, onSaved }: Omit<ServiceContext, 'files'>) {
  const names = [
    'mandatoryWorkReviewed', 'customerResponseReviewed', 'evidenceReviewed', 'safetyReviewed'
  ], [checks, setChecks] = useState<Record<string, boolean>>({}), [notes, setNotes] = useState('');
  return <ServiceCommandForm ticket={t} title="Independently Close Service Ticket" action="close" fields={() => ({
    notes, checklist: Object.fromEntries(names.map(n => [
      n, checks[n] ?? false
    ]))
  })} onSaved={onSaved}>
    {names.map(n => <label className="block" key={n}>
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Textarea label="Independent Closure Review Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm">A different administrator must review technical resolution. An attested customer acknowledgement is required.</p>
  </ServiceCommandForm>;
}
export function ServiceFeedbackForm({ ticket: t, files, onSaved }: ServiceContext) {
  const [acknowledged, setAcknowledged] = useState(false), [rating, setRating] = useState(''), [comments, setComments] = useState(''), [source, setSource] = useState(''), [at, setAt] = useState(''), [attestation, setAttestation] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Observed Customer Feedback" action="feedback" fields={() => ({
    acknowledged, rating: rating ? Number(rating) : null, comments: comments || null, source, observedAt: new Date(at).toISOString(), attestation, evidenceIds: evidence
  })} onSaved={onSaved}>
    <label className="block">
      <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /> Customer Actually Acknowledged the Outcome</label>
    <Input label="Observed Customer Rating (Optional)" type="number" min={1} max={5} value={rating} onChange={e => setRating(e.target.value)} />
    <Textarea label="Customer Comments (If Provided)" value={comments} onChange={e => setComments(e.target.value)} />
    <Input label="Feedback Source" required value={source} onChange={e => setSource(e.target.value)} />
    <Input label="Observed Feedback Time (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
    <Textarea label="Recorder Attestation" required value={attestation} onChange={e => setAttestation(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} value={evidence} onChange={setEvidence} />
  </ServiceCommandForm>;
}
export function ServiceEscalationForm({ ticket: t, onSaved }: Omit<ServiceContext, 'files'>) {
  const [priority, setPriority] = useState(t.priority), [impact, setImpact] = useState(''), [safety, setSafety] = useState(t.safetyConcern), [reason, setReason] = useState('');
  return <ServiceCommandForm ticket={t} title="Escalate Service Ticket" action="escalate" fields={() => ({
    priority, customerImpact: impact, safetyConcern: safety, escalationReason: reason
  })} onSaved={onSaved}>
    <Select label="Escalated Priority" value={priority} options={servicePriorities.map(v => ({
      value: v, label: v
    }))} onChange={e => setPriority(e.target.value)} />
    <Textarea label="Escalated Customer Impact" required value={impact} onChange={e => setImpact(e.target.value)} />
    <label className="block">
      <input type="checkbox" checked={safety} disabled={t.safetyConcern} onChange={e => setSafety(e.target.checked)} /> Safety Concern</label>
    <Textarea label="Escalation Explanation" required value={reason} onChange={e => setReason(e.target.value)} />
  </ServiceCommandForm>;
}
