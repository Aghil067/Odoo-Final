import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, financeCurrencies, money, type FinanceGroup, type FinanceCustomer, type FinanceInstallation, type FinanceServiceTicket, type FinanceInvoice, type InvoiceBalance, type FinancePayment } from '../services/financeClient';
import { FinanceNavigation, financeRecordUrl, financeGroupAllowed } from '../components/FinanceNavigation';
const customers = (q: RecordQuery) => financeClient.customers(q), installations = (q: RecordQuery) => financeClient.installations(q), tickets = (q: RecordQuery) => financeClient.serviceTickets(q), payments = (q: RecordQuery) => financeClient.list<FinancePayment>('payments', {
  ...q, paymentStatus: 'VERIFIED'
}), invoices = async (q: RecordQuery) => {
  const r = await financeClient.list<InvoiceBalance>('invoices', q);
  return {
    ...r, data: r.data.map(b => b.invoice)
  };
};
export function FinanceRequestCreatePage() {
  const { group: raw } = useParams(), group = raw as FinanceGroup;
  if (![
    'payments', 'credit-notes', 'refunds', 'expenses', 'service-charges'
  ].includes(raw ?? ''))
    return <Navigate to="/finance/dashboard" replace />;
  return <RequestForm key={group} group={group} />;
}
function RequestForm({ group }: {
  group: FinanceGroup;
}) {
  const { user } = useAuth(), navigate = useNavigate(), [customer, setCustomer] = useState<FinanceCustomer | null>(null), [installation, setInstallation] = useState<FinanceInstallation | null>(null), [ticket, setTicket] = useState<FinanceServiceTicket | null>(null), [invoice, setInvoice] = useState<FinanceInvoice | null>(null), [payment, setPayment] = useState<FinancePayment | null>(null), [amount, setAmount] = useState(''), [currency, setCurrency] = useState(''), [method, setMethod] = useState(''), [reference, setReference] = useState(''), [at, setAt] = useState(''), [notes, setNotes] = useState(''), [businessReason, setBusinessReason] = useState(''), [description, setDescription] = useState(''), [payee, setPayee] = useState(''), [category, setCategory] = useState(''), [source, setSource] = useState('OFFICE'), [kinds, setKinds] = useState<string[]>([]), created = useRef('');
  if (!financeGroupAllowed(user?.role, group))
    return <Navigate to="/finance/dashboard" replace />;
  const needsCurrency = [
    'payments', 'expenses', 'service-charges'
  ].includes(group);
  return <div className="space-y-5 max-w-5xl mx-auto">
    <FinanceNavigation />
    <Link className="text-green-700" to={'/finance/' + group}>Back to {group.replaceAll('-', ' ')}
    </Link>
    <h1 className="text-2xl font-bold">Create {group.replaceAll('-', ' ')}
    </h1>
    <IdempotentActionForm title={'Save ' + group.replaceAll('-', ' ') + ' Record'} build={reason => {
      if (group === 'payments') {
        if (!customer)
          throw new Error('Choose an authorized finance customer.');
        return {
          customerId: customer.id, currency, amount, method, externalReference: reference, paidAt: new Date(at).toISOString(), notes, reason
        };
      }
      if (group === 'credit-notes') {
        if (!invoice)
          throw new Error('Choose an authorized issued invoice.');
        return {
          invoiceId: invoice.id, invoiceVersion: invoice.version, amount, adjustmentReason: businessReason, reason
        };
      }
      if (group === 'refunds') {
        if (!payment)
          throw new Error('Choose a verified payment with available unallocated funds.');
        return {
          paymentId: payment.id, paymentVersion: payment.version, amount, refundReason: businessReason, reason
        };
      }
      if (group === 'expenses') {
        if (source === 'INSTALLATION' && !installation || source === 'SERVICE' && !ticket)
          throw new Error('Choose the actual linked project or service ticket.');
        return {
          installationId: source === 'INSTALLATION' ? installation!.id : null, serviceTicketId: source === 'SERVICE' ? ticket!.id : null, category, description, vendorOrPayee: payee, amount, currency, incurredAt: new Date(at).toISOString(), costBasis: 'NET_ACTUAL_COST', reason
        };
      }
      if (!ticket)
        throw new Error('Choose an independently closed service ticket.');
      return {
        serviceTicketId: ticket.id, description, allowedKinds: kinds, proposedAmount: amount, currency, reason
      };
    }} send={async (body) => {
      const r = await financeClient.create(group, body);
      created.current = r.id;
    }} onSaved={async () => {
      navigate(financeRecordUrl(group, created.current));
    }}>
      {group === 'payments' && <>
        <PagedRecordSelect label="Payment Customer" selected={customer} onChange={setCustomer} load={customers} describe={c => c.reference + ' - ' + c.name} required />
        <Select label="Actual Payment Method" required value={method} options={[
          {
            value: '', label: 'Choose Observed Receipt Method'
          }, ...[
            'BANK_TRANSFER', 'UPI', 'CASH', 'CARD', 'CHEQUE', 'OTHER'
          ].map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => setMethod(e.target.value)} />
        <Input label="Redacted External Receipt Reference" required autoComplete="off" value={reference} onChange={e => setReference(e.target.value)} />
        <Input label="Observed Payment Time (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
        <Textarea label="Observed Receipt Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
        <p className="text-sm text-amber-800">Manual record only: no gateway or bank transfer is executed. Never enter full card numbers, bank credentials or secrets. Independent evidence verification is required before allocation.</p>
      </>}
      {group === 'credit-notes' && <>
        <PagedRecordSelect label="Original Issued Invoice" selected={invoice} onChange={setInvoice} load={invoices} describe={i => i.reference + ' | ' + i.status + ' | ' + money(i.currency, i.totalAmount)} required />
        <Textarea label="Explicit Gross Credit Adjustment Reason" required value={businessReason} onChange={e => setBusinessReason(e.target.value)} />
        <p className="text-sm">The backend calculates tax credits from original invoice terms and reconciles any excess allocations. Credits do not send a refund.</p>
      </>}
      {group === 'refunds' && <>
        <PagedRecordSelect label="Original Verified Payment" selected={payment} onChange={setPayment} load={payments} describe={p => p.reference + ' | ' + money(p.currency, p.amount)} required />
        <Textarea label="Explicit Refund Request Reason" required value={businessReason} onChange={e => setBusinessReason(e.target.value)} />
        <p className="text-sm">Only currently available verified unallocated funds qualify. Requesting or approving a refund does not transfer money; completion requires an observed transfer and private proof.</p>
      </>}
      {group === 'expenses' && <>
        <Select label="Actual Expense Source" value={source} options={[
          {
            value: 'OFFICE', label: 'Unlinked Office / Recorder Expense'
          }, {
            value: 'INSTALLATION', label: 'Actual Installation Project Cost'
          }, {
            value: 'SERVICE', label: 'Actual Service Ticket Cost'
          }
        ]} onChange={e => setSource(e.target.value)} />
        {source === 'INSTALLATION' && <PagedRecordSelect label="Expense Installation" selected={installation} onChange={setInstallation} load={installations} describe={i => i.name + ' - ' + i.reference} required />}
        {source === 'SERVICE' && <PagedRecordSelect label="Expense Service Ticket" selected={ticket} onChange={setTicket} load={tickets} describe={t => t.reference + ' | ' + t.status} required />}
        <Select label="Actual Expense Category" required value={category} options={[
          {
            value: '', label: 'Choose Expense Category'
          }, ...[
            'LABOR', 'TRANSPORT', 'EQUIPMENT_COST', 'CONSUMABLES', 'SERVICE_EXPENSE', 'REIMBURSEMENT', 'OFFICE', 'OTHER'
          ].map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => setCategory(e.target.value)} />
        <Textarea label="Actual Incurred Expense Description" required value={description} onChange={e => setDescription(e.target.value)} />
        <Input label="Actual Vendor or Payee" required value={payee} onChange={e => setPayee(e.target.value)} />
        <Input label="Observed Expense Incurred At (Local Time)" type="datetime-local" required value={at} onChange={e => setAt(e.target.value)} />
        <p className="text-sm">Record documented tax-exclusive actual cost, never planned labor, attendance-derived payroll or automatic BOM cost. Approved expenses must be explicitly recorded before operational cost recognition.</p>
      </>}
      {group === 'service-charges' && <>
        <PagedRecordSelect label="Independently Closed Service Ticket" selected={ticket} onChange={setTicket} load={tickets} describe={t => t.reference + ' | ' + t.status + ' | ' + t.reportedIssue} required />
        <Textarea label="Proposed Charge Description" required value={description} onChange={e => setDescription(e.target.value)} />
        <fieldset>
          <legend className="font-medium">Allowed Nonparts Charge Kinds</legend>
          {[
            'SERVICE_LABOR', 'TRANSPORT', 'OTHER_FEE'
          ].map(k => <label className="block" key={k}>
            <input type="checkbox" checked={kinds.includes(k)} onChange={e => setKinds(e.target.checked ? [
              ...kinds, k
            ] : kinds.filter(v => v !== k))} /> {k.replaceAll('_', ' ')}
          </label>)}
        </fieldset>
        <p className="text-sm text-amber-800">A proposed charge requires separate independent approval and customer commercial acceptance. Warranty coverage does not automatically establish chargeability. Pending parts are not billable consumption.</p>
      </>}
      <Input label={group === 'expenses' ? 'Documented Net Actual Cost' : group === 'service-charges' ? 'Proposed Gross Charge Ceiling' : 'Exact Gross Amount'} inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,2})?" required value={amount} onChange={e => setAmount(e.target.value)} />
      {needsCurrency ? <Select label="Explicit Record Currency" required value={currency} options={[
        {
          value: '', label: 'Choose Currency'
        }, ...financeCurrencies.map(v => ({
          value: v, label: v
        }))
      ]} onChange={e => setCurrency(e.target.value)} /> : <p>Original document currency: {invoice?.currency ?? payment?.currency ?? 'Choose Source Document'}
      </p>}
    </IdempotentActionForm>
  </div>;
}
