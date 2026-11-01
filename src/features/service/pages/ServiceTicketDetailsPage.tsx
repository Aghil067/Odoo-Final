import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { serviceClient } from '../services/serviceClient';
import { ServiceCommandForm, ServiceTriageForm, ServiceAssignForm, ServiceResponseForm, ServiceSafetyForm, ServiceHoldForm, ServiceResolutionForm, ServiceClosureForm, ServiceFeedbackForm, ServiceEscalationForm } from '../components/ServiceTicketWorkForms';
import { ServiceVisitPlanForm, ServiceVisitStartForm, ServiceVisitCompleteForm } from '../components/ServiceVisitWorkForms';
import { ServiceDiagnosisForm, ServiceRepairPlanForm, ServiceRepairCompleteForm, ServiceChecklistForm, ServicePartRequestForm } from '../components/ServiceExecutionForms';
import { ServiceEvidencePanel } from '../components/ServiceEvidencePanel';
import { ServiceRecordCollection, ServiceWarrantyContext } from '../components/ServiceRecordCollection';
const date = (s: string | null | undefined) => s ? new Date(s).toLocaleString() : 'Not Recorded';
export function ServiceTicketDetailsPage() {
  const { id } = useParams(), { user } = useAuth(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'overview', admin = user?.role === 'admin', technician = user?.role === 'technician', coordinator = admin || user?.role === 'service_manager';
  const [record, setRecord] = useState<Awaited<ReturnType<typeof serviceClient.workContext>> | null>(null), [selectedVisit, setSelectedVisit] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id)
      return;
    const r = await serviceClient.workContext(id);
    if (generation !== requestGeneration.current) return;
    setRecord(r);
    setError('');
  }, [
    id
  ]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    if (user?.role === 'sales_executive')
      return;
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
    invalidate, refresh, retry, user?.role
  ]);
  if (user?.role === 'sales_executive')
    return <Navigate to="/service/tickets" replace />;
  if (loading)
    return <p>Loading authorized service workflow...</p>;
  if (error || !record)
    return <Card>
      <p role="alert">
        {error || 'Service ticket unavailable.'}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card>;
  const t = record.ticket, context = {
    ticket: t, files: record.evidence, onSaved: refresh
  }, mutable = ![
    'RESOLVED', 'CLOSED', 'CANCELLED'
  ].includes(t.status), visit = record.visits.find(v => v.id === selectedVisit), fieldActor = visit && (admin || (technician && visit.userId === user?.id)), executing = mutable && fieldActor && visit.status === 'IN_PROGRESS' && visit.siteAccess === 'CONFIRMED', assignment = record.assignments.find(a => !a.endedAt);
  return <div className="space-y-5 max-w-7xl mx-auto">
    <Link className="text-green-700" to="/service/tickets">Back to Service Tickets</Link>
    <h1 className="text-2xl font-bold">
      {t.reference}
    </h1>
    <p className="text-sm text-slate-500">
      {t.status}; version {t.version}; execution cycle {t.executionRevision}
    </p>
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {[
        'overview', 'triage', 'visits', 'execution', 'parts', 'evidence', 'warranty', 'history', ...(coordinator ? [
          'feedback'
        ] : [])
      ].map(v => <Button key={v} variant={tab === v ? 'primary' : 'ghost'} onClick={() => setParams({
        tab: v
      })}>
        {v}
      </Button>)}
    </div>
    <div key={t.version + ':' + tab} className="space-y-5">
      {tab === 'overview' && <>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <h2 className="font-semibold">Reported Issue</h2>
            <p className="font-medium mt-2">
              {t.reportedIssue}
            </p>
            <p className="whitespace-pre-wrap mt-2">
              {t.description}
            </p>
            <p className="text-sm mt-2">Category {t.category}; priority {t.priority}; channel {t.channel}
            </p>
            <p className="text-sm">Opened {date(t.openedAt)}; first response {date(t.firstResponseAt)}
            </p>
            <p className="text-sm">Safety concern: {t.safetyConcern ? 'Yes' : 'Not Flagged'}; safety review {date(t.safetyReviewedAt)}; visit required {t.requiresVisit ? 'Yes' : 'No'}
            </p>
            <p className="text-sm">Resolution: {t.resolutionNotes ?? 'Not Recorded'}
            </p>
          </Card>
          <Card>
            <h2 className="font-semibold">Actual SLA Clock</h2>
            {t.sla?.configured ? <>
              <p>Clock: elapsed UTC, without pauses.</p>
              <p>First response due: {date(t.sla.firstResponseDueAt)}
              </p>
              <p>Resolution due: {date(t.sla.resolutionDueAt)}
              </p>
              <p>First response breached: {t.sla.firstResponseBreached ? 'Yes' : 'No'}
              </p>
              <p>Resolution breached: {t.sla.resolutionBreached ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-slate-500">As of {date(t.sla.asOf)}; holds keep the original clock.</p>
            </> : <p>No SLA policy configured; deadlines and breaches are unavailable.</p>}
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold">Current Service Assignment</h2>
          {assignment ? <p>
            {assignment.user?.name ?? assignment.userId}; acknowledged {date(assignment.acknowledgedAt)}
          </p> : <p>No active service assignment.</p>}
        </Card>
        {technician && mutable && assignment?.userId === user.id && !assignment.acknowledgedAt && <ServiceCommandForm ticket={t} title="Acknowledge My Service Assignment" action="acknowledge" onSaved={refresh}>
          <p>Acknowledges the actual current assignment; availability is checked separately when booking a visit.</p>
        </ServiceCommandForm>}
        {coordinator && mutable && !t.firstResponseAt && <ServiceResponseForm {...context} />}
        {admin && mutable && t.safetyConcern && !t.safetyReviewedAt && <ServiceSafetyForm {...context} />}
        {coordinator && mutable && [
          'TRIAGED', 'ASSIGNED', 'VISIT_SCHEDULED', 'IN_PROGRESS'
        ].includes(t.status) && <>
            <ServiceHoldForm ticket={t} onSaved={refresh} />
            <ServiceResolutionForm {...context} />
          </>}
        {coordinator && [
          'ON_HOLD', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_PARTS'
        ].includes(t.status) && <ServiceCommandForm ticket={t} title="Resume Held Service Work" action="resume" onSaved={refresh}>
            <p>Restores the recorded working state. The original SLA clock remains unchanged.</p>
          </ServiceCommandForm>}
        {admin && t.status === 'RESOLVED' && <ServiceClosureForm ticket={t} onSaved={refresh} />}
        {admin && [
          'RESOLVED', 'CLOSED'
        ].includes(t.status) && <ServiceCommandForm ticket={t} title="Explicitly Reopen Service Ticket" action="reopen" onSaved={refresh}>
            <p>Creates a new execution cycle and preserves the original SLA clock. Completed maintenance occurrences cannot be silently reopened.</p>
          </ServiceCommandForm>}
        {coordinator && mutable && <ServiceCommandForm ticket={t} title="Cancel Service Ticket" action="cancel" onSaved={refresh}>
          <p>Dispose of active visits, repairs and pending parts explicitly first. Cancellation preserves history.</p>
        </ServiceCommandForm>}
      </>}
      {tab === 'triage' && <>
        {coordinator && mutable && [
          'OPEN', 'REOPENED', 'TRIAGED'
        ].includes(t.status) && <ServiceTriageForm ticket={t} admin={admin} onSaved={refresh} />}
        {coordinator && mutable && <ServiceEscalationForm ticket={t} onSaved={refresh} />}
        {coordinator && mutable && [
          'TRIAGED', 'ASSIGNED', 'IN_PROGRESS'
        ].includes(t.status) && <ServiceAssignForm ticket={t} onSaved={refresh} />}
        {!coordinator && <Card>Triage and assignment require service coordinator authority.</Card>}
      </>}
      {(tab === 'visits' || tab === 'execution') && <Card>
        <Select label="Current-cycle Service Visit" value={selectedVisit} options={[
          {
            value: '', label: 'Choose Recorded Visit'
          }, ...record.visits.map(v => ({
            value: v.id, label: (v.assignment?.user.name ?? v.userId) + ' | ' + v.status + ' | ' + date(v.scheduledStartAt)
          }))
        ]} onChange={e => setSelectedVisit(e.target.value)} />
        {visit && <div className="mt-3 text-sm">
          <p>Booked {date(visit.scheduledStartAt)} through {date(visit.scheduledEndAt)}
          </p>
          <p>Observed arrival {date(visit.arrivedAt)}; observed departure {date(visit.departedAt)}; access {visit.siteAccess}
          </p>
          <p>
            {visit.workPerformed ?? 'No work outcome recorded.'}
          </p>
          <p>
            {visit.outcome}
          </p>
        </div>}
      </Card>}
      {tab === 'visits' && <>
        {coordinator && mutable && [
          'ASSIGNED', 'IN_PROGRESS', 'VISIT_SCHEDULED'
        ].includes(t.status) && <ServiceVisitPlanForm ticket={t} assignments={record.assignments} onSaved={refresh} />}
        {visit && coordinator && mutable && visit.status === 'SCHEDULED' && <>
          <ServiceVisitPlanForm key={visit.id + ':' + visit.version} ticket={t} assignments={record.assignments} visit={visit} onSaved={refresh} />
          <ServiceCommandForm ticket={t} title="Cancel Unstarted Service Visit" action="" fields={() => ({
            visitVersion: visit.version
          })} send={body => serviceClient.visit(t.id, visit.id, 'cancel', body)} onSaved={refresh}>
            <p>Preserves the canceled booking; started visits require actual departure and outcome.</p>
          </ServiceCommandForm>
        </>}
        {visit && mutable && fieldActor && visit.status === 'SCHEDULED' && <ServiceVisitStartForm key={visit.id} {...context} visit={visit} />}
        {visit && mutable && fieldActor && visit.status === 'IN_PROGRESS' && <ServiceVisitCompleteForm key={visit.id} {...context} visit={visit} />}
        <ServiceRecordCollection ticket={t} kind="visits" onSaved={refresh} />
      </>}
      {tab === 'execution' && <>
        {visit && executing && <>
          <ServiceDiagnosisForm key={'diagnosis' + visit.id} {...context} visit={visit} diagnoses={record.diagnoses} />
          <ServiceRepairPlanForm key={'repair' + visit.id} {...context} visit={visit} />
        </>}
        {mutable && (coordinator || executing) && <ServiceChecklistForm {...context} />}
        {record.repairs.map(r => {
          const linked = record.visits.find(v => v.id === r.visitId), canExecute = mutable && linked?.status === 'IN_PROGRESS' && linked.siteAccess === 'CONFIRMED' && (admin || technician && linked.userId === user?.id);
          return <Card key={r.id}>
            <h2 className="font-semibold">
              {r.type}: {r.status}
            </h2>
            <p>
              {r.description}
            </p>
            {r.outcome && <p>Outcome: {r.outcome}; follow-up {r.followUpRequired ? 'Required' : 'Not Required'}
            </p>}
            {r.type === 'COMPONENT_REPLACEMENT' ? <p className="text-amber-800">Replacement execution is unsupported until an authorized service parts/serial workflow exists.</p> : <>
              {canExecute && r.status === 'PLANNED' && <ServiceCommandForm ticket={t} title="Start Planned Repair" action="" fields={() => ({
                repairVersion: r.version
              })} send={body => serviceClient.repair(t.id, r.id, 'start', body)} onSaved={refresh}>
                <p>Start actual work during this qualified booked visit.</p>
              </ServiceCommandForm>}
              {canExecute && r.status === 'IN_PROGRESS' && <ServiceRepairCompleteForm {...context} repair={r} />}
            </>}
            {coordinator && mutable && r.status === 'PLANNED' && <ServiceCommandForm ticket={t} title="Cancel Unstarted Repair" action="" fields={() => ({
              repairVersion: r.version
            })} send={body => serviceClient.repair(t.id, r.id, 'cancel', body)} onSaved={refresh}>
              <p>Preserves planned work in history.</p>
            </ServiceCommandForm>}
            {admin && executing && visit && r.status === 'COMPLETED' && r.followUpRequired && <ServiceCommandForm ticket={t} title="Rework Repair in Selected Follow-up Visit" action="" fields={() => ({
              repairVersion: r.version, visitId: visit.id
            })} send={body => serviceClient.repair(t.id, r.id, 'rework', body)} onSaved={refresh}>
              <p>Moves explicitly required rework into the selected current running visit without rewriting the previous outcome.</p>
            </ServiceCommandForm>}
          </Card>;
        })}
        <ServiceRecordCollection ticket={t} kind="diagnoses" onSaved={refresh} />
        <ServiceRecordCollection ticket={t} kind="checklist" onSaved={refresh} />
      </>}
      {tab === 'parts' && <>
        {mutable && <ServicePartRequestForm ticket={t} onSaved={refresh} />}
        <ServiceRecordCollection ticket={t} kind="parts" admin={admin} onSaved={refresh} />
      </>}
      {tab === 'evidence' && <ServiceEvidencePanel {...context} visits={record.visits} technician={technician} />}
      {tab === 'warranty' && <ServiceWarrantyContext id={t.id} />}
      {tab === 'history' && <ServiceRecordCollection ticket={t} kind="history" onSaved={refresh} />}
      {tab === 'feedback' && coordinator && <>
        {t.status === 'RESOLVED' && <ServiceFeedbackForm {...context} />}
        <ServiceRecordCollection ticket={t} kind="feedback" onSaved={refresh} />
        <ServiceRecordCollection ticket={t} kind="reviews" onSaved={refresh} />
      </>}
    </div>
  </div>;
}
