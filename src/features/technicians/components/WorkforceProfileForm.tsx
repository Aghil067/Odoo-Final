import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { workforceClient, type WorkforceProfile } from '../services/workforceClient';
const localDate = (s: string) => new Date(new Date(s).getTime() - new Date(s).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export function WorkforceProfileForm({ id, profile: p, onSaved }: {
  id: string;
  profile: WorkforceProfile | null;
  onSaved: () => Promise<void>;
}) {
  const [code, setCode] = useState(p?.employeeCode ?? ''), [phone, setPhone] = useState(p?.contactPhone ?? ''), [base, setBase] = useState(p?.baseLocation ?? ''), [status, setStatus] = useState(p?.employmentStatus ?? 'ACTIVE'), [joined, setJoined] = useState(p ? localDate(p.joinedAt) : ''), [experience, setExperience] = useState(p ? String(p.experienceMonths) : ''), [capacity, setCapacity] = useState(p ? String(p.maxActiveAssignments) : ''), [rest, setRest] = useState(p ? String(p.minimumRestMinutes) : ''), [specializations, setSpecializations] = useState(p?.specializations.join(', ') ?? ''), [managed, setManaged] = useState(p?.enforceScheduling ?? false), [active, setActive] = useState(p?.isActive ?? true), [notes, setNotes] = useState(p?.privateNotes ?? ''), [contact, setContact] = useState(p?.emergencyContact ?? {
    name: '', relationship: '', phone: ''
  });
  return <RecordActionForm title={p ? 'Update Workforce Profile' : 'Create Workforce Profile'} submit={async (reason) => {
    const hasContact = Object.values(contact).some(v => v.trim());
    const data = {
      contactPhone: phone || null, baseLocation: base || null, employmentStatus: status, joinedAt: new Date(joined).toISOString(), experienceMonths: Number(experience), specializations: specializations.split(',').map(v => v.trim()).filter(Boolean), maxActiveAssignments: Number(capacity), minimumRestMinutes: Number(rest), enforceScheduling: managed, isActive: active, privateNotes: notes || null, emergencyContact: hasContact ? contact : null, reason
    };
    if (p)
      await workforceClient.updateProfile(id, {
        ...data, version: p.version
      });
    else
      await workforceClient.createProfile(id, {
        ...data, employeeCode: code
      });
    await onSaved();
  }}>
    <div className="grid md:grid-cols-2 gap-4">
      <Input label="Employee Code" required readOnly={!!p} value={code} onChange={e => setCode(e.target.value)} />
      <Input label="Workforce Contact Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <Input label="Base Location" value={base} onChange={e => setBase(e.target.value)} />
      <Select label="Employment Status" value={status} options={[
        'ACTIVE', 'INACTIVE', 'ENDED'
      ].map(v => ({
        value: v, label: v
      }))} onChange={e => setStatus(e.target.value)} />
      <Input label="Observed Employment Start (Local Time)" type="datetime-local" required value={joined} onChange={e => setJoined(e.target.value)} />
      <Input label="Experience in Months" type="number" min={0} max={960} required value={experience} onChange={e => setExperience(e.target.value)} />
      <Input label="Maximum Active Assignments" type="number" min={1} max={100} required value={capacity} onChange={e => setCapacity(e.target.value)} />
      <Input label="Required Rest in Minutes" type="number" min={0} max={1440} required value={rest} onChange={e => setRest(e.target.value)} />
    </div>
    <Input label="Specializations (Comma Separated)" value={specializations} onChange={e => setSpecializations(e.target.value)} />
    <div className="space-y-2">
      <label className="block">
        <input type="checkbox" checked={managed} onChange={e => setManaged(e.target.checked)} /> Enforce Managed Calendar, Qualification and Capacity Eligibility</label>
      <label className="block">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active Workforce Profile</label>
    </div>
    <p className="text-sm text-amber-800">Managed scheduling requires configured calendar coverage and verified qualification policies. Existing assignments must remain eligible. Resolve source assignments and team membership before deactivation.</p>
    <fieldset className="border rounded p-3 space-y-3">
      <legend>Private Emergency Contact (Optional)</legend>
      {([
        'name', 'relationship', 'phone'
      ] as const).map(key => <Input key={key} label={'Emergency Contact ' + key} required={Object.values(contact).some(v => !!v.trim())} value={contact[key]} onChange={e => setContact({
        ...contact, [key]: e.target.value
      })} />)}
    </fieldset>
    <Textarea label="Administrator Private Notes" value={notes} onChange={e => setNotes(e.target.value)} />
  </RecordActionForm>;
}
