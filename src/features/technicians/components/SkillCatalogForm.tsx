import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { workforceClient, type SkillCatalog } from '../services/workforceClient';
const load = (q: RecordQuery) => workforceClient.catalog(q);
export function SkillCatalogEditor({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<SkillCatalog | null>(null);
  return <div className="space-y-4">
    <PagedRecordSelect label="Existing Skill Policy (Optional)" selected={selected} onChange={setSelected} load={load} describe={s => s.code + ' - ' + s.name} />
    <SkillCatalogForm key={selected?.id ?? 'new'} skill={selected} onSaved={async () => {
      setSelected(null);
      await onSaved();
    }} />
  </div>;
}
function SkillCatalogForm({ skill: s, onSaved }: {
  skill: SkillCatalog | null;
  onSaved: () => Promise<void>;
}) {
  const [code, setCode] = useState(s?.code ?? ''), [name, setName] = useState(s?.name ?? ''), [description, setDescription] = useState(s?.description ?? ''), [purposes, setPurposes] = useState(s?.mandatoryFor ?? []), [level, setLevel] = useState(s ? String(s.minimumLevel) : ''), [certification, setCertification] = useState(s?.requiresCertification ?? false), [active, setActive] = useState(s?.isActive ?? true);
  return <RecordActionForm title={s ? 'Update Skill Catalog Policy' : 'Create Skill Catalog Policy'} submit={async (reason) => {
    const body = {
      name, description: description || null, mandatoryFor: purposes, minimumLevel: Number(level), requiresCertification: certification, reason
    };
    if (s)
      await workforceClient.updateSkill(s.id, {
        ...body, version: s.version, isActive: active
      });
    else
      await workforceClient.createSkill({
        ...body, code
      });
    await onSaved();
  }}>
    <Input label="Skill Policy Code" required readOnly={!!s} value={code} onChange={e => setCode(e.target.value)} />
    <Input label="Skill Name" required value={name} onChange={e => setName(e.target.value)} />
    <Textarea label="Skill Description" value={description} onChange={e => setDescription(e.target.value)} />
    <Input label="Minimum Verified Level" type="number" min={1} max={5} required value={level} onChange={e => setLevel(e.target.value)} />
    <fieldset className="space-y-2">
      <legend>Mandatory for Work Purposes</legend>
      {[
        'SURVEY', 'SERVICE', 'PV_INSTALLATION', 'INVERTER', 'BATTERY', 'COMMISSIONING'
      ].map(p => <label key={p} className="block">
        <input type="checkbox" checked={purposes.includes(p)} onChange={e => setPurposes(e.target.checked ? [
          ...purposes, p
        ] : purposes.filter(v => v !== p))} /> {p.replaceAll('_', ' ')}
      </label>)}
    </fieldset>
    <label className="block">
      <input type="checkbox" checked={certification} onChange={e => setCertification(e.target.checked)} /> Current Verified Certification Required</label>
    {s && <label className="block">
      <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active Skill Policy</label>}
    <p className="text-sm text-amber-800">Mandatory qualification policy changes are locked while managed profiles exist. Resolve policy changes explicitly through the backend workflow.</p>
  </RecordActionForm>;
}
