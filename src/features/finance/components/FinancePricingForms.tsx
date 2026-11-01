import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, financeCurrencies } from '../services/financeClient';
import { inventoryClient, type StockComponent } from '../../inventory/services/inventoryClient';
const components = (q: RecordQuery) => inventoryClient.components(q);
type DraftLine = {
  key: string;
  code: string;
  kind: string;
  component: StockComponent | null;
  description: string;
  unit: string;
  unitPrice: string;
  estimatedUnitCost: string;
  costSourceNotes: string;
};
export function FinancePriceBookForm({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState(''), [revision, setRevision] = useState(''), [name, setName] = useState(''), [currency, setCurrency] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [discountApproval, setDiscountApproval] = useState(''), [threshold, setThreshold] = useState(''), [lines, setLines] = useState<DraftLine[]>([]);
  const update = (key: string, patch: Partial<DraftLine>) => setLines(rows => rows.map(r => r.key === key ? {
    ...r, ...patch
  } : r));
  return <IdempotentActionForm title="Publish Immutable Selling Price Book" build={reason => ({
    reference, revision: Number(revision), name, currency, effectiveFrom: new Date(from).toISOString(), effectiveTo: to ? new Date(to).toISOString() : null, discountApprovalPercent: discountApproval, approvalThresholdAmount: threshold, lines: lines.map(({ key: _key, component, estimatedUnitCost, costSourceNotes, ...l }) => ({
      ...l, componentId: l.kind === 'COMPONENT' ? component?.id ?? null : null, estimatedUnitCost: estimatedUnitCost || null, costSourceNotes: costSourceNotes || null
    })), reason
  })} send={financeClient.createBook} onSaved={onSaved}>
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Price Book Reference" required value={reference} onChange={e => setReference(e.target.value)} />
      <Input label="Explicit Next Price Book Revision" required type="number" min={1} value={revision} onChange={e => setRevision(e.target.value)} />
      <Input label="Price Book Name" required value={name} onChange={e => setName(e.target.value)} />
      <Select label="Price Book Currency" required value={currency} options={[
        {
          value: '', label: 'Choose One Currency'
        }, ...financeCurrencies.map(v => ({
          value: v, label: v
        }))
      ]} onChange={e => setCurrency(e.target.value)} />
      <Input label="Price Book Effective From (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
      <Input label="Price Book Effective Through (Exclusive, Optional)" type="datetime-local" min={from} value={to} onChange={e => setTo(e.target.value)} />
      <Input label="Explicit Discount Approval Threshold Percent" inputMode="decimal" required value={discountApproval} onChange={e => setDiscountApproval(e.target.value)} />
      <Input label="Explicit Gross Amount Approval Threshold" inputMode="decimal" required value={threshold} onChange={e => setThreshold(e.target.value)} />
    </div>
    {lines.map((line, i) => <div className="border rounded-lg p-3 space-y-3" key={line.key}>
      <h3 className="font-semibold">Selling Entry {i + 1}
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label={'Entry ' + (i + 1) + ' Unique Code'} required value={line.code} onChange={e => update(line.key, {
          code: e.target.value
        })} />
        <Select label={'Entry ' + (i + 1) + ' Commercial Kind'} required value={line.kind} options={[
          {
            value: '', label: 'Choose Commercial Kind'
          }, ...[
            'COMPONENT', 'INSTALLATION_LABOR', 'SERVICE_LABOR', 'TRANSPORT', 'OTHER_FEE'
          ].map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => update(line.key, {
          kind: e.target.value, component: null, unit: ''
        })} />
      </div>
      {line.kind === 'COMPONENT' && <PagedRecordSelect label={'Entry ' + (i + 1) + ' Shared Component'} selected={line.component} onChange={c => update(line.key, {
        component: c, unit: c?.unit ?? ''
      })} load={components} describe={c => c.sku + ' - ' + c.name} required />}
      <Textarea label={'Entry ' + (i + 1) + ' Selling Description'} required value={line.description} onChange={e => update(line.key, {
        description: e.target.value
      })} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label={'Entry ' + (i + 1) + ' Actual Selling Unit'} required readOnly={line.kind === 'COMPONENT'} value={line.unit} onChange={e => update(line.key, {
          unit: e.target.value
        })} />
        <Input label={'Entry ' + (i + 1) + ' Explicit Unit Selling Price'} inputMode="decimal" required value={line.unitPrice} onChange={e => update(line.key, {
          unitPrice: e.target.value
        })} />
        <Input label={'Entry ' + (i + 1) + ' Comparable Net Unit Cost Estimate (Optional)'} inputMode="decimal" value={line.estimatedUnitCost} onChange={e => update(line.key, {
          estimatedUnitCost: e.target.value
        })} />
      </div>
      <Textarea label={'Entry ' + (i + 1) + ' Cost Estimate Source Notes'} required={!!line.estimatedUnitCost} value={line.costSourceNotes} onChange={e => update(line.key, {
        costSourceNotes: e.target.value
      })} />
      <Button type="button" variant="ghost" onClick={() => setLines(rows => rows.filter(r => r.key !== line.key))}>Remove Selling Entry</Button>
    </div>)}
    <Button type="button" variant="outline" disabled={lines.length >= 150} onClick={() => setLines(rows => [
      ...rows, {
        key: crypto.randomUUID(), code: '', kind: '', component: null, description: '', unit: '', unitPrice: '', estimatedUnitCost: '', costSourceNotes: ''
      }
    ])}>Add Explicit Selling Entry</Button>
    <p className="text-sm text-amber-800">Shared catalog costs are not automatically selling prices or recognized expenses. Missing comparable cost estimates leave margin unavailable and require administrator review. Publish a new revision rather than rewriting history.</p>
  </IdempotentActionForm>;
}
export function FinanceTaxRuleForm({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState(''), [revision, setRevision] = useState(''), [name, setName] = useState(''), [currency, setCurrency] = useState(''), [rate, setRate] = useState(''), [inclusive, setInclusive] = useState(false), [jurisdiction, setJurisdiction] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState('');
  return <IdempotentActionForm title="Publish Explicit Tax Rule Revision" build={reason => ({
    reference, revision: Number(revision), name, currency, ratePercent: rate, inclusive, jurisdictionNotes: jurisdiction, effectiveFrom: new Date(from).toISOString(), effectiveTo: to ? new Date(to).toISOString() : null, reason
  })} send={financeClient.createTax} onSaved={onSaved}>
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Tax Rule Reference" required value={reference} onChange={e => setReference(e.target.value)} />
      <Input label="Explicit Next Tax Rule Revision" required type="number" min={1} value={revision} onChange={e => setRevision(e.target.value)} />
      <Input label="Tax Rule Name" required value={name} onChange={e => setName(e.target.value)} />
      <Select label="Tax Rule Currency" required value={currency} options={[
        {
          value: '', label: 'Choose Currency'
        }, ...financeCurrencies.map(v => ({
          value: v, label: v
        }))
      ]} onChange={e => setCurrency(e.target.value)} />
      <Input label="Explicit Tax Rate Percent" inputMode="decimal" required value={rate} onChange={e => setRate(e.target.value)} />
      <Input label="Tax Rule Effective From (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
      <Input label="Tax Rule Effective Through (Exclusive, Optional)" type="datetime-local" min={from} value={to} onChange={e => setTo(e.target.value)} />
    </div>
    <label className="block">
      <input type="checkbox" checked={inclusive} onChange={e => setInclusive(e.target.checked)} /> Selling Price Includes This Tax</label>
    <Textarea label="Configured Jurisdiction and Tax Basis Notes" required value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} />
    <p className="text-sm">Explicit configured rules only; no universal rate is inferred. Published rules are operational pricing terms, not statutory tax certification.</p>
  </IdempotentActionForm>;
}
