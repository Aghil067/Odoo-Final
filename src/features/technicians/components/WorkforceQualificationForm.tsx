import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { workforceClient, type WorkforceProfile, type SkillCatalog } from '../services/workforceClient';
const catalog = (q: RecordQuery) => workforceClient.catalog(q);
export function WorkforceQualificationForm({ id, profile, admin, certification = false, onSaved }: {
  id: string;
  profile: WorkforceProfile;
  admin: boolean;
  certification?: boolean;
  onSaved: () => Promise<void>;
}) {
  const [skill, setSkill] = useState<SkillCatalog | null>(null), [level, setLevel] = useState(''), [experience, setExperience] = useState(''), [verification, setVerification] = useState('DECLARED'), [evidence, setEvidence] = useState(''), [provider, setProvider] = useState(''), [number, setNumber] = useState(''), [issued, setIssued] = useState(''), [expires, setExpires] = useState('');
  return <RecordActionForm title={certification ? 'Register Technician Certification' : 'Save Technician Skill'} submit={async (reason) => {
    if (!skill)
      throw new Error('Choose an active catalog skill.');
    const common = {
      version: profile.version, reason, skillId: skill.id, verification, evidenceReference: evidence || null
    };
    if (certification)
      await workforceClient.certification(id, {
        ...common, provider, certificateNumber: number, issuedAt: new Date(issued).toISOString(), expiresAt: new Date(expires).toISOString()
      });
    else
      await workforceClient.skill(id, {
        ...common, level: Number(level), experienceMonths: Number(experience)
      });
    await onSaved();
  }}>
    <PagedRecordSelect label="Catalog Skill" selected={skill} onChange={setSkill} load={catalog} describe={s => s.code + ' - ' + s.name + (s.isActive ? '' : ' (Inactive)')} required />
    {certification ? <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Certification Provider" required value={provider} onChange={e => setProvider(e.target.value)} />
      <Input label="Certificate Number" required value={number} onChange={e => setNumber(e.target.value)} />
      <Input label="Certificate Issued (Local Time)" type="datetime-local" required value={issued} onChange={e => setIssued(e.target.value)} />
      <Input label="Certificate Expiry (Local Time)" type="datetime-local" required min={issued} value={expires} onChange={e => setExpires(e.target.value)} />
    </div> : <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Skill Level (1 to 5)" type="number" min={1} max={5} required value={level} onChange={e => setLevel(e.target.value)} />
      <Input label="Relevant Experience in Months" type="number" min={0} max={960} required value={experience} onChange={e => setExperience(e.target.value)} />
    </div>}
    <Select label="Qualification Verification" value={verification} options={(admin ? [
      'DECLARED', 'VERIFIED', 'REJECTED'
    ] : [
      'DECLARED'
    ]).map(v => ({
      value: v, label: v
    }))} onChange={e => setVerification(e.target.value)} />
    <Input label="Trusted Evidence Reference" required={certification || verification === 'VERIFIED'} value={evidence} onChange={e => setEvidence(e.target.value)} />
    <p className="text-sm text-slate-500">Technicians may declare qualifications. Only administrators verify them. Updating a verified skill requires administrator authority and rechecks existing commitments.</p>
  </RecordActionForm>;
}
