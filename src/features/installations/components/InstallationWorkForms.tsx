import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { installationClient, type InstallationJob, type InstallationAttachment, type InstallationEquipment, type InstallationMilestone, type InstallationIssue, type TestRequirement } from '../services/installationClient';
type Context = {
  job: InstallationJob;
  files: InstallationAttachment[];
  onSaved: () => Promise<void>;
};
export const localDateInput = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const label = (s: string) => s.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
export { RecordActionForm as InstallationActionForm } from '../../../components/common/RecordActionForm';
import { RecordActionForm as InstallationActionForm } from '../../../components/common/RecordActionForm';
function EvidenceChoice({ files, value, onChange }: {
  files: InstallationAttachment[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return <fieldset className="border rounded-lg p-3">
    <legend className="text-sm font-medium">Evidence References</legend>
    {!files.length ? <p className="text-sm text-amber-700">Upload private job evidence first.</p> : files.map(f => <label className="block text-sm py-1" key={f.id}>
      <input type="checkbox" checked={value.includes(f.id)} onChange={e => onChange(e.target.checked ? [
        ...value, f.id
      ] : value.filter(id => id !== f.id))} /> {f.fileName} ({label(f.category)})</label>)}
  </fieldset>;
}
function Checks({ names, value, onChange }: {
  names: string[];
  value: Record<string, boolean>;
  onChange: (checks: Record<string, boolean>) => void;
}) {
  return <div className="space-y-2">
    {names.map(name => <label key={name} className="block text-sm">
      <input type="checkbox" checked={value[name] ?? false} onChange={e => onChange({
        ...value, [name]: e.target.checked
      })} /> {label(name)}
    </label>)}
  </div>;
}
export function InstallationEvidenceForm({ job, onSaved }: Omit<Context, 'files'>) {
  const [file, setFile] = useState<File | null>(null), [category, setCategory] = useState('SITE_READINESS');
  return <InstallationActionForm title="Upload Installation Evidence" submit={async (reason) => {
    if (!file)
      throw new Error('Choose a file.');
    if (file.size > 5 * 1024 * 1024)
      throw new Error('Maximum file size is 5 MiB.');
    if (![
      'image/png', 'image/jpeg', 'application/pdf'
    ].includes(file.type))
      throw new Error('Only JPEG, PNG and PDF evidence is supported.');
    await installationClient.upload(job.id, file, {
      version: job.version, reason, category, fileName: file.name
    });
    await onSaved();
  }}>
    <Select label="Evidence Category" value={category} options={[
      'SITE_READINESS', 'SITE_RECEIPT', 'MILESTONE', 'ISSUE', 'TEST', 'COMPLETION', 'SUPPORTING_FILE'
    ].map(v => ({
      value: v, label: label(v)
    }))} onChange={e => setCategory(e.target.value)} />
    <Input label="Private Evidence File" type="file" accept="image/jpeg,image/png,application/pdf" required onChange={e => setFile(e.target.files?.[0] ?? null)} />
    <p className="text-xs text-slate-500">Private authorized downloads only. Maximum 5 MiB; filename must use letters, digits, spaces, underscores, periods or hyphens. File format validation is not malware scanning.</p>
  </InstallationActionForm>;
}
export function InstallationReadinessForm({ job, files, onSaved }: Context) {
  const names = [
    'siteAccessConfirmed', 'installationAreaAccessible', 'roofSiteConditionChecked', 'safetyMeasuresAvailable', 'surveyLimitationsReviewed', 'conditionalWorkAddressed'
  ], [checks, setChecks] = useState<Record<string, boolean>>({}), [notes, setNotes] = useState(''), [conditions, setConditions] = useState(''), [outstanding, setOutstanding] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <InstallationActionForm title="Record Site Readiness" submit={async (reason) => {
    await installationClient.command(job.id, 'site-readiness', {
      version: job.version, reason, checklist: Object.fromEntries(names.map(n => [
        n, checks[n] ?? false
      ])), notes, conditionalWorkResolution: conditions, outstandingIssues: outstanding || null, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <Checks names={names} value={checks} onChange={setChecks} />
    <Textarea label="Readiness Observations" required value={notes} onChange={e => setNotes(e.target.value)} />
    <Textarea label="Survey Conditions and Resolution" required value={conditions} onChange={e => setConditions(e.target.value)} />
    <Textarea label="Outstanding Readiness Issues" value={outstanding} onChange={e => setOutstanding(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
type ReceiptLine = {
  equipmentId: string;
  receivedQuantity: string;
  damagedQuantity: string;
  receivedSerialIds: string[];
  damagedSerialIds: string[];
};
export function InstallationReceiptForm({ job, files, onSaved }: Context) {
  const [lines, setLines] = useState<ReceiptLine[]>((job.equipment ?? []).map(e => ({
    equipmentId: e.id, receivedQuantity: e.receivedQuantity, damagedQuantity: e.damagedQuantity, receivedSerialIds: e.serials.filter(s => s.received).map(s => s.serialUnitId), damagedSerialIds: e.serials.filter(s => s.damaged).map(s => s.serialUnitId)
  }))), [at, setAt] = useState(''), [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  const update = (id: string, patch: Partial<ReceiptLine>) => setLines(rows => rows.map(r => r.equipmentId === id ? {
    ...r, ...patch
  } : r));
  return <InstallationActionForm title="Confirm Physical Site Receipt" submit={async (reason) => {
    await installationClient.command(job.id, 'confirm-receipt', {
      version: job.version, reason, receivedAt: new Date(at).toISOString(), notes, evidenceIds: evidence, lines
    });
    await onSaved();
  }}>
    <p className="text-sm text-slate-500">Record cumulative usable and damaged quantities for every dispatched line. Missing or damaged equipment creates blocking issues. Dispatch time alone does not prove delivery.</p>
    <Input label="Observed Site Receipt (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
    {lines.map(line => {
      const e = job.equipment!.find(e => e.id === line.equipmentId)!;
      return <div key={e.id} className="border rounded-lg p-3 space-y-2">
        <p className="font-medium">
          {equipmentLabel(e)}: dispatched {e.dispatchedQuantity} {e.unit}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={equipmentLabel(e) + ' Usable Received Quantity'} required inputMode="decimal" value={line.receivedQuantity} onChange={event => update(e.id, {
            receivedQuantity: event.target.value
          })} />
          <Input label={equipmentLabel(e) + ' Damaged Quantity'} required inputMode="decimal" value={line.damagedQuantity} onChange={event => update(e.id, {
            damagedQuantity: event.target.value
          })} />
        </div>
        {e.serials.map(s => <div key={s.id} className="flex flex-wrap gap-3 items-center text-sm">
          <span>
            {s.serialUnit.serialNumber}
          </span>
          <Select label={s.serialUnit.serialNumber + ' Site Condition'} value={line.receivedSerialIds.includes(s.serialUnitId) ? 'usable' : line.damagedSerialIds.includes(s.serialUnitId) ? 'damaged' : 'unverified'} options={[
            {
              value: 'unverified', label: 'Not Verified at Site'
            }, {
              value: 'usable', label: 'Received Usable'
            }, {
              value: 'damaged', label: 'Received Damaged'
            }
          ]} onChange={event => update(e.id, {
            receivedSerialIds: [
              ...line.receivedSerialIds.filter(id => id !== s.serialUnitId), ...(event.target.value === 'usable' ? [
                s.serialUnitId
              ] : [])
            ], damagedSerialIds: [
              ...line.damagedSerialIds.filter(id => id !== s.serialUnitId), ...(event.target.value === 'damaged' ? [
                s.serialUnitId
              ] : [])
            ]
          })} />
        </div>)}
      </div>;
    })}
    <Textarea label="Receipt Observations" required value={notes} onChange={e => setNotes(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function equipmentLabel(e: InstallationEquipment) {
  return e.component?.name ?? 'Component ' + e.componentId;
}
export function InstallationEquipmentForm({ job, files, onSaved, equipment: e }: Context & {
  equipment: InstallationEquipment;
}) {
  const [quantity, setQuantity] = useState(e.installedQuantity), [serials, setSerials] = useState(e.serials.filter(s => s.installedAt).map(s => s.serialUnitId)), [location, setLocation] = useState(e.installedLocation ?? ''), [notes, setNotes] = useState(e.notes ?? ''), [evidence, setEvidence] = useState<string[]>([]);
  return <InstallationActionForm title={'Record Installed ' + equipmentLabel(e)} submit={async (reason) => {
    await installationClient.command(job.id, 'equipment/install', {
      version: job.version, reason, equipmentId: e.id, installedQuantity: quantity, installedSerialIds: serials, installedLocation: location, notes, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <p className="text-sm">Dispatched: {e.dispatchedQuantity} {e.unit}; usable received: {e.receivedQuantity}; installed: {e.installedQuantity}.</p>
    <Input label={equipmentLabel(e) + ' Cumulative Installed Quantity'} inputMode="decimal" required value={quantity} onChange={event => setQuantity(event.target.value)} />
    {e.serials.filter(s => s.received && !s.damaged).map(s => <label className="block text-sm" key={s.id}>
      <input type="checkbox" checked={serials.includes(s.serialUnitId)} disabled={!!s.installedAt} onChange={event => setSerials(event.target.checked ? [
        ...serials, s.serialUnitId
      ] : serials.filter(id => id !== s.serialUnitId))} /> {s.serialUnit.serialNumber}
      {s.installedAt ? ' (Already Installed)' : ''}
    </label>)}
    <Input label="Installed Location or Position" required value={location} onChange={event => setLocation(event.target.value)} />
    <Textarea label="Installation Observations" required value={notes} onChange={event => setNotes(event.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function InstallationMilestoneForm({ job, files, onSaved, milestone: m, admin }: Context & {
  milestone: InstallationMilestone;
  admin: boolean;
}) {
  const [status, setStatus] = useState(m.status), [responsible, setResponsible] = useState(m.responsibleUserId ?? ''), [start, setStart] = useState(localDateInput(m.plannedStartAt)), [end, setEnd] = useState(localDateInput(m.plannedEndAt)), [checks, setChecks] = useState(m.checks), [notes, setNotes] = useState(m.completionNotes ?? ''), [evidence, setEvidence] = useState(m.evidenceIds);
  const users = [
    {
      value: job.coordinatorId, label: 'Coordinator'
    }, ...(job.assignments ?? []).map(a => ({
      value: a.userId, label: a.user.name
    }))
  ];
  return <InstallationActionForm title={'Save ' + label(m.type) + ' Milestone'} submit={async (reason) => {
    await installationClient.milestone(job.id, m.id, {
      version: job.version, reason, status, responsibleUserId: responsible || null, plannedStartAt: start ? new Date(start).toISOString() : null, plannedEndAt: end ? new Date(end).toISOString() : null, checks, completionNotes: notes, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <p className="text-sm">
      {m.required ? 'Required by approved design' : 'Optional for this design'}; current state: {m.status}.</p>
    <Select label="Milestone State" value={status} options={[
      'PENDING', 'IN_PROGRESS', 'COMPLETED', ...(!m.required && admin ? [
        'NOT_APPLICABLE'
      ] : [])
    ].map(v => ({
      value: v, label: label(v)
    }))} onChange={e => setStatus(e.target.value)} />
    <Select label="Responsible User" disabled={!admin} value={responsible} options={[
      {
        value: '', label: 'Choose Responsible User'
      }, ...users
    ]} onChange={e => setResponsible(e.target.value)} />
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Milestone Planned Start (Local Time)" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
      <Input label="Milestone Planned End (Local Time)" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
    </div>
    <Checks names={[
      'approvedDesignFollowed', 'safetyChecked', 'evidenceReviewed'
    ]} value={checks} onChange={setChecks} />
    <Textarea label="Milestone Completion Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function InstallationTestForm({ job, files, onSaved, requirement: r, admin }: Context & {
  requirement: TestRequirement;
  admin: boolean;
}) {
  const [applicable, setApplicable] = useState(true), [result, setResult] = useState('NEEDS_REVIEW'), [observations, setObservations] = useState(''), [measurement, setMeasurement] = useState(''), [unit, setUnit] = useState(r.unit ?? ''), [notApplicable, setNotApplicable] = useState(''), [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <InstallationActionForm title={'Record ' + label(r.type) + ' Test'} submit={async (reason) => {
    await installationClient.command(job.id, 'tests', {
      version: job.version, reason, type: r.type, applicable, result: applicable ? result : 'NEEDS_REVIEW', observations, measurement: applicable && measurement ? measurement : null, unit: applicable && measurement ? unit : null, requirementsBasis: r.basis, notApplicableReason: applicable ? null : notApplicable, notes: notes || null, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <p className="text-sm">Requirements basis: {r.basis}
    </p>
    {!r.required && admin && <label className="block">
      <input type="checkbox" checked={applicable} onChange={e => setApplicable(e.target.checked)} /> Applicable to Installed Design</label>}
    {applicable ? <>
      <Select label="Observed Test Result" value={result} options={[
        'NEEDS_REVIEW', 'PASS', 'FAIL'
      ].map(v => ({
        value: v, label: label(v)
      }))} onChange={e => setResult(e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Actual Test Measurement" required={r.measurementRequired} inputMode="decimal" value={measurement} onChange={e => setMeasurement(e.target.value)} />
        <Input label="Test Measurement Unit" required={r.measurementRequired || !!measurement} readOnly={r.unit !== null} value={unit} onChange={e => setUnit(e.target.value)} />
      </div>
    </> : <Textarea label="Not Applicable Rationale" required value={notApplicable} onChange={e => setNotApplicable(e.target.value)} />}
    <Textarea label="Test Observations" required value={observations} onChange={e => setObservations(e.target.value)} />
    <Textarea label="Additional Test Notes" value={notes} onChange={e => setNotes(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function InstallationIssueForm({ job, files, onSaved }: Context) {
  const [type, setType] = useState('OTHER'), [severity, setSeverity] = useState('MEDIUM'), [blocking, setBlocking] = useState(false), [description, setDescription] = useState(''), [milestone, setMilestone] = useState(''), [equipment, setEquipment] = useState(''), [serial, setSerial] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <InstallationActionForm title="Report Installation Issue" submit={async (reason) => {
    await installationClient.command(job.id, 'issues', {
      version: job.version, reason, type, severity, blocking, description, milestoneId: milestone || null, equipmentId: equipment || null, serialUnitId: serial || null, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <div className="grid sm:grid-cols-2 gap-3">
      <Select label="Issue Category" value={type} options={[
        'EQUIPMENT_MISSING', 'EQUIPMENT_DAMAGED', 'SITE_ACCESS', 'ROOF_MOUNTING', 'ELECTRICAL_SAFETY', 'DESIGN_MISMATCH', 'WEATHER_DELAY', 'OTHER'
      ].map(v => ({
        value: v, label: label(v)
      }))} onChange={e => setType(e.target.value)} />
      <Select label="Issue Severity" value={severity} options={[
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      ].map(v => ({
        value: v, label: v
      }))} onChange={e => setSeverity(e.target.value)} />
      <Select label="Related Milestone" value={milestone} options={[
        {
          value: '', label: 'No Specific Milestone'
        }, ...(job.milestones ?? []).map(m => ({
          value: m.id, label: label(m.type)
        }))
      ]} onChange={e => setMilestone(e.target.value)} />
      <Select label="Related Equipment" value={equipment} options={[
        {
          value: '', label: 'No Specific Equipment'
        }, ...(job.equipment ?? []).map(e => ({
          value: e.id, label: equipmentLabel(e)
        }))
      ]} onChange={e => {
        setEquipment(e.target.value);
        setSerial('');
      }} />
      <Select label="Related Serial Unit" value={serial} options={[
        {
          value: '', label: 'No Specific Serial'
        }, ...(job.equipment ?? []).filter(e => !equipment || e.id === equipment).flatMap(e => e.serials.map(s => ({
          value: s.serialUnitId, label: s.serialUnit.serialNumber
        })))
      ]} onChange={e => setSerial(e.target.value)} />
    </div>
    <label className="block">
      <input type="checkbox" checked={blocking || [
        'HIGH', 'CRITICAL'
      ].includes(severity)} disabled={[
        'HIGH', 'CRITICAL'
      ].includes(severity)} onChange={e => setBlocking(e.target.checked)} /> Blocks Execution and Commissioning</label>
    <Textarea label="Issue Description" required value={description} onChange={e => setDescription(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function InstallationIssueResolution({ job, files, onSaved, issue }: Context & {
  issue: InstallationIssue;
}) {
  const [resolution, setResolution] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <InstallationActionForm title={(issue.status === 'OPEN' ? 'Resolve' : 'Reopen') + ' ' + label(issue.type)} submit={async (reason) => {
    await installationClient.resolve(job.id, issue.id, {
      version: job.version, reason, status: issue.status === 'OPEN' ? 'RESOLVED' : 'OPEN', resolution, evidenceIds: evidence
    });
    await onSaved();
  }}>
    <Textarea label="Issue Resolution or Reopening Explanation" required value={resolution} onChange={e => setResolution(e.target.value)} />
    <EvidenceChoice files={files} value={evidence} onChange={setEvidence} />
  </InstallationActionForm>;
}
export function InstallationReviewForm({ job, onSaved }: Omit<Context, 'files'>) {
  const [decision, setDecision] = useState('REWORK_REQUIRED'), [checks, setChecks] = useState<Record<string, boolean>>({}), [notes, setNotes] = useState(''), names = [
    'siteReceiptVerified', 'milestonesReviewed', 'equipmentReconciled', 'testsReviewed', 'conditionsAddressed', 'evidenceReviewed', 'internalScopeAcknowledged'
  ];
  return <InstallationActionForm title="Record Independent Commissioning Review" submit={async (reason) => {
    await installationClient.command(job.id, 'review', {
      version: job.version, reason, decision, checklist: Object.fromEntries(names.map(n => [
        n, checks[n] ?? false
      ])), notes
    });
    await onSaved();
  }}>
    <p className="text-sm text-amber-800">Only an independent administrator who did not create or modify this job may review it. Approval confirms internal commissioning, not grid authorization or regulatory certification.</p>
    <Select label="Commissioning Decision" value={decision} options={[
      {
        value: 'REWORK_REQUIRED', label: 'Rework Required'
      }, {
        value: 'APPROVED', label: 'Approve Internal Commissioning'
      }
    ]} onChange={e => setDecision(e.target.value)} />
    <Checks names={names} value={checks} onChange={setChecks} />
    <Textarea label="Reviewer Observations" required value={notes} onChange={e => setNotes(e.target.value)} />
  </InstallationActionForm>;
}
