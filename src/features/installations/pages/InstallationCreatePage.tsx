import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { inventoryClient, type DispatchRecord } from '../../inventory/services/inventoryClient';
import { installationClient, installationTestTypes, type InstallationUser, type TestRequirement } from '../services/installationClient';
const dispatches = (q: RecordQuery) => inventoryClient.dispatches(q), admins = (q: RecordQuery) => installationClient.assignees('ADMIN', q), technicians = (q: RecordQuery) => installationClient.assignees('TECHNICIAN', q);
export function InstallationCreatePage() {
  const { id } = useParams(), { user } = useAuth(), navigate = useNavigate();
  const [dispatch, setDispatch] = useState<DispatchRecord | null>(null), [coordinator, setCoordinator] = useState<InstallationUser | null>(null), [choice, setChoice] = useState<InstallationUser | null>(null), [assigned, setAssigned] = useState<InstallationUser[]>([]), [name, setName] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState(''), [reason, setReason] = useState(''), [safety, setSafety] = useState(''), [notes, setNotes] = useState(''), [requirements, setRequirements] = useState<TestRequirement[]>(installationTestTypes.map(type => ({
    type, required: type !== 'BATTERY', basis: '', measurementRequired: false, unit: null
  }))), [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (id)
    return <Navigate to={'/installations/' + id + '?tab=plan'} replace />;
  if (user?.role !== 'admin')
    return <Navigate to="/unauthorized" replace />;
  const update = (i: number, fields: Partial<TestRequirement>) => setRequirements(rows => rows.map((r, n) => n === i ? {
    ...r, ...fields
  } : r));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy)
      return;
    setError('');
    setBusy(true);
    try {
      if (!dispatch || !coordinator || !assigned.length)
        throw new Error('Choose a dispatch, coordinator and at least one technician.');
      const full = await inventoryClient.dispatch(dispatch.id), reservation = await inventoryClient.reservation(full.reservationId);
      if (full.lines?.some(l => l.returnedQuantity !== '0'))
        throw new Error('A returned dispatch cannot initialize a full installation.');
      const job = await installationClient.create({
        name, dispatchId: full.id, reservationId: reservation.id, configurationId: reservation.configurationId, configurationApprovedVersion: reservation.configurationVersion, configurationReviewId: reservation.configurationReviewId, bomId: reservation.bomId, bomVersion: reservation.bomVersion, coordinatorId: coordinator.id, technicianIds: assigned.map(t => t.id), plannedStartAt: new Date(start).toISOString(), plannedEndAt: new Date(end).toISOString(), siteReadinessNotes: notes || null, safetyNotes: safety || null, testRequirements: requirements, reason
      });
      navigate('/installations/' + job.id);
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Could not plan installation.');
    }
    finally {
      setBusy(false);
    }
  }
  return <div className="max-w-5xl mx-auto space-y-5">
    <Link className="text-green-700" to="/installations">Back to Installations</Link>
    <h1 className="text-2xl font-bold">Plan Installation</h1>
    <p className="text-sm text-slate-500">Use the exact approved design and fully dispatched BOM. Warehouse release does not confirm physical delivery. Scheduling eligibility is checked by the workforce backend.</p>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Installation Name" value={name} onChange={e => setName(e.target.value)} required maxLength={160} />
            <PagedRecordSelect label="Warehouse Dispatch" selected={dispatch} onChange={setDispatch} load={dispatches} describe={d => d.reference} required />
            <Input label="Planned Start (Local Time)" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />
            <Input label="Planned End (Local Time)" type="datetime-local" value={end} min={start} onChange={e => setEnd(e.target.value)} required />
            <PagedRecordSelect label="Installation Coordinator" selected={coordinator} onChange={setCoordinator} load={admins} describe={u => u.name} required />
            <div>
              <PagedRecordSelect label="Installation Technician" selected={choice} onChange={u => {
                setChoice(u);
                if (u && !assigned.some(t => t.id === u.id))
                  setAssigned(a => [
                    ...a, u
                  ]);
              }} load={technicians} describe={u => u.name} />
              <ul className="mt-2 space-y-1">
                {assigned.map(u => <li key={u.id} className="flex justify-between">
                  {u.name}
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAssigned(a => a.filter(t => t.id !== u.id))}>Remove</Button>
                </li>)}
              </ul>
            </div>
            <Textarea label="Site Readiness Planning Notes" value={notes} onChange={e => setNotes(e.target.value)} />
            <Textarea label="Safety Planning Notes" value={safety} onChange={e => setSafety(e.target.value)} />
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-2">Design-specific Test Requirements</h2>
          <p className="text-sm text-slate-500 mb-4">Record the approved design or manufacturer basis for every test. Specify measured units only where required. Battery and mounting applicability must match the dispatched design. Do not enter invented thresholds.</p>
          <div className="space-y-4">
            {requirements.map((r, i) => <div key={r.type} className="border rounded-lg p-3 space-y-3">
              <h3 className="font-medium">
                {r.type.replaceAll('_', ' ')}
              </h3>
              <div className="flex flex-wrap gap-5">
                <label>
                  <input type="checkbox" checked={r.required} onChange={e => update(i, {
                    required: e.target.checked
                  })} /> Required by Design</label>
                <label>
                  <input type="checkbox" checked={r.measurementRequired} onChange={e => update(i, {
                    measurementRequired: e.target.checked, unit: e.target.checked ? '' : null
                  })} /> Measurement Required</label>
              </div>
              <Textarea label={r.type + ' Requirements Basis'} value={r.basis} required onChange={e => update(i, {
                basis: e.target.value
              })} />
              {r.measurementRequired && <Input label={r.type + ' Measurement Unit'} required value={r.unit ?? ''} onChange={e => update(i, {
                unit: e.target.value
              })} />}
            </div>)}
          </div>
        </Card>
        <Card>
          <Textarea label="Planning Reason" value={reason} onChange={e => setReason(e.target.value)} required />
        </Card>
      </fieldset>
      {error && <p role="alert" className="text-red-700">
        {error}
      </p>}
      <Button type="submit" isLoading={busy}>Create Installation Plan</Button>
    </form>
  </div>;
}
