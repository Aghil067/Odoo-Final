import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { serviceClient, type ServiceTicket, type ServiceVisit, type ServiceDiagnosis, type ServicePart, type ServiceChecklist } from '../services/serviceClient';
import { ServiceCommandForm } from './ServiceTicketWorkForms';
interface AuditRecord {
  id: string;
  event?: string;
  reason?: string;
  createdAt?: string;
  version?: number;
  fromStatus?: string;
  toStatus?: string;
  notes?: string;
  actorId?: string;
  ticketVersion?: number;
  acknowledged?: boolean;
  rating?: number | null;
  comments?: string | null;
  source?: string;
  observedAt?: string;
  attestation?: string;
  checklist?: Record<string, boolean>;
}
export function ServiceRecordCollection({ ticket: t, kind, admin = false, onSaved }: {
  ticket: ServiceTicket;
  kind: 'visits' | 'diagnoses' | 'parts' | 'checklist' | 'history' | 'feedback' | 'reviews';
  admin?: boolean;
  onSaved: () => Promise<void>;
}) {
  const [rows, setRows] = useState<(ServiceVisit | ServiceDiagnosis | ServicePart | ServiceChecklist | AuditRecord)[]>([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    serviceClient.collection<ServiceVisit | ServiceDiagnosis | ServicePart | ServiceChecklist | AuditRecord>(t.id, kind, page).then(r => {
      if (live) {
        setRows(r.data);
        setTotal(r.total);
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
    t.id, t.version, kind, page, retry
  ]);
  return <div className="space-y-4">
    <h2 className="font-semibold text-lg">Recorded {kind}
    </h2>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : loading ? <p>Loading source records...</p> : <>
      {rows.map(row => <Card key={row.id}>
        {'scheduledStartAt' in row ? <>
          <p className="font-semibold">
            {row.status} | {row.assignment?.user.name ?? row.userId} | Cycle {row.executionRevision}
          </p>
          <p>
            {new Date(row.scheduledStartAt).toLocaleString()} through {new Date(row.scheduledEndAt).toLocaleString()}
          </p>
          <p>Observed arrival {row.arrivedAt ? new Date(row.arrivedAt).toLocaleString() : 'Not Recorded'}; departure {row.departedAt ? new Date(row.departedAt).toLocaleString() : 'Not Recorded'}
          </p>
          <p>
            {row.workPerformed ?? 'No Work Recorded'}
          </p>
          <p>
            {row.outcome}
          </p>
        </> : 'finding' in row ? <>
          <p className="font-semibold">
            {row.finding}
          </p>
          <p>Reported: {row.reportedSymptom}
          </p>
          <p>Observed: {row.observedSymptom}
          </p>
          <p>Method: {row.method}
          </p>
          <p>Probable cause: {row.probableCause ?? 'Not Established'}
          </p>
          <p>Uncertainty: {row.uncertainty}
          </p>
          <ul>
            {row.measurements.map((m, i) => <li key={i}>
              {m.name}: {m.value} {m.unit}
              {m.requirementReference ? ' (basis ' + m.requirementReference + ')' : ''}
            </li>)}
          </ul>
          <p className="text-sm">Cycle {row.executionRevision}; {new Date(row.createdAt).toLocaleString()}
          </p>
        </> : 'quantity' in row ? <>
          <p className="font-semibold">
            {row.status}: {row.quantity} of component {row.componentId}
          </p>
          <p>
            {row.purpose}
          </p>
          <p>
            {row.dispositionNotes}
          </p>
          <p className="text-sm text-amber-800">Service inventory fulfillment is not supported. No stock movement or serial substitution is implied.</p>
          {admin && row.status === 'PENDING_HANDOFF' && ![
            'CLOSED', 'CANCELLED', 'RESOLVED'
          ].includes(t.status) && <PartDisposition ticket={t} part={row} onSaved={onSaved} />}
        </> : 'result' in row ? <>
          <p className="font-semibold">
            {row.key.replaceAll('_', ' ')}: {row.result}
          </p>
          <p>
            {row.notes}
          </p>
          <p className="text-sm">Cycle {row.executionRevision}; ticket version {row.ticketVersion}
          </p>
        </> : <>
          <p className="font-semibold">
            {row.event ?? (row.acknowledged === undefined ? 'Closure Review' : row.acknowledged ? 'Customer Acknowledged' : 'Customer Did Not Acknowledge')}
          </p>
          <p>
            {row.reason ?? row.notes ?? row.comments}
          </p>
          {row.rating !== undefined && <p>Actual customer rating: {row.rating ?? 'Not Provided'}
          </p>}
          {row.source && <p>Source: {row.source}; observed {row.observedAt ? new Date(row.observedAt).toLocaleString() : 'Not Recorded'}
          </p>}
          {row.attestation && <p>Recorder attestation: {row.attestation}
          </p>}
          {row.fromStatus && <p>
            {row.fromStatus} to {row.toStatus}
          </p>}
          {row.checklist && <ul>
            {Object.entries(row.checklist).map(([key, value]) => <li key={key}>
              {key.replace(/([a-z])([A-Z])/g, '$1 $2')}: {value ? 'Acknowledged' : 'Not Acknowledged'}
            </li>)}
          </ul>}
          <p className="text-sm">Version {row.version ?? row.ticketVersion}; {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
          </p>
        </>}
      </Card>)}
      {!rows.length && <Card>No source records in this collection.</Card>}
    </>}
    <div className="flex gap-3 items-center">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous Records</Button>
      <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Records</Button>
    </div>
  </div>;
}
function PartDisposition({ ticket, part, onSaved }: {
  ticket: ServiceTicket;
  part: ServicePart;
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  return <ServiceCommandForm ticket={ticket} title="Cancel Pending Parts Handoff" action="" fields={() => ({
    partVersion: part.version, dispositionNotes: notes
  })} send={body => serviceClient.cancelPart(ticket.id, part.id, body)} onSaved={onSaved}>
    <Textarea label="Explicit Parts Request Disposition" required value={notes} onChange={e => setNotes(e.target.value)} />
  </ServiceCommandForm>;
}
export function ServiceWarrantyContext({ id }: {
  id: string;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof serviceClient.warranty>> | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    serviceClient.warranty(id).then(r => {
      if (live)
        setData(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    id, retry
  ]);
  return <Card>
    <h2 className="font-semibold">Current Authorized Warranty Context</h2>
    {error ? <>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </> : !data ? <p>Loading current warranty context...</p> : !data.current.context ? <p className="text-amber-800">Separate warranty access is unavailable. Coverage has not been determined.</p> : <>
      <p className="text-xs text-slate-500">Retrieved {new Date(data.current.capturedAt).toLocaleString()}
      </p>
      {data.current.context.data.map(r => <div className="border-t mt-3 pt-3" key={r.id}>
        <p>
          {r.reference}: {r.effectiveStatus}
        </p>
        <p>
          {r.coverageType.replaceAll('_', ' ')}; verified start {r.verifiedStartDate?.slice(0, 10) ?? 'Unknown'}; expiry {r.expiresAt?.slice(0, 10) ?? 'Unknown'}
        </p>
      </div>)}
      {!data.current.context.data.length && <p>No registered coverage in the authorized context.</p>}
      {data.current.coverageTruncated && <p>Coverage context is limited to 100 records.</p>}
      <p className="text-sm text-amber-800 mt-3">Active coverage does not establish fault acceptance, an approved claim or free service billing.</p>
    </>}
  </Card>;
}
