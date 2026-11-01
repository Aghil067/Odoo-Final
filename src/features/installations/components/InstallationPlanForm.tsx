import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { installationClient, type InstallationJob, type InstallationUser } from '../services/installationClient';
import { InstallationActionForm, localDateInput } from './InstallationWorkForms';
import { Button } from '../../../components/ui/Button';
const admins = (q: RecordQuery) => installationClient.assignees('ADMIN', q), technicians = (q: RecordQuery) => installationClient.assignees('TECHNICIAN', q);
export function InstallationPlanForm({ job, admin, onSaved }: {
  job: InstallationJob;
  admin: boolean;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(job.name), [start, setStart] = useState(localDateInput(job.plannedStartAt)), [end, setEnd] = useState(localDateInput(job.plannedEndAt)), [safety, setSafety] = useState(job.safetyNotes ?? ''), [readiness, setReadiness] = useState(job.siteReadinessNotes ?? ''), [completion, setCompletion] = useState(job.completionNotes ?? '');
  const [coordinator, setCoordinator] = useState<InstallationUser | null>({
    id: job.coordinatorId, name: 'Current Coordinator', role: 'ADMIN'
  }), [choice, setChoice] = useState<InstallationUser | null>(null), [assigned, setAssigned] = useState((job.assignments ?? []).map(a => a.user));
  const completed = [
    'WORK_COMPLETED', 'TESTING'
  ].includes(job.status);
  return <div className="space-y-5">
    <InstallationActionForm title="Save Installation Notes and Plan" submit={async (reason) => {
      await installationClient.update(job.id, {
        version: job.version, reason, completionNotes: completion || null, ...(!completed ? {
          name, safetyNotes: safety || null, siteReadinessNotes: readiness || null, ...(admin ? {
            plannedStartAt: new Date(start).toISOString(), plannedEndAt: new Date(end).toISOString()
          } : {})
        } : {})
      });
      await onSaved();
    }}>
      {!completed && <>
        <Input label="Installation Name" required value={name} onChange={e => setName(e.target.value)} />
        {admin && <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Planned Start (Local Time)" type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} />
          <Input label="Planned End (Local Time)" type="datetime-local" required min={start} value={end} onChange={e => setEnd(e.target.value)} />
        </div>}
        <Textarea label="Safety Notes" value={safety} onChange={e => setSafety(e.target.value)} />
        <Textarea label="Site Readiness Notes" value={readiness} onChange={e => setReadiness(e.target.value)} />
      </>}
      <Textarea label="Completion Notes" value={completion} onChange={e => setCompletion(e.target.value)} />
    </InstallationActionForm>
    {admin && !completed && <InstallationActionForm title="Assign Installation Staff" submit={async (reason) => {
      if (!coordinator || !assigned.length)
        throw new Error('Select a coordinator and at least one technician.');
      await installationClient.command(job.id, 'assign', {
        version: job.version, reason, coordinatorId: coordinator.id, technicianIds: assigned.map(u => u.id)
      });
      await onSaved();
    }}>
      <PagedRecordSelect label="Installation Coordinator" selected={coordinator} onChange={setCoordinator} load={admins} describe={u => u.name} required />
      <PagedRecordSelect label="Additional Installation Technician" selected={choice} onChange={u => {
        setChoice(u);
        if (u && !assigned.some(a => a.id === u.id))
          setAssigned(a => [
            ...a, u
          ]);
      }} load={technicians} describe={u => u.name} />
      <ul>
        {assigned.map(u => <li className="flex justify-between" key={u.id}>
          {u.name}
          <Button type="button" variant="ghost" onClick={() => setAssigned(a => a.filter(t => t.id !== u.id))}>Remove</Button>
        </li>)}
      </ul>
    </InstallationActionForm>}
  </div>;
}
