import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { serviceClient, serviceChecks, type ServiceVisit, type ServiceDiagnosis, type ServiceRepair } from '../services/serviceClient';
import { ServiceCommandForm, ServiceEvidenceChoice, type ServiceContext } from './ServiceTicketWorkForms';
export function ServiceDiagnosisForm({ ticket: t, files, visit: v, diagnoses, onSaved }: ServiceContext & {
  visit: ServiceVisit;
  diagnoses: ServiceDiagnosis[];
}) {
  const [reported, setReported] = useState(''), [observed, setObserved] = useState(''), [method, setMethod] = useState(''), [finding, setFinding] = useState(''), [cause, setCause] = useState(''), [uncertainty, setUncertainty] = useState(''), [supersedes, setSupersedes] = useState(''), [evidence, setEvidence] = useState<string[]>([]), [measurements, setMeasurements] = useState<{
    key: string;
    name: string;
    value: string;
    unit: string;
    requirementReference: string;
  }[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Observed Service Diagnosis" action="diagnoses" fields={() => ({
    visitId: v.id, supersedesId: supersedes || null, reportedSymptom: reported, observedSymptom: observed, method, measurements: measurements.map(({ key: _key, ...m }) => ({
      ...m, requirementReference: m.requirementReference || null
    })), finding, probableCause: cause || null, uncertainty, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Select label="Prior Diagnosis to Supersede (Optional)" value={supersedes} options={[
      {
        value: '', label: 'New Observed Diagnosis'
      }, ...diagnoses.filter(d => d.visitId === v.id && d.executionRevision === t.executionRevision).map(d => ({
        value: d.id, label: d.finding
      }))
    ]} onChange={e => setSupersedes(e.target.value)} />
    <Textarea label="Reported Symptom" required value={reported} onChange={e => setReported(e.target.value)} />
    <Textarea label="Actually Observed Symptom" required value={observed} onChange={e => setObserved(e.target.value)} />
    <Textarea label="Inspection or Test Method" required value={method} onChange={e => setMethod(e.target.value)} />
    {measurements.map((m, i) => <div key={m.key} className="border rounded p-3 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        {([
          'name', 'value', 'unit', 'requirementReference'
        ] as const).map(key => <Input key={key} label={'Measurement ' + (i + 1) + ' ' + key.replace(/([a-z])([A-Z])/g, '$1 $2')} required={key !== 'requirementReference'} inputMode={key === 'value' ? 'decimal' : undefined} value={m[key]} onChange={e => setMeasurements(rows => rows.map(r => r.key === m.key ? {
          ...r, [key]: e.target.value
        } : r))} />)}
      </div>
      <Button type="button" variant="ghost" onClick={() => setMeasurements(rows => rows.filter(r => r.key !== m.key))}>Remove Measurement</Button>
    </div>)}
    <Button type="button" variant="outline" disabled={measurements.length >= 30} onClick={() => setMeasurements(rows => [
      ...rows, {
        key: crypto.randomUUID(), name: '', value: '', unit: '', requirementReference: ''
      }
    ])}>Add Actual Measurement</Button>
    <Textarea label="Observed Diagnostic Finding" required value={finding} onChange={e => setFinding(e.target.value)} />
    <Textarea label="Probable Cause (If Established)" value={cause} onChange={e => setCause(e.target.value)} />
    <Textarea label="Diagnostic Uncertainty and Limitations" required value={uncertainty} onChange={e => setUncertainty(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} visitId={v.id} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Record only real observations and measurements. No universal electrical threshold is assumed.</p>
  </ServiceCommandForm>;
}
export function ServiceRepairPlanForm({ ticket: t, files, visit: v, onSaved }: ServiceContext & {
  visit: ServiceVisit;
}) {
  const [type, setType] = useState('INSPECTION'), [description, setDescription] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Plan Observed Repair Work" action="repairs" fields={() => ({
    visitId: v.id, type, description, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Select label="Supported Repair Type" value={type} options={[
      'INSPECTION', 'CLEANING', 'CONFIGURATION', 'WIRING_REPAIR', 'COMPONENT_REPAIR', 'TESTING', 'OTHER'
    ].map(v => ({
      value: v, label: v.replaceAll('_', ' ')
    }))} onChange={e => setType(e.target.value)} />
    <Textarea label="Repair Work Description" required value={description} onChange={e => setDescription(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} visitId={v.id} value={evidence} onChange={setEvidence} />
    <p className="text-sm text-amber-800">Component replacement cannot be executed: the backend has no authorized service spare-part fulfillment or serial-substitution workflow.</p>
  </ServiceCommandForm>;
}
export function ServiceRepairCompleteForm({ ticket: t, files, repair: r, onSaved }: ServiceContext & {
  repair: ServiceRepair;
}) {
  const [outcome, setOutcome] = useState(''), [followUp, setFollowUp] = useState(false), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Complete Actual Repair Work" action="" fields={() => ({
    repairVersion: r.version, outcome, followUpRequired: followUp, evidenceIds: evidence
  })} send={body => serviceClient.repair(t.id, r.id, 'complete', body)} onSaved={onSaved}>
    <Textarea label="Observed Repair Outcome" required value={outcome} onChange={e => setOutcome(e.target.value)} />
    <label className="block">
      <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} /> Further Repair Work Required</label>
    <ServiceEvidenceChoice ticket={t} files={files} visitId={r.visitId} value={evidence} onChange={setEvidence} />
  </ServiceCommandForm>;
}
export function ServiceChecklistForm({ ticket: t, files, onSaved }: ServiceContext) {
  const [key, setKey] = useState(''), [result, setResult] = useState(''), [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <ServiceCommandForm ticket={t} title="Record Service Inspection Check" action="checklist" fields={() => ({
    key, result, notes, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Select label="Observed Inspection Check" required value={key} options={[
      {
        value: '', label: 'Choose Inspection Check'
      }, ...serviceChecks.map(v => ({
        value: v, label: v.replaceAll('_', ' ') + (t.requiredChecks.includes(v) ? ' (Required)' : '')
      }))
    ]} onChange={e => setKey(e.target.value)} />
    <Select label="Observed Check Result" required value={result} options={[
      {
        value: '', label: 'Choose Actual Result'
      }, ...[
        'FAIL', 'PASS', ...(!t.requiredChecks.includes(key) ? [
          'NOT_APPLICABLE'
        ] : [])
      ].map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))
    ]} onChange={e => setResult(e.target.value)} />
    <Textarea label="Inspection Check Observations" required value={notes} onChange={e => setNotes(e.target.value)} />
    <ServiceEvidenceChoice ticket={t} files={files} value={evidence} onChange={setEvidence} />
  </ServiceCommandForm>;
}
const components = (q: RecordQuery) => serviceClient.components(q);
export function ServicePartRequestForm({ ticket: t, onSaved }: Omit<ServiceContext, 'files'>) {
  const [component, setComponent] = useState<Awaited<ReturnType<typeof serviceClient.components>>['data'][number] | null>(null), [quantity, setQuantity] = useState(''), [purpose, setPurpose] = useState('');
  return <ServiceCommandForm ticket={t} title="Record Pending Service Part Request" action="parts" fields={() => {
    if (!component)
      throw new Error('Choose a shared component.');
    return {
      componentId: component.id, quantity, purpose
    };
  }} onSaved={onSaved}>
    <PagedRecordSelect label="Requested Shared Component" selected={component} onChange={setComponent} load={components} describe={c => c.sku + ' - ' + c.name} required />
    <Input label="Requested Quantity" inputMode="decimal" required value={quantity} onChange={e => setQuantity(e.target.value)} />
    <Textarea label="Part Request Purpose" required value={purpose} onChange={e => setPurpose(e.target.value)} />
    <p className="text-sm text-amber-800">This creates a pending handoff only. It does not reserve, dispatch, install or substitute stock. Pending requests block resolution until an explicit authorized disposition is recorded.</p>
  </ServiceCommandForm>;
}
