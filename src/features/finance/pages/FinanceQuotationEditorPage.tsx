import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { financeClient, money, type FinanceQuote, type FinancePriceBook, type FinanceTaxRule, type FinanceConfiguration, type FinanceSource, type FinancePreview } from '../services/financeClient';
import { FinanceNavigation, financeRecordUrl } from '../components/FinanceNavigation';
const books = (q: RecordQuery) => financeClient.books(q), taxes = (q: RecordQuery) => financeClient.taxes(q), configurations = (q: RecordQuery) => financeClient.configurations(q), charges = (q: RecordQuery) => financeClient.serviceQuoteSources(q), local = (v: string) => new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
type Charge = Awaited<ReturnType<typeof financeClient.serviceQuoteSources>>['data'][number];
type Selection = {
  key: string;
  priceBookLineId: string;
  taxRuleId: string;
  tax: FinanceTaxRule | null;
  quantity: string;
  discount: string;
};
export function FinanceQuotationEditorPage({ mode = 'create' }: {
  mode?: 'create' | 'edit' | 'revise';
}) {
  const { id } = useParams(), { user } = useAuth(), [record, setRecord] = useState<FinanceQuote | null>(null), [book, setBook] = useState<FinancePriceBook | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(!!id), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!id)
      return;
    let live = true;
    setLoading(true);
    setError('');
    financeClient.detail<FinanceQuote>('quotations', id).then(async (q) => ({
      q, book: await financeClient.book(q.priceBookId)
    })).then(r => {
      if (live) {
        setRecord(r.q);
        setBook(r.book);
      }
    }).catch(e => {
      if (live)
        setError(e.message);
    }).finally(() => {
      if (live)
        setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [
    id, retry
  ]);
  if (![
    'admin', 'finance_officer', 'sales_executive'
  ].includes(user?.role ?? ''))
    return <Navigate to="/finance/dashboard" replace />;
  return <div className="max-w-6xl mx-auto space-y-5">
    <FinanceNavigation />
    <Link className="text-green-700" to="/finance/quotations">Back to Quotations</Link>
    <h1 className="text-2xl font-bold">
      {mode === 'edit' ? 'Edit Draft Quotation' : mode === 'revise' ? 'Create Explicit Quotation Revision' : 'Create Commercial Quotation'}
    </h1>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading exact quotation and price-book revision...</p> : <QuotationForm key={id ?? 'new'} quote={record} initialBook={book} mode={mode} />}
  </div>;
}
function QuotationForm({ quote: q, initialBook, mode }: {
  quote: FinanceQuote | null;
  initialBook: FinancePriceBook | null;
  mode: 'create' | 'edit' | 'revise';
}) {
  const navigate = useNavigate(), [kind, setKind] = useState(q?.kind ?? 'INSTALLATION'), [configuration, setConfiguration] = useState<FinanceConfiguration | null>(null), [charge, setCharge] = useState<Charge | null>(null), [book, setBook] = useState<FinancePriceBook | null>(initialBook), [source, setSource] = useState<FinanceSource | null>(null), [sourceError, setSourceError] = useState(''), [until, setUntil] = useState(q ? local(q.validUntil) : ''), [terms, setTerms] = useState(q?.terms ?? ''), [selections, setSelections] = useState<Selection[]>((q?.lines ?? []).map(l => ({
    key: crypto.randomUUID(), priceBookLineId: l.priceBookLineId, taxRuleId: l.taxRuleId, tax: l.taxSnapshot ?? null, quantity: l.quantity, discount: l.enteredDiscount
  }))), [priceChoice, setPriceChoice] = useState(''), [taxChoice, setTaxChoice] = useState<FinanceTaxRule | null>(null), [preview, setPreview] = useState<{
    key: string;
    data: FinancePreview;
  } | null>(null), [previewError, setPreviewError] = useState(''), [previewBusy, setPreviewBusy] = useState(false), [formError, setFormError] = useState(''), created = useRef('');
  const patch = mode === 'edit', configurationId = configuration?.id ?? (kind === 'INSTALLATION' ? q?.configurationId : null), serviceChargeId = charge?.id ?? (kind === 'SERVICE' ? q?.serviceChargeId : null);
  useEffect(() => {
    setSource(null);
    setSourceError('');
    if (kind !== 'INSTALLATION' || !configurationId)
      return;
    let live = true;
    financeClient.source(configurationId).then(s => {
      if (live)
        setSource(s);
    }).catch(e => {
      if (live)
        setSourceError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    kind, configurationId
  ]);
  const fields = () => {
    if (!book)
      throw new Error('Choose an effective explicit selling price book.');
    if (kind === 'INSTALLATION' && !configurationId || kind === 'SERVICE' && !serviceChargeId)
      throw new Error('Choose the exact approved design or approved service charge.');
    return {
      kind, configurationId: kind === 'INSTALLATION' ? configurationId : null, serviceChargeId: kind === 'SERVICE' ? serviceChargeId : null, priceBookId: book.id, validUntil: new Date(until).toISOString(), terms, lines: selections.map(s => ({
        priceBookLineId: s.priceBookLineId, taxRuleId: s.taxRuleId, quantity: s.quantity, discount: s.discount
      }))
    };
  };
  const draftKey = JSON.stringify({
    kind, configurationId, serviceChargeId, book: book?.id, until, terms, selections: selections.map(({ key: _key, tax: _tax, ...s }) => s)
  }), currentPreview = preview?.key === draftKey ? preview.data : null;
  const change = (key: string, fields: Partial<Selection>) => setSelections(rows => rows.map(r => r.key === key ? {
    ...r, ...fields
  } : r));
  return <IdempotentActionForm title={patch ? 'Save Versioned Draft Quotation' : mode === 'revise' ? 'Publish New Draft Quotation Revision' : 'Create Draft Quotation'} build={reason => {
    const body = fields();
    return patch ? {
      version: q!.version, reason, validUntil: body.validUntil, terms: body.terms, lines: body.lines
    } : {
      ...body, ...(mode === 'revise' ? {
        version: q!.version
      } : {}), reason
    };
  }} send={async (body) => {
    const r = patch ? await financeClient.edit<FinanceQuote>('quotations', q!.id, body) : mode === 'revise' ? await financeClient.command<FinanceQuote>('quotations', q!.id, 'revise', body) : await financeClient.create<FinanceQuote>('quotations', body);
    created.current = r.id;
  }} onSaved={async () => {
    navigate(financeRecordUrl('quotations', created.current));
  }}>
    {!patch && <Select label="Quotation Source Kind" value={kind} options={[
      {
        value: 'INSTALLATION', label: 'Exact Approved Solar Design and BOM'
      }, {
        value: 'SERVICE', label: 'Independently Approved Closed-service Charge'
      }
    ]} onChange={e => {
      setKind(e.target.value as 'INSTALLATION' | 'SERVICE');
      setSelections([]);
    }} />}
    {!patch && (kind === 'INSTALLATION' ? <PagedRecordSelect label="Approved Quotation Design" selected={configuration} onChange={r => {
      setConfiguration(r);
      setSelections([]);
    }} load={configurations} describe={r => r.name + ' - ' + r.reference} /> : <PagedRecordSelect label="Approved Service Charge Source" selected={charge} onChange={r => {
      setCharge(r);
      setSelections([]);
    }} load={charges} describe={r => r.reference + ' - ' + money(r.currency, r.proposedAmount) + ' ceiling'} />)}
    {q && !configuration && !charge && <p className="text-sm">
      {patch ? 'Pinned original source' : 'Retaining original source unless a new one is selected'}: {configurationId ?? serviceChargeId}
    </p>}
    {patch ? <p className="font-medium">Pinned price book: {book?.reference} v{book?.revision} ({book?.currency})</p> : <PagedRecordSelect label="Explicit Selling Price Book" selected={book} onChange={r => {
      setBook(r);
      setSelections([]);
    }} load={books} describe={b => b.reference + ' v' + b.revision + ' - ' + b.name + ' (' + b.currency + ')'} />}
    <Input label="Quotation Valid Until (Local Time)" type="datetime-local" required value={until} onChange={e => setUntil(e.target.value)} />
    <Textarea label="Explicit Customer Commercial Terms" required value={terms} onChange={e => setTerms(e.target.value)} />
    {sourceError && <p role="alert" className="text-red-700">
      {sourceError}
    </p>}
    {source && <div className="border rounded-lg p-3 space-y-2">
      <h2 className="font-semibold">Exact Approved BOM v{source.bomVersion}
      </h2>
      <ul className="text-sm">
        {source.lines.map(l => <li key={l.componentId}>
          {l.sku}: {l.description} - {l.quantity} {l.unit}
        </li>)}
      </ul>
      <p className="text-xs text-slate-500">All approved components require an explicit selling entry with the same quantity and unit. Catalog cost is not a selling price.</p>
    </div>}
    <PagedRecordSelect label="Tax Rule for Explicit Line Selection" selected={taxChoice} onChange={setTaxChoice} load={taxes} describe={t => t.reference + ' v' + t.revision + ' - ' + t.ratePercent + '% ' + (t.inclusive ? 'Inclusive' : 'Exclusive') + ' ' + t.currency} />
    {book && <>
      <Select label="Price-book Entry to Add" value={priceChoice} options={[
        {
          value: '', label: 'Choose Explicit Selling Entry'
        }, ...book.lines.map(l => ({
          value: l.id, label: l.code + ' - ' + l.description + ' | ' + money(book.currency, l.unitPrice) + ' / ' + l.unit
        }))
      ]} onChange={e => setPriceChoice(e.target.value)} />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => {
          setFormError('');
          if (!priceChoice || !taxChoice) {
            setFormError('Choose a selling entry and an explicit tax rule.');
            return;
          }
          if (selections.some(s => s.priceBookLineId === priceChoice)) {
            setFormError('That price entry is already selected.');
            return;
          }
          const l = book.lines.find(l => l.id === priceChoice)!;
          setSelections(rows => [
            ...rows, {
              key: crypto.randomUUID(), priceBookLineId: l.id, taxRuleId: taxChoice.id, tax: taxChoice, quantity: source?.lines.find(b => b.componentId === l.componentId)?.quantity ?? '', discount: '0'
            }
          ]);
        }}>Add Selected Selling Entry</Button>
        {source && <Button type="button" variant="outline" onClick={() => {
          setFormError('');
          if (!taxChoice) {
            setFormError('Choose the explicit tax rule first.');
            return;
          }
          const additions: Selection[] = [];
          for (const line of source.lines) {
            const matches = book.lines.filter(p => p.kind === 'COMPONENT' && p.componentId === line.componentId && p.unit === line.unit);
            if (matches.length !== 1) {
              setFormError('Each approved BOM component needs one unambiguous selling entry. Choose entries individually where needed.');
              return;
            }
            if (!selections.some(s => s.priceBookLineId === matches[0].id))
              additions.push({
                key: crypto.randomUUID(), priceBookLineId: matches[0].id, taxRuleId: taxChoice.id, tax: taxChoice, quantity: line.quantity, discount: '0'
              });
          }
          setSelections(rows => [
            ...rows, ...additions
          ]);
        }}>Add Exact BOM Entries with Chosen Tax</Button>}
        <Button type="button" variant="outline" disabled={!taxChoice || !selections.length} onClick={() => {
          if (taxChoice)
            setSelections(rows => rows.map(r => ({
              ...r, taxRuleId: taxChoice.id, tax: taxChoice
            })));
        }}>Apply Chosen Tax to All Selected Lines</Button>
      </div>
    </>}
    {formError && <p role="alert" className="text-red-700">
      {formError}
    </p>}
    {selections.map((s, i) => {
      const entry = book?.lines.find(l => l.id === s.priceBookLineId);
      return <div className="border rounded-lg p-3 space-y-3" key={s.key}>
        <h3 className="font-semibold">
          {i + 1}. {entry?.description ?? 'Original Price Entry ' + s.priceBookLineId}
        </h3>
        <p className="text-sm">Unit selling price: {money(book?.currency ?? '', entry?.unitPrice)} / {entry?.unit}; tax {s.tax ? s.tax.reference + ' v' + s.tax.revision + ' ' + s.tax.ratePercent + '%' : s.taxRuleId}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={'Quotation Line ' + (i + 1) + ' Quantity'} inputMode="decimal" required value={s.quantity} onChange={e => change(s.key, {
            quantity: e.target.value
          })} />
          <Input label={'Quotation Line ' + (i + 1) + ' Explicit Discount Amount'} inputMode="decimal" required value={s.discount} onChange={e => change(s.key, {
            discount: e.target.value
          })} />
        </div>
        <Button type="button" variant="ghost" onClick={() => setSelections(rows => rows.filter(r => r.key !== s.key))}>Remove Quotation Line</Button>
      </div>;
    })}
    <Button type="button" variant="outline" isLoading={previewBusy} onClick={async () => {
      setPreviewError('');
      setPreviewBusy(true);
      try {
        const result = await financeClient.preview(fields());
        setPreview({
          key: draftKey, data: result
        });
      }
      catch (e) {
        setPreviewError(e instanceof Error ? e.message : 'Pricing preview failed.');
      }
      finally {
        setPreviewBusy(false);
      }
    }}>Calculate Exact Server Pricing</Button>
    {previewError && <p role="alert">
      {previewError}
    </p>}
    {currentPreview && <div className="border rounded-lg bg-green-50 p-4 space-y-2">
      <h2 className="font-semibold">Current Server Calculation</h2>
      <p>Subtotal {money(currentPreview.currency, currentPreview.subtotal)}; discount {money(currentPreview.currency, currentPreview.discountAmount)}
      </p>
      <p>Taxable {money(currentPreview.currency, currentPreview.taxableAmount)}; tax {money(currentPreview.currency, currentPreview.taxAmount)}
      </p>
      <p className="font-semibold">Gross quotation {money(currentPreview.currency, currentPreview.totalAmount)}
      </p>
      {currentPreview.estimatedCost !== undefined && <p>Explicit estimated cost {money(currentPreview.currency, currentPreview.estimatedCost)}; estimated margin {money(currentPreview.currency, currentPreview.estimatedMargin)}
      </p>}
      <p className="text-sm">
        {currentPreview.sensitivePricing ? 'Administrator review required for sensitive or incomplete cost pricing.' : 'Independent financial review required.'}
      </p>
    </div>}
    <p className="text-sm text-amber-800">The server calculates Decimal totals with line rounding and validates current approvals. Drafts are not customer acceptance, paid invoices or installation authorization.</p>
  </IdempotentActionForm>;
}
