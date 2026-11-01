import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { inventoryClient, type StockComponent } from '../../inventory/services/inventoryClient';
import { warrantyClient, warrantyDocuments, type WarrantyPolicy, type WarrantyPolicyVersion } from '../services/warrantyClient';
const components = (q: RecordQuery) => inventoryClient.components(q);
const categories = [
  'SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'MOUNTING_STRUCTURE', 'DC_CABLE', 'AC_CABLE', 'CONNECTOR', 'COMBINER_BOX', 'ISOLATOR', 'SURGE_PROTECTION', 'EARTHING', 'OTHER'
];
export function WarrantyPolicyRecordForm({ policy: p, revision: r, onSaved }: {
  policy?: WarrantyPolicy;
  revision?: WarrantyPolicyVersion;
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState(p?.reference ?? ''), [name, setName] = useState(p?.name ?? ''), [coverage, setCoverage] = useState(r?.coverageType ?? 'MANUFACTURER_PRODUCT'), [providerType, setProviderType] = useState(r?.providerType ?? 'MANUFACTURER'), [provider, setProvider] = useState(r?.providerName ?? ''), [target, setTarget] = useState(r?.applicableComponentId ? 'component' : 'category'), [component, setComponent] = useState<StockComponent | null>(null), [category, setCategory] = useState(r?.applicableCategory ?? ''), [duration, setDuration] = useState(r ? String(r.duration) : ''), [durationUnit, setDurationUnit] = useState(r?.durationUnit ?? 'YEARS'), [startRule, setStartRule] = useState(r?.startRule ?? ''), [description, setDescription] = useState(r?.coverageDescription ?? ''), [exclusions, setExclusions] = useState(r?.exclusions ?? ''), [conditions, setConditions] = useState(r?.claimConditions ?? ''), [required, setRequired] = useState(r?.requiredDocuments ?? []), [claimRequired, setClaimRequired] = useState(r?.claimRequiredDocuments ?? []), [providerRegistration, setProviderRegistration] = useState(r?.requiresProviderRegistration ?? false), [deadline, setDeadline] = useState(r?.registrationDeadlineDays === null || r?.registrationDeadlineDays === undefined ? '' : String(r.registrationDeadlineDays)), [from, setFrom] = useState(r?.effectiveFrom.slice(0, 10) ?? ''), [to, setTo] = useState(r?.effectiveTo?.slice(0, 10) ?? ''), [backdating, setBackdating] = useState('');
  const workmanship = coverage === 'INSTALLER_WORKMANSHIP';
  return <IdempotentActionForm title={p ? 'Publish Warranty Policy Revision' : 'Create Warranty Policy'} build={reason => {
    if (!workmanship && target === 'component' && !component && !r?.applicableComponentId)
      throw new Error('Choose the applicable shared catalog component.');
    return {
      coverageType: coverage, providerType, providerName: provider, applicableComponentId: workmanship || target !== 'component' ? null : component?.id ?? r?.applicableComponentId, applicableCategory: workmanship || target !== 'category' ? null : category || null, duration: Number(duration), durationUnit, startRule, coverageDescription: description, exclusions: exclusions || null, claimConditions: conditions || null, requiredDocuments: required, claimRequiredDocuments: claimRequired, requiresProviderRegistration: providerRegistration, registrationDeadlineDays: deadline ? Number(deadline) : null, effectiveFrom: from, effectiveTo: to || null, backdatingReason: backdating || null, ...(p ? {
        version: p.version
      } : {
        reference, name
      }), reason
    };
  }} send={body => p ? warrantyClient.publishPolicy(p.id, body) : warrantyClient.createPolicy(body)} onSaved={onSaved}>
    <div className="grid md:grid-cols-2 gap-4">
      <Input label="Warranty Policy Reference" required readOnly={!!p} value={reference} onChange={e => setReference(e.target.value)} />
      <Input label="Warranty Policy Name" required readOnly={!!p} value={name} onChange={e => setName(e.target.value)} />
      <Select label="Coverage Type" disabled={!!p} value={coverage} options={[
        'MANUFACTURER_PRODUCT', 'MANUFACTURER_PERFORMANCE', 'INSTALLER_WORKMANSHIP', 'EXTENDED_COVERAGE'
      ].map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setCoverage(e.target.value)} />
      <Select label="Provider Type" disabled={!!p} value={providerType} options={[
        'MANUFACTURER', 'INSTALLER', 'THIRD_PARTY'
      ].map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setProviderType(e.target.value)} />
      <Input label="Configured Warranty Provider" required value={provider} onChange={e => setProvider(e.target.value)} />
      <Input label="Contractual Duration" type="number" min={1} max={36600} required value={duration} onChange={e => setDuration(e.target.value)} />
      <Select label="Duration Unit" value={durationUnit} options={[
        'DAYS', 'MONTHS', 'YEARS'
      ].map(v => ({
        value: v, label: v
      }))} onChange={e => setDurationUnit(e.target.value)} />
      <Select label="Verified Warranty Start Rule" required value={startRule} options={[
        {
          value: '', label: 'Select Contractual Start Rule'
        }, ...[
          'DELIVERY_DATE', 'INSTALLATION_COMPLETION_DATE', 'COMMISSIONING_DATE', 'MANUFACTURER_REGISTRATION_DATE', 'PURCHASE_DATE', 'MANUAL_VERIFIED_DATE'
        ].map(v => ({
          value: v, label: v.replaceAll('_', ' ')
        }))
      ]} onChange={e => setStartRule(e.target.value)} />
      <Input label="Policy Effective From (Civil Date)" type="date" required value={from} onChange={e => setFrom(e.target.value)} />
      <Input label="Policy Effective Through (Exclusive, Optional)" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} />
    </div>
    {!workmanship && <>
      <Select label="Policy Equipment Target" value={target} options={[
        {
          value: 'category', label: 'Shared Component Category'
        }, {
          value: 'component', label: 'Exact Shared Catalog Component'
        }
      ]} onChange={e => setTarget(e.target.value)} />
      {target === 'category' ? <Select label="Applicable Component Category" required value={category} options={[
        {
          value: '', label: 'Select Category'
        }, ...categories.map(v => ({
          value: v, label: v.replaceAll('_', ' ')
        }))
      ]} onChange={e => setCategory(e.target.value)} /> : <>
        <PagedRecordSelect label="Policy Catalog Component" selected={component} onChange={setComponent} load={components} describe={c => c.sku + ' - ' + c.name} />
        {r?.applicableComponentId && !component && <p className="text-sm">Retaining exact current component: {r.applicableComponentId}
        </p>}
      </>}
    </>}
    <Textarea label="Coverage Description" required value={description} onChange={e => setDescription(e.target.value)} />
    <Textarea label="Contractual Exclusions" value={exclusions} onChange={e => setExclusions(e.target.value)} />
    <Textarea label="Claim Conditions" value={conditions} onChange={e => setConditions(e.target.value)} />
    <fieldset className="grid md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-medium mb-2">Required Registration Documents</h3>
        {warrantyDocuments.map(d => <label className="block text-sm py-1" key={d}>
          <input type="checkbox" checked={required.includes(d)} onChange={e => setRequired(e.target.checked ? [
            ...required, d
          ] : required.filter(v => v !== d))} /> {d.replaceAll('_', ' ')}
        </label>)}
      </div>
      <div>
        <h3 className="font-medium mb-2">Required Claim Documents</h3>
        {warrantyDocuments.map(d => <label className="block text-sm py-1" key={d}>
          <input type="checkbox" checked={claimRequired.includes(d)} onChange={e => setClaimRequired(e.target.checked ? [
            ...claimRequired, d
          ] : claimRequired.filter(v => v !== d))} /> {d.replaceAll('_', ' ')}
        </label>)}
      </div>
    </fieldset>
    <label className="block">
      <input type="checkbox" checked={providerRegistration} onChange={e => setProviderRegistration(e.target.checked)} /> Actual Provider Registration Required</label>
    <Input label="Contractual Provider Registration Deadline in Days (Optional)" type="number" min={0} max={36500} value={deadline} onChange={e => setDeadline(e.target.value)} />
    <Textarea label="Retrospective Effective Date Reason (If Applicable)" value={backdating} onChange={e => setBackdating(e.target.value)} />
    <p className="text-sm text-amber-800">Start rules are explicit business terms. Site receipt or commissioning must not automatically stand in for customer delivery. Published policy revisions do not rewrite existing registrations.</p>
  </IdempotentActionForm>;
}
