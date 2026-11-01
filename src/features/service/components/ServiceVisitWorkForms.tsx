import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { serviceClient, type ServiceAssignment, type ServiceVisit } from '../services/serviceClient';
import { ServiceCommandForm, ServiceEvidenceChoice, type ServiceContext } from './ServiceTicketWorkForms';
const local = (v: string) => new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export function ServiceVisitPlanForm({ ticket: t, assignments, visit, onSaved }: Omit<ServiceContext, 'files'> & {
  assignments: ServiceAssignment[];
  visit?: ServiceVisit;
}) {
  const [assignment, setAssignment] = useState(visit?.assignmentId ?? ''), [from, setFrom] = useState(visit ? local(visit.scheduledStartAt) : ''), [to, setTo] = useState(visit ? local(visit.scheduledEndAt) : ''), [legacy, setLegacy] = useState(false), [notes, setNotes] = useState(''), [availability, setAvailability] = useState<Awaited<ReturnType<typeof serviceClient.availability>> | null>(null), [checking, setChecking] = useState(false), [error, setError] = useState('');
  const current = assignments.filter(a => !a.endedAt && a.acknowledgedAt);
  function fields() {
    if (!assignment)
      throw new Error('Choose an acknowledged current assignment.');
    return {
      assignmentId: assignment, scheduledStartAt: new Date(from).toISOString(), scheduledEndAt: new Date(to).toISOString(), legacyUncertaintyAcknowledged: legacy, schedulingNotes: notes, ...(visit ? {
        visitVersion: visit.version
      } : {})
    };
  }
  return <ServiceCommandForm ticket={t} title={visit ? 'Reschedule Unstarted Service Visit' : 'Book Service Visit'} action="visits" fields={fields} send={visit ? body => serviceClient.reschedule(t.id, visit.id, body) : undefined} onSaved={onSaved}>
    <Select label="Acknowledged Service Assignment" required disabled={!!visit} value={assignment} options={[
      {
        value: '', label: 'Choose Current Acknowledged Assignment'
      }, ...current.map(a => ({
        value: a.id, label: a.user?.name ?? a.userId
      }))
    ]} onChange={e => {
      setAssignment(e.target.value);
      setAvailability(null);
    }} />
    <Input label="Booked Visit Start (Local Time)" type="datetime-local" required value={from} onChange={e => {
      setFrom(e.target.value);
      setAvailability(null);
    }} />
    <Input label="Booked Visit End (Local Time)" type="datetime-local" required min={from} value={to} onChange={e => {
      setTo(e.target.value);
      setAvailability(null);
    }} />
    <Button type="button" variant="outline" isLoading={checking} onClick={async () => {
      setError('');
      setChecking(true);
      try {
        const person = assignments.find(a => a.id === assignment);
        if (!person || !from || !to)
          throw new Error('Select an assignment and both visit times.');
        setAvailability(await serviceClient.availability(t.id, {
          userId: person.userId, from: new Date(from).toISOString(), to: new Date(to).toISOString()
        }));
      }
      catch (e) {
        setError(e instanceof Error ? e.message : 'Availability check failed.');
      }
      finally {
        setChecking(false);
      }
    }}>Check Workforce Availability</Button>
    {availability && <div className="text-sm">
      <p>
        {availability.name}: {availability.status}; {availability.managed ? 'Managed' : 'Legacy'}; confirmed committable {availability.committable ? 'Yes' : 'No'}.</p>
      <ul>
        {availability.reasons.map(r => <li key={r}>
          {r.replaceAll('_', ' ')}
        </li>)}
      </ul>
    </div>}
    {error && <p role="alert">
      {error}
    </p>}
    <label className="block">
      <input type="checkbox" checked={legacy} onChange={e => setLegacy(e.target.checked)} /> Explicitly Acknowledge Unverified Legacy Calendar Availability</label>
    <Textarea label="Scheduling Review Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm text-amber-800">Unknown availability is not confirmed availability. Safety-related visits require managed verified staffing. Saving rechecks conflicts, qualifications and the exact window.</p>
  </ServiceCommandForm>;
}
export function ServiceVisitStartForm({ ticket: t, files, visit: v, onSaved }: ServiceContext & {
  visit: ServiceVisit;
}) {
  const [access, setAccess] = useState(''), [safety, setSafety] = useState(false), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Actual Visit Arrival" action="" fields={() => ({
    visitVersion: v.version, siteAccess: access, safetyMeasuresVerified: safety, evidenceIds: evidence
  })} send={body => serviceClient.visit(t.id, v.id, 'start', body)} onSaved={onSaved}>
    <Select label="Observed Site Access" required value={access} options={[
      {
        value: '', label: 'Record Actual Site Access'
      }, {
        value: 'CONFIRMED', label: 'Access Confirmed'
      }, {
        value: 'DENIED', label: 'Access Denied - No Technical Work Claimed'
      }
    ]} onChange={e => setAccess(e.target.value)} />
    <label className="block">
      <input type="checkbox" checked={safety} onChange={e => setSafety(e.target.checked)} /> Required Site Safety Measures Verified</label>
    <ServiceEvidenceChoice ticket={t} files={files} visitId={v.id} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Actual arrival is recorded now, within the booked window. Upload evidence linked to this visit first.</p>
  </ServiceCommandForm>;
}
export function ServiceVisitCompleteForm({ ticket: t, files, visit: v, onSaved }: ServiceContext & {
  visit: ServiceVisit;
}) {
  const [work, setWork] = useState(''), [outcome, setOutcome] = useState(''), [followUp, setFollowUp] = useState(v.siteAccess === 'DENIED'), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Actual Visit Departure" action="" fields={() => ({
    visitVersion: v.version, workPerformed: work, outcome, followUpRequired: followUp, evidenceIds: evidence
  })} send={body => serviceClient.visit(t.id, v.id, 'complete', body)} onSaved={onSaved}>
    <Textarea label="Actual Work Performed or Access Limitation" required value={work} onChange={e => setWork(e.target.value)} />
    <Textarea label="Observed Visit Outcome" required value={outcome} onChange={e => setOutcome(e.target.value)} />
    <label className="block">
      <input type="checkbox" checked={followUp} disabled={v.siteAccess === 'DENIED'} onChange={e => setFollowUp(e.target.checked)} /> Follow-up Visit Required</label>
    <ServiceEvidenceChoice ticket={t} files={files} visitId={v.id} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Record diagnosis and dispose of unfinished repairs before departure. Denied access requires follow-up without claiming technical completion.</p>
  </ServiceCommandForm>;
}
