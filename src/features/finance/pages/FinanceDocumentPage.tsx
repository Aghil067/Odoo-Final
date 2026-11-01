import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { financeClient, financeGroups, money, type FinanceGroup, type FinanceDocument, type InvoiceBalance, type PaymentBalance, type FinanceEvidence, type FinanceQuote, type FinanceOrder, type FinancePayment } from '../services/financeClient';
import { FinanceNavigation, financeGroupAllowed, financeRecordUrl } from '../components/FinanceNavigation';
import { FinanceCommandForm, FinanceReviewForm, FinanceQuoteCommunication, FinanceOrderFromQuote, FinanceOrderLink, FinancePaymentVerify, FinancePaymentAllocation, FinancePaymentReversal, FinanceRefundCompletion } from '../components/FinanceWorkForms';
import { FinanceEvidencePanel } from '../components/FinanceEvidencePanel';
import { FinanceHistory } from '../components/FinanceHistory';
import { FinancePaymentAllocations } from '../components/FinancePaymentAllocations';
export function FinanceDocumentPage({ fixedGroup }: {
  fixedGroup?: FinanceGroup;
}) {
  const { id, group: raw } = useParams(), group = fixedGroup ?? raw as FinanceGroup, { user } = useAuth(), navigate = useNavigate(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'overview', allowed = financeGroups.includes(group) && financeGroupAllowed(user?.role, group), admin = user?.role === 'admin', finance = admin || user?.role === 'finance_officer';
  const [record, setRecord] = useState<FinanceDocument | InvoiceBalance | PaymentBalance | null>(null), [files, setFiles] = useState<FinanceEvidence[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id || !allowed)
      return;
    const r = await financeClient.detail<FinanceDocument | InvoiceBalance | PaymentBalance>(group, id);
    let evidence: FinanceEvidence[] = [];
    if (![
      'orders', 'invoices'
    ].includes(group)) {
      for (let page = 1;page <= 3;page++) {
        const result = await financeClient.evidence(group, id, page);
        evidence = evidence.concat(result.data);
        if (evidence.length >= result.total)
          break;
      }
    }
    if (generation !== requestGeneration.current) return;
    setRecord(r);
    setFiles(evidence);
    setError('');
  }, [
    id, group, allowed
  ]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    refresh().catch(e => {
      if (live)
        setError(e.message);
    }).finally(() => {
      if (live)
        setLoading(false);
    });
    return () => {
      live = false;
      invalidate();
    };
  }, [
    invalidate, refresh, retry
  ]);
  if (!allowed)
    return <Navigate to="/finance/dashboard" replace />;
  if (loading)
    return <p>Loading authorized financial document...</p>;
  if (error || !record)
    return <Card>
      <p role="alert">
        {error || 'Financial document unavailable.'}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card>;
  const d = 'invoice' in record ? record.invoice : 'payment' in record ? record.payment : record, status = d.status ?? 'CONFIRMED', quote = group === 'quotations' ? d as FinanceQuote : null, order = group === 'orders' ? d as FinanceOrder : null, payment = group === 'payments' ? d as FinancePayment : null, proof = ![
    'orders', 'invoices'
  ].includes(group);
  return <div className="max-w-7xl mx-auto space-y-5">
    <FinanceNavigation />
    <Link className="text-green-700" to={'/finance/' + group}>Back to {group.replaceAll('-', ' ')}
    </Link>
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">
          {d.reference}
        </h1>
        <p className="text-sm text-slate-500">
          {group.replaceAll('-', ' ')} | {status} | Version {d.version}
        </p>
      </div>
      {group === 'invoices' && <Button variant="outline" onClick={() => window.print()}>Print Actual Invoice Record</Button>}
    </div>
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {[
        'overview', ...(proof ? [
          'evidence'
        ] : []), ...(payment ? [
          'allocations'
        ] : []), 'history'
      ].map(t => <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setParams({
        tab: t
      })}>
        {t}
      </Button>)}
    </div>
    <div className="space-y-5" key={d.id + ':' + d.version + ':' + tab}>
      {tab === 'overview' && <>
        <Card>
          <h2 className="font-semibold">Recorded Financial Terms</h2>
          <p className="text-xl font-semibold mt-2">
            {money(d.currency, d.totalAmount ?? d.amount ?? d.proposedAmount)}
          </p>
          <p>Customer identity: {d.customerId ?? 'Unlinked Recorder / Office Expense'}
          </p>
          {d.description && <p className="whitespace-pre-wrap mt-2">
            {d.description}
          </p>}
          {d.notes && <p className="whitespace-pre-wrap mt-2">
            {d.notes}
          </p>}
          {d.category && <p>Category: {d.category}
          </p>}
          {d.vendorOrPayee && <p>Actual vendor / payee: {d.vendorOrPayee}
          </p>}
          {d.incurredAt && <p>Actual incurred time: {new Date(d.incurredAt).toLocaleString()}
          </p>}
          {d.adjustmentReason && <p>Credit adjustment: {d.adjustmentReason}
          </p>}
          {d.refundReason && <p>Refund reason: {d.refundReason}
          </p>}
          {d.invoiceId && <Link className="text-green-700 block" to={financeRecordUrl('invoices', d.invoiceId)}>Original Invoice</Link>}
          {d.paymentId && <Link className="text-green-700 block" to={financeRecordUrl('payments', d.paymentId)}>Original Verified Payment</Link>}
          {d.recordedAt && <p>Operational cost recognized: {new Date(d.recordedAt).toLocaleString()}
          </p>}
          {d.completedAt && <p>Observed completion: {new Date(d.completedAt).toLocaleString()}
          </p>}
        </Card>
        {'invoice' in record && <>
          <Card>
            <h2 className="font-semibold">Authoritative Invoice Balance</h2>
            <p>Effective state: {record.effectiveStatus}; due {new Date(record.invoice.dueAt).toLocaleString()}
            </p>
            <p>Original subtotal {money(d.currency, record.invoice.subtotal)}; discount {money(d.currency, record.invoice.discountAmount)}
            </p>
            <p>Original taxable {money(d.currency, record.invoice.taxableAmount)}; original tax {money(d.currency, record.invoice.taxAmount)}
            </p>
            <p>Issued gross credits {money(d.currency, record.creditAmount)}; net due {money(d.currency, record.netDue)}
            </p>
            <p>Allocated verified receipts {money(d.currency, record.allocatedAmount)}
            </p>
            <p className="font-semibold">Outstanding {money(d.currency, record.outstanding)}
            </p>
            <p className="text-xs text-slate-500">As of {new Date(record.asOf).toLocaleString()}. Issued invoice terms are immutable; credits and allocation corrections remain separate.</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Frozen Invoice Lines</h2>
            {(record.lines ?? []).map(l => <div className="border-t mt-3 pt-3" key={l.id}>
              <p>
                {l.snapshot.description ?? 'Accepted Quotation Line ' + (l.position + 1)}
              </p>
              <p className="text-sm">Quantity {l.snapshot.quantity ?? 'See Accepted Source'} {l.snapshot.unit}; unit selling price {money(d.currency, l.snapshot.unitPrice)}
              </p>
              <p>Taxable {money(d.currency, l.taxableAmount)}; tax {money(d.currency, l.taxAmount)}; total {money(d.currency, l.totalAmount)}
              </p>
            </div>)}
          </Card>
          {finance && status === 'DRAFT' && <>
            <Link to={'/finance/invoices/' + d.id + '/edit'}>
              <Button variant="outline">Edit Draft Due Time and Notes</Button>
            </Link>
            <FinanceCommandForm group={group} document={d} title="Issue Exact Draft Invoice" action="issue" onSaved={refresh}>
              <p>Creates an operational billing obligation from the accepted commercial order; no payment is inferred.</p>
            </FinanceCommandForm>
          </>}
          {admin && status !== 'VOIDED' && <FinanceCommandForm group={group} document={d} title="Explicitly Void Invoice" action="void" onSaved={refresh}>
            <p className="text-sm text-amber-800">An issued invoice requires a different administrator from its issuer and no historical allocations or credits. Otherwise use explicit corrections.</p>
          </FinanceCommandForm>}
        </>}
        {quote && <>
          <Card>
            <h2 className="font-semibold">Quotation Revision {quote.revision}
            </h2>
            <p>Effective state: {quote.effectiveStatus}; valid until {new Date(quote.validUntil).toLocaleString()}
            </p>
            <p>Source {quote.kind}: {quote.configurationId ?? quote.serviceChargeId}
            </p>
            <p className="whitespace-pre-wrap mt-2">
              {quote.terms}
            </p>
            <p>Subtotal {money(d.currency, quote.subtotal)}; discount {money(d.currency, quote.discountAmount)}; taxable {money(d.currency, quote.taxableAmount)}; tax {money(d.currency, quote.taxAmount)}
            </p>
            {quote.estimatedCost !== undefined && <p>Explicit estimated cost {money(d.currency, quote.estimatedCost)}; estimated margin {money(d.currency, quote.estimatedMargin)}
            </p>}
            <p className="text-sm">
              {quote.sensitivePricing ? 'Sensitive pricing requires administrator review.' : 'Independent finance review required.'}
            </p>
          </Card>
          <Card>
            <h2 className="font-semibold">Explicit Selling Lines</h2>
            {quote.lines.map(l => <div className="border-t mt-3 pt-3" key={l.id}>
              <p>
                {l.description}
              </p>
              <p className="text-sm">
                {l.quantity} {l.unit} at {money(d.currency, l.unitPrice)}; entered discount {money(d.currency, l.enteredDiscount)}
              </p>
              <p>Taxable {money(d.currency, l.taxableAmount)}; tax {money(d.currency, l.taxAmount)}; gross {money(d.currency, l.totalAmount)}
              </p>
            </div>)}
          </Card>
          {status === 'DRAFT' && <>
            <Link to={'/finance/quotations/' + d.id + '/edit'}>
              <Button variant="outline">Edit Current Draft</Button>
            </Link>
            <FinanceCommandForm group={group} document={d} title="Submit Exact Quotation for Approval" action="submit" onSaved={refresh}>
              <p>Freezes the current commercial source and pricing for independent review.</p>
            </FinanceCommandForm>
          </>}
          {finance && status === 'SUBMITTED_FOR_APPROVAL' && (!quote.sensitivePricing || admin) && <FinanceReviewForm group={group} document={d} onSaved={refresh} />}
          {status === 'APPROVED' && <FinanceQuoteCommunication document={quote} files={files} accept={false} onSaved={refresh} />}
          {status === 'SENT' && <FinanceQuoteCommunication document={quote} files={files} accept onSaved={refresh} />}
          {status === 'ACCEPTED' && <FinanceOrderFromQuote quote={quote} onSaved={async () => {
            navigate('/finance/orders');
          }} />}
          {![
            'ACCEPTED', 'CANCELLED', 'SUPERSEDED'
          ].includes(status) && <Link to={'/finance/quotations/' + d.id + '/revise'}>
              <Button variant="outline">Create Explicit New Revision</Button>
            </Link>}
          {![
            'ACCEPTED', 'CANCELLED', 'SUPERSEDED', 'EXPIRED'
          ].includes(status) && (finance || status === 'DRAFT') && <FinanceCommandForm group={group} document={d} title="Cancel Unaccepted Quotation" action="cancel" onSaved={refresh}>
              <p>Accepted or terminal commitments cannot be silently canceled or overwritten.</p>
            </FinanceCommandForm>}
          {finance && quote.effectiveStatus === 'EXPIRED' && ![
            'ACCEPTED', 'CANCELLED', 'SUPERSEDED', 'EXPIRED'
          ].includes(status) && <FinanceCommandForm group={group} document={d} title="Record Actual Quotation Expiry" action="expire" onSaved={refresh}>
              <p>Records elapsed validity; it does not generate a new commercial offer.</p>
            </FinanceCommandForm>}
        </>}
        {order && <>
          <Card>
            <h2 className="font-semibold">Accepted Commercial Commitment</h2>
            <Link className="text-green-700" to={financeRecordUrl('quotations', order.quotationId)}>Exact Accepted Quotation</Link>
            <p>Observed acceptance {new Date(order.acceptedAt).toLocaleString()}
            </p>
            <p>Installation link: {order.installationId ?? 'Not Explicitly Linked'}
            </p>
            <p className="text-sm">This order is not proof of technical approval, payment, dispatch, delivery or installation completion.</p>
          </Card>
          {finance && !order.installationId && <FinanceOrderLink order={order} onSaved={refresh} />}
          {finance && <Link to="/finance/invoices/new">
            <Button variant="outline">Draft Invoice from Accepted Order</Button>
          </Link>}
        </>}
        {'payment' in record && payment && <>
          <Card>
            <h2 className="font-semibold">Observed Manual Receipt</h2>
            <p>Method {payment.method}; redacted reference {payment.externalReference}
            </p>
            <p>Observed {new Date(payment.paidAt).toLocaleString()}; verified {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : 'Not Verified'}
            </p>
            <p>Allocated {money(d.currency, record.allocatedAmount)}; reserved approved refunds {money(d.currency, record.reservedRefunds)}; completed refunds {money(d.currency, record.completedRefunds)}
            </p>
            <p className="font-semibold">Available verified funds {money(d.currency, record.availableVerified)}
            </p>
            <p className="text-sm">This is not gateway settlement, bank reconciliation or automatic invoice collection.</p>
          </Card>
          {status === 'RECORDED' && <FinanceCommandForm group={group} document={d} title="Submit Payment Proof for Verification" action="submit" onSaved={refresh}>
            <p>Requires private PAYMENT_PROOF attached to this exact receipt.</p>
          </FinanceCommandForm>}
          {status === 'PENDING_VERIFICATION' && payment.recordedById !== user?.id && <FinancePaymentVerify document={payment} onSaved={refresh} />}
          {status === 'VERIFIED' && <>
            <FinancePaymentAllocation document={payment} onSaved={refresh} />
            <Link to="/finance/new/refunds">
              <Button variant="outline">Request Explicit Refund</Button>
            </Link>
            {admin && payment.recordedById !== user?.id && <FinancePaymentReversal document={payment} files={files} onSaved={refresh} />}
          </>}
        </>}
        {[
          'credit-notes', 'expenses', 'service-charges'
        ].includes(group) && <>
            {status === 'DRAFT' && <FinanceCommandForm group={group} document={d} title="Submit Exact Financial Request" action="submit" onSaved={refresh}>
              <p>Requires the appropriate private supporting evidence for this exact document. No approval or payment is inferred.</p>
            </FinanceCommandForm>}
            {status === 'SUBMITTED' && (group === 'service-charges' ? finance : admin) && <FinanceReviewForm group={group} document={d} onSaved={refresh} />}
            {status === 'APPROVED' && finance && group === 'expenses' && <FinanceCommandForm group={group} document={d} title="Record Approved Net Actual Expense" action="record" onSaved={refresh}>
              <p>Recognizes documented operational cost only; no bank payment, payroll or schedule-derived labor is executed.</p>
            </FinanceCommandForm>}
            {status === 'APPROVED' && finance && group === 'credit-notes' && <FinanceCommandForm group={group} document={d} title="Issue Approved Gross Credit Adjustment" action="issue" onSaved={refresh}>
              <p>The backend calculates original-tax credit amounts and explicitly releases any excess invoice allocations. A refund is a separate workflow.</p>
            </FinanceCommandForm>}
            {status === 'APPROVED' && finance && group === 'service-charges' && <Link to="/finance/quotations/new">
              <Button variant="outline">Prepare Customer Service Quotation</Button>
            </Link>}
            {[
              'DRAFT', 'SUBMITTED', 'APPROVED'
            ].includes(status) && (admin || status !== 'APPROVED' && (d.createdById ?? d.requestedById) === user?.id) && <FinanceCommandForm group={group} document={d} title="Cancel Unexecuted Financial Request" action="cancel" onSaved={refresh}>
                <p>Preserves history. An accepted service commercial commitment requires a separate correction.</p>
              </FinanceCommandForm>}
          </>}
        {group === 'refunds' && <>
          {status === 'REQUESTED' && admin && d.requestedById !== user?.id && <FinanceReviewForm group={group} document={d} onSaved={refresh} />}
          {status === 'APPROVED' && finance && d.requestedById !== user?.id && <FinanceRefundCompletion document={d} files={files} onSaved={refresh} />}
          {[
            'REQUESTED', 'APPROVED'
          ].includes(status) && (admin || status === 'REQUESTED' && d.requestedById === user?.id) && <FinanceCommandForm group={group} document={d} title="Cancel Uncompleted Refund Request" action="cancel" onSaved={refresh}>
              <p>Preserves the request and releases any approved reservation through the backend. Completed transfers cannot be silently erased.</p>
            </FinanceCommandForm>}
        </>}
      </>}
      {tab === 'evidence' && proof && <FinanceEvidencePanel group={group} document={d} files={files} onSaved={refresh} />}
      {tab === 'allocations' && payment && <FinancePaymentAllocations payment={payment} onSaved={refresh} />}
      {tab === 'history' && <FinanceHistory group={group} id={d.id} />}
    </div>
  </div>;
}
