import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { serviceClient, serviceChecks, servicePriorities, type ServiceMaintenancePlan, type ServiceOccurrence, type ServiceInstallation, type ServiceSlaPolicy } from '../services/serviceClient';
const installations = (q: RecordQuery) => serviceClient.installations(q), policies = (q: RecordQuery) => serviceClient.policies(q), local = (v: string) => new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export function ServiceMaintenancePage() {
  const { user } = useAuth(), [params, setParams] = useSearchParams(), id = params.get('plan'), [due, setDue] = useState(false), [page, setPage] = useState(1), [rows, setRows] = useState<ServiceMaintenancePlan[]>([]), [total, setTotal] = useState(0), [plan, setPlan] = useState<ServiceMaintenancePlan | null>(null), [occurrences, setOccurrences] = useState<ServiceOccurrence[]>([]), [occurrencePage, setOccurrencePage] = useState(1), [occurrenceTotal, setOccurrenceTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const refresh = useCallback(async () => {
    if (user?.role !== 'admin')
      return;
    const [r, p, o] = await Promise.all([
      serviceClient.plans({
        page, pageSize: 20
      }, due), id ? serviceClient.plan(id) : Promise.resolve(null), id ? serviceClient.occurrences(id, occurrencePage) : Promise.resolve({
        data: [], total: 0
      })
    ]);
    setRows(r.data);
    setTotal(r.total);
    setPlan(p);
    setOccurrences(o.data);
    setOccurrenceTotal(o.total);
    setError('');
  }, [
    user?.role, id, page, due, occurrencePage
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
    };
  }, [
    refresh, retry
  ]);
  if (user?.role !== 'admin')
    return <Navigate to="/service/dashboard" replace />;
  const columns: Column<ServiceMaintenancePlan>[] = [
    {
      key: 'reference', header: 'Maintenance Plan', render: r => <Button variant="ghost" onClick={() => {
        setOccurrencePage(1);
        setParams({
          plan: r.id
        });
      }}>
        {r.reference}
      </Button>
    }, {
      key: 'category', header: 'Maintenance Category'
    }, {
      key: 'status', header: 'State'
    }, {
      key: 'intervalDays', header: 'Configured Interval Days'
    }, {
      key: 'nextDueAt', header: 'Next Due', render: r => new Date(r.nextDueAt).toLocaleString()
    }
  ];
  return <div className="max-w-6xl mx-auto space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Preventive Maintenance</h1>
      <Link to="/service/dashboard">
        <Button variant="outline">Service Dashboard</Button>
      </Link>
    </div>
    <Card>
      <label>
        <input type="checkbox" checked={due} onChange={e => {
          setDue(e.target.checked);
          setPage(1);
        }} /> Show Only Active Plans Currently Due</label>
      <p className="text-sm text-slate-500 mt-2">Maintenance tickets are generated explicitly. Completion advances the next due instant by the configured elapsed UTC interval; no notifications or background work are invented.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No maintenance plans match." />}
    <MaintenanceCreateForm onSaved={refresh} />
    {plan && !error && <div key={plan.id + ':' + plan.version} className="space-y-5">
      <MaintenancePlanForms plan={plan} onSaved={refresh} />
      <Card>
        <h2 className="font-semibold">Generated Occurrences for {plan.reference}
        </h2>
        {occurrences.map(o => <div className="border-t mt-3 pt-3 space-y-3" key={o.id}>
          <Link className="text-green-700" to={'/service/tickets/' + o.ticketId}>
            {o.ticket?.reference ?? 'Source Service Ticket'}
          </Link>
          <p>Due {new Date(o.dueAt).toLocaleString()}; ticket state {o.ticket?.status ?? 'Unknown'}; {o.completedAt ? 'Completed ' + new Date(o.completedAt).toLocaleString() : o.cancelledAt ? 'Canceled ' + new Date(o.cancelledAt).toLocaleString() : 'Not Finalized'}
          </p>
          {!o.completedAt && !o.cancelledAt && <MaintenanceOccurrenceForm plan={plan} occurrence={o} onSaved={refresh} />}
        </div>)}
        {!occurrences.length && <p>No generated occurrences on this page.</p>}
        <div className="flex gap-3 items-center mt-3">
          <Button variant="outline" disabled={occurrencePage <= 1} onClick={() => setOccurrencePage(v => v - 1)}>Previous Occurrences</Button>
          <span>Page {occurrencePage} of {Math.max(1, Math.ceil(occurrenceTotal / 20))}
          </span>
          <Button variant="outline" disabled={occurrencePage * 20 >= occurrenceTotal} onClick={() => setOccurrencePage(v => v + 1)}>Next Occurrences</Button>
        </div>
      </Card>
    </div>}
  </div>;
}
function MaintenanceCreateForm({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [installation, setInstallation] = useState<ServiceInstallation | null>(null), [reference, setReference] = useState(''), [category, setCategory] = useState(''), [days, setDays] = useState(''), [effective, setEffective] = useState(''), [due, setDue] = useState(''), [checks, setChecks] = useState<string[]>([]);
  return <IdempotentActionForm title="Create Preventive Maintenance Plan" build={reason => {
    if (!installation)
      throw new Error('Choose a commissioned installation.');
    return {
      reference, installationId: installation.id, category, intervalDays: Number(days), effectiveAt: new Date(effective).toISOString(), nextDueAt: new Date(due).toISOString(), requiredChecks: checks, reason
    };
  }} send={serviceClient.createPlan} onSaved={onSaved}>
    <PagedRecordSelect label="Maintenance Installation" selected={installation} onChange={setInstallation} load={installations} describe={r => r.name + ' - ' + r.reference} required />
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Maintenance Plan Reference" required value={reference} onChange={e => setReference(e.target.value)} />
      <Input label="Configured Maintenance Category" required value={category} onChange={e => setCategory(e.target.value)} />
      <Input label="Contractual Maintenance Interval Days" type="number" required min={1} max={3650} value={days} onChange={e => setDays(e.target.value)} />
      <Input label="Maintenance Effective At (Local Time)" type="datetime-local" required value={effective} onChange={e => setEffective(e.target.value)} />
      <Input label="First Configured Due Time (Local Time)" type="datetime-local" required min={effective} value={due} onChange={e => setDue(e.target.value)} />
    </div>
    <fieldset>
      <legend className="font-medium">Required Maintenance Checks (Choose At Least One)</legend>
      {serviceChecks.map(c => <label className="block text-sm py-1" key={c}>
        <input type="checkbox" checked={checks.includes(c)} onChange={e => setChecks(e.target.checked ? [
          ...checks, c
        ] : checks.filter(v => v !== c))} /> {c.replaceAll('_', ' ')}
      </label>)}
    </fieldset>
  </IdempotentActionForm>;
}
function MaintenancePlanForms({ plan: p, onSaved }: {
  plan: ServiceMaintenancePlan;
  onSaved: () => Promise<void>;
}) {
  const [status, setStatus] = useState(p.status), [due, setDue] = useState(local(p.nextDueAt)), [priority, setPriority] = useState('MEDIUM'), [sla, setSla] = useState<ServiceSlaPolicy | null>(null);
  return <>
    <Card>
      <h2 className="font-semibold">
        {p.reference} - Version {p.version}
      </h2>
      <p>
        {p.category}; {p.intervalDays} elapsed UTC days; required checks {p.requiredChecks.join(', ')}
      </p>
    </Card>
    {p.status !== 'CANCELLED' && <IdempotentActionForm title="Update Explicit Maintenance Plan State" build={reason => ({
      version: p.version, reason, status, nextDueAt: new Date(due).toISOString()
    })} send={body => serviceClient.updatePlan(p.id, body)} onSaved={onSaved}>
      <Select label="Maintenance Plan State" value={status} options={[
        'ACTIVE', 'PAUSED', 'CANCELLED'
      ].map(v => ({
        value: v, label: v
      }))} onChange={e => setStatus(e.target.value)} />
      <Input label="Explicit Next Due Time (Local Time)" type="datetime-local" required value={due} onChange={e => setDue(e.target.value)} />
      <p className="text-sm">Finalize any pending generated occurrence before changing this plan.</p>
    </IdempotentActionForm>}
    {p.status === 'ACTIVE' && <IdempotentActionForm title="Generate Explicit Maintenance Service Ticket" build={reason => ({
      version: p.version, reason, priority, slaPolicyId: sla?.id ?? null
    })} send={body => serviceClient.planCommand(p.id, 'generate-ticket', body)} onSaved={onSaved}>
      <Select label="Generated Maintenance Ticket Priority" value={priority} options={servicePriorities.map(v => ({
        value: v, label: v
      }))} onChange={e => setPriority(e.target.value)} />
      <PagedRecordSelect label="Applicable Maintenance SLA (Optional)" selected={sla} onChange={setSla} load={policies} describe={s => s.reference + ' v' + s.revision + ' | ' + s.category + ' | ' + s.priority} />
      <p className="text-sm">Creates one unfinished occurrence and a real PREVENTIVE_MAINTENANCE ticket, without fabricating field completion.</p>
    </IdempotentActionForm>}
  </>;
}
function MaintenanceOccurrenceForm({ plan: p, occurrence: o, onSaved }: {
  plan: ServiceMaintenancePlan;
  occurrence: ServiceOccurrence;
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  return o.ticket?.status === 'CANCELLED' ? <IdempotentActionForm title="Finalize Canceled Maintenance Occurrence" build={reason => ({
    version: p.version, reason
  })} send={body => serviceClient.cancelOccurrence(p.id, o.id, body)} onSaved={onSaved}>
    <p>Preserves the canceled ticket. Explicitly reschedule the plan to a new due instant before regenerating.</p>
  </IdempotentActionForm> : [
    'RESOLVED', 'CLOSED'
  ].includes(o.ticket?.status ?? '') ? <IdempotentActionForm title="Finalize Actual Maintenance Completion" build={reason => ({
    version: p.version, reason, occurrenceId: o.id, completionNotes: notes
  })} send={body => serviceClient.planCommand(p.id, 'complete', body)} onSaved={onSaved}>
    <Textarea label="Observed Maintenance Completion Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
  </IdempotentActionForm> : <p className="text-sm text-amber-800">Resolve or explicitly cancel the source service ticket before finalizing this occurrence.</p>;
}
