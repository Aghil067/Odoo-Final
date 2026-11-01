import { useCallback, useState, type ReactNode } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { financeClient, money, type FinanceGroup, type FinanceDocument, type FinanceEvidence, type FinanceQuote, type FinanceOrder, type FinanceInstallation, type FinancePayment, type InvoiceBalance } from '../services/financeClient';
export type FinanceContext = {
  group: FinanceGroup;
  document: FinanceDocument;
  files: FinanceEvidence[];
  onSaved: () => Promise<void>;
};
export function FinanceCommandForm({ group, document: d, title, action, fields, children, onSaved, send }: {
  group: FinanceGroup;
  document: FinanceDocument;
  title: string;
  action: string;
  fields?: () => Record<string, unknown>;
  children: ReactNode;
  onSaved: () => Promise<void>;
  send?: (body: unknown) => Promise<unknown>;
}) {
  return <IdempotentActionForm title={title} build={reason => ({
    version: d.version, reason, ...fields?.()
  })} send={send ?? (body => financeClient.command(group, d.id, action, body))} onSaved={onSaved}>
    {children}
  </IdempotentActionForm>;
}
export function FinanceEvidenceChoice({ files, value, onChange }: {
  files: FinanceEvidence[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return <fieldset className="border rounded-lg p-3">
    <legend className="font-medium text-sm">Exact Financial Document Evidence</legend>
    {files.map(f => <label className="block text-sm py-1" key={f.id}>
      <input type="checkbox" checked={value.includes(f.id)} onChange={e => onChange(e.target.checked ? [
        ...value, f.id
      ] : value.filter(v => v !== f.id))} /> {f.fileName} ({f.type.replaceAll('_', ' ')})</label>)}
    {!files.length && <p className="text-sm text-amber-800">Upload private proof to this exact document first.</p>}
  </fieldset>;
}
export function FinanceReviewForm({ group, document: d, onSaved }: {
  group: FinanceGroup;
  document: FinanceDocument;
  onSaved: () => Promise<void>;
}) {
  const [decision, setDecision] = useState(''), [notes, setNotes] = useState(''), [checks, setChecks] = useState<Record<string, boolean>>({}), names = [
    'sourceReviewed', 'pricingReviewed', 'evidenceReviewed', 'termsReviewed'
  ];
  return <FinanceCommandForm group={group} document={d} title="Record Independent Financial Review" action="review" fields={() => ({
    decision, notes, checklist: Object.fromEntries(names.map(n => [
      n, checks[n] ?? false
    ]))
  })} onSaved={onSaved}>
    <Select label="Independent Financial Review Decision" required value={decision} options={[
      {
        value: '', label: 'Choose Observed Review Decision'
      }, {
        value: 'APPROVED', label: 'Approve Exact Submitted Version'
      }, {
        value: 'REJECTED', label: 'Reject Exact Submitted Version'
      }
    ]} onChange={e => setDecision(e.target.value)} />
    {names.map(n => <label key={n} className="block">
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Textarea label="Financial Reviewer Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm text-amber-800">The author cannot approve their own request. Sensitive quotations, credits, expenses and refunds require administrator authority as enforced by the backend.</p>
  </FinanceCommandForm>;
}
export function FinanceQuoteCommunication({ document: q, files, accept, onSaved }: {
  document: FinanceQuote;
  files: FinanceEvidence[];
  accept: boolean;
  onSaved: () => Promise<void>;
}) {
  const [at, setAt] = useState(''), [channel, setChannel] = useState(''), [attestation, setAttestation] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <FinanceCommandForm group="quotations" document={q} title={accept ? 'Record Actual Customer Acceptance' : 'Record Actual Quotation Sending'} action={accept ? 'accept' : 'send'} fields={() => ({
    observedAt: new Date(at).toISOString(), channel, attestation, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Input label="Observed Commercial Communication Time (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
    <Input label="Actual Commercial Communication Channel" required value={channel} onChange={e => setChannel(e.target.value)} />
    <Textarea label="Recorder Communication Attestation" required value={attestation} onChange={e => setAttestation(e.target.value)} />
    <FinanceEvidenceChoice files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Records an actual external communication. No email, signature or customer acceptance is generated. Acceptance requires private CUSTOMER_ACCEPTANCE evidence after recorded sending.</p>
  </FinanceCommandForm>;
}
export function FinanceOrderFromQuote({ quote: q, onSaved }: {
  quote: FinanceQuote;
  onSaved: () => Promise<void>;
}) {
  return <IdempotentActionForm title="Create Accepted Commercial Order" build={reason => ({
    quotationVersion: q.version, installationId: null, reason
  })} send={body => financeClient.order(q.id, body)} onSaved={onSaved}>
    <p className="text-sm">Uses the exact accepted quotation revision. Installation orders can be linked explicitly later by finance; service orders retain their actual service installation. This is not a payment or dispatch.</p>
  </IdempotentActionForm>;
}
const installations = (q: RecordQuery) => financeClient.installations(q);
export function FinanceOrderLink({ order: o, onSaved }: {
  order: FinanceOrder;
  onSaved: () => Promise<void>;
}) {
  const [installation, setInstallation] = useState<FinanceInstallation | null>(null);
  return <FinanceCommandForm group="orders" document={o} title="Link Exact Installation to Commercial Order" action="link-installation" fields={() => {
    if (!installation)
      throw new Error('Choose an actual installation matching the accepted design and project.');
    return {
      installationId: installation.id
    };
  }} onSaved={onSaved}>
    <PagedRecordSelect label="Exact Commercial Installation" selected={installation} onChange={setInstallation} load={installations} describe={r => r.name + ' - ' + r.reference} required />
    <p className="text-sm">The backend validates the same customer, site, lead and approved configuration/BOM identity. This link can be established once and does not rewrite installation records.</p>
  </FinanceCommandForm>;
}
export function FinancePaymentVerify({ document: p, onSaved }: {
  document: FinancePayment;
  onSaved: () => Promise<void>;
}) {
  const [decision, setDecision] = useState(''), [notes, setNotes] = useState(''), [checks, setChecks] = useState<Record<string, boolean>>({}), names = [
    'payerVerified', 'amountVerified', 'evidenceReviewed'
  ];
  return <FinanceCommandForm group="payments" document={p} title="Independently Verify Observed Payment" action="verify" fields={() => ({
    decision, notes, checklist: Object.fromEntries(names.map(n => [
      n, checks[n] ?? false
    ]))
  })} onSaved={onSaved}>
    <Select label="Payment Verification Decision" required value={decision} options={[
      {
        value: '', label: 'Choose Actual Verification Decision'
      }, {
        value: 'VERIFIED', label: 'Verified Manual Receipt'
      }, {
        value: 'REJECTED', label: 'Rejected Receipt Evidence'
      }
    ]} onChange={e => setDecision(e.target.value)} />
    {names.map(n => <label key={n} className="block">
      <input type="checkbox" checked={checks[n] ?? false} onChange={e => setChecks({
        ...checks, [n]: e.target.checked
      })} /> {n.replace(/([a-z])([A-Z])/g, '$1 $2')}
    </label>)}
    <Textarea label="Independent Payment Verification Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <p className="text-sm">The recorder cannot verify this receipt. Manual verification is not bank reconciliation or gateway settlement.</p>
  </FinanceCommandForm>;
}
export function FinancePaymentAllocation({ document: p, onSaved }: {
  document: FinancePayment;
  onSaved: () => Promise<void>;
}) {
  const [invoice, setInvoice] = useState<InvoiceBalance['invoice'] | null>(null), [amount, setAmount] = useState('');
  const load = useCallback(async (q: RecordQuery) => {
    const r = await financeClient.list<InvoiceBalance>('invoices', {
      ...q, customerId: p.customerId, currency: p.currency
    });
    return {
      ...r, data: r.data.map(b => b.invoice)
    };
  }, [
    p.customerId, p.currency
  ]);
  return <FinanceCommandForm group="payments" document={p} title="Allocate Verified Payment to Invoice" action="allocate" fields={() => {
    if (!invoice)
      throw new Error('Choose an issued invoice for the same customer and currency.');
    return {
      allocations: [
        {
          invoiceId: invoice.id, invoiceVersion: invoice.version, amount
        }
      ]
    };
  }} onSaved={onSaved}>
    <PagedRecordSelect label="Same-customer Invoice Allocation" selected={invoice} onChange={setInvoice} load={load} describe={i => i.reference + ' | ' + i.status + ' | ' + money(i.currency, i.totalAmount)} required />
    <Input label="Exact Allocation Amount" inputMode="decimal" required value={amount} onChange={e => setAmount(e.target.value)} />
    <p className="text-sm">The server checks current verified unallocated funds and invoice outstanding. Allocation does not execute a bank transfer.</p>
  </FinanceCommandForm>;
}
export function FinancePaymentReversal({ document: p, files, onSaved }: {
  document: FinancePayment;
  files: FinanceEvidence[];
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <FinanceCommandForm group="payments" document={p} title="Independently Reverse Manual Payment Record" action="reverse" fields={() => ({
    notes, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Textarea label="Explicit Payment Correction Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    <FinanceEvidenceChoice files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm text-amber-800">Independent administrator correction releases active allocations. This is not a bank refund. Pending or completed refunds must be reconciled under the backend rules.</p>
  </FinanceCommandForm>;
}
export function FinanceRefundCompletion({ document: d, files, onSaved }: Omit<FinanceContext, 'group'>) {
  const [at, setAt] = useState(''), [reference, setReference] = useState(''), [attestation, setAttestation] = useState(''), [evidence, setEvidence] = useState<string[]>([]);
  return <FinanceCommandForm group="refunds" document={d} title="Record Observed Refund Completion" action="complete" fields={() => ({
    completedAt: new Date(at).toISOString(), transferReference: reference, attestation, evidenceIds: evidence
  })} onSaved={onSaved}>
    <Input label="Observed Refund Transfer Time (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
    <Input label="Redacted Actual Refund Transfer Reference" required autoComplete="off" value={reference} onChange={e => setReference(e.target.value)} />
    <Textarea label="Actual Transfer Completion Attestation" required value={attestation} onChange={e => setAttestation(e.target.value)} />
    <FinanceEvidenceChoice files={files} value={evidence} onChange={setEvidence} />
    <p className="text-sm">Requires an independently approved refund, actual post-approval transfer and REFUND_PROOF. The requester cannot record their own completion. No transfer is executed by this application.</p>
  </FinanceCommandForm>;
}
