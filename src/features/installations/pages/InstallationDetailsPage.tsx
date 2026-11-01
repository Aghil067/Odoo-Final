import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { installationClient, type InstallationJob, type InstallationAttachment, type InstallationIssue, type InstallationTest, type InstallationHistory, type CommissionedInstallation } from '../services/installationClient';
import { InstallationActionForm, InstallationEvidenceForm, InstallationReadinessForm, InstallationReceiptForm, InstallationEquipmentForm, InstallationMilestoneForm, InstallationTestForm, InstallationIssueForm, InstallationIssueResolution, InstallationReviewForm, equipmentLabel } from '../components/InstallationWorkForms';
import { InstallationPlanForm } from '../components/InstallationPlanForm';
const title = (s: string) => s.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
const date = (s: string | null | undefined) => s ? new Date(s).toLocaleString() : 'Not recorded';
type AuditRecord = {
  id: string;
  actorId?: string;
  receivedAt?: string;
  createdAt?: string;
  jobVersion: number;
  notes?: string;
  conditionalWorkResolution?: string;
  outstandingIssues?: string | null;
  checklist?: Record<string, boolean>;
  evidenceIds?: string[];
  snapshot?: {
    equipmentId: string;
    receivedQuantity: string;
    damagedQuantity: string;
    receivedSerialIds: string[];
    damagedSerialIds: string[];
  }[];
};
export function InstallationDetailsPage() {
  const { id } = useParams(), { user } = useAuth(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'overview';
  const [job, setJob] = useState<InstallationJob | null>(null), [files, setFiles] = useState<InstallationAttachment[]>([]), [handoff, setHandoff] = useState<CommissionedInstallation | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [downloadError, setDownloadError] = useState('');
  const finance = user?.role === 'finance_officer', admin = user?.role === 'admin', editor = admin || user?.role === 'technician';
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id)
      return;
    const record = await installationClient.detail(id);
    let attachments: InstallationAttachment[] = [];
    if (!finance) {
      for (let page = 1;page <= 3;page++) {
        const result = await installationClient.collection<InstallationAttachment>(id, 'attachments', page);
        attachments = attachments.concat(result.data);
        if (attachments.length >= result.total)
          break;
      }
    }
    const completed = record.status === 'COMMISSIONED' ? await installationClient.commissioned(id) : null;
    if (generation !== requestGeneration.current) return;
    setJob(record);
    setFiles(attachments);
    setHandoff(completed);
    setError('');
  }, [
    id, finance
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
    invalidate, refresh
  ]);
  if (loading)
    return <p>Loading installation record...</p>;
  if (error || !job)
    return <Card>
      <p role="alert" className="text-red-700">
        {error || 'Installation unavailable.'}
      </p>
      <Button onClick={() => {
        setLoading(true);
        refresh().catch(e => setError(e.message)).finally(() => setLoading(false));
      }}>Retry</Button>
    </Card>;
  const frozen = [
    'COMMISSIONED', 'CANCELED', 'COMMISSIONING_REVIEW'
  ].includes(job.status), writable = editor && !frozen, context = {
    job, files, onSaved: refresh
  };
  const tabs = finance ? [
    'overview', 'completion'
  ] : [
    'overview', 'plan', 'readiness', 'equipment', 'milestones', 'issues', 'evidence', 'tests', 'completion', 'history'
  ];
  const actions: {
    action: string;
    label: string;
    states: string[];
    admin?: boolean;
  }[] = [
      {
        action: 'start', label: 'Start Installation', states: [
          'SITE_READY', 'REWORK_REQUIRED'
        ]
      }, {
        action: 'hold', label: 'Hold Installation', states: [
          'IN_PROGRESS', 'TESTING', 'WORK_COMPLETED', 'REWORK_REQUIRED'
        ]
      }, {
        action: 'resume', label: 'Resume Installation', states: [
          'ON_HOLD'
        ]
      }, {
        action: 'submit-completion', label: 'Submit Completed Work', states: [
          'IN_PROGRESS', 'REWORK_REQUIRED'
        ]
      }, {
        action: 'begin-testing', label: 'Begin Installation Testing', states: [
          'WORK_COMPLETED'
        ]
      }, {
        action: 'request-rework', label: 'Request Explicit Rework', states: [
          'WORK_COMPLETED', 'TESTING', 'ON_HOLD'
        ]
      }, {
        action: 'submit-commissioning', label: 'Submit for Independent Commissioning', states: [
          'TESTING'
        ]
      }, {
        action: 'cancel', label: 'Cancel Installation', states: [
          'PLANNED', 'SITE_READY', 'ON_HOLD'
        ], admin: true
      }
    ];
  return <div className="space-y-5 max-w-7xl mx-auto">
    <Link className="text-green-700" to="/installations">Back to Installations</Link>
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {job.name}
        </h1>
        <p className="text-sm text-slate-500">
          {job.reference} | Version {job.version}
        </p>
      </div>
      <span className="bg-green-50 text-green-800 px-3 py-2 rounded-lg font-medium">
        {title(job.status)}
      </span>
    </div>
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map(t => <Button variant={tab === t ? 'primary' : 'ghost'} key={t} onClick={() => setParams({
        tab: t
      })}>
        {title(t)}
      </Button>)}
    </div>
    <div key={job.version + ':' + tab} className="space-y-5">
      {tab === 'overview' && <>
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <h2 className="font-semibold mb-3">Project and Handoff References</h2>
            <dl className="space-y-2 text-sm">
              {[
                [
                  'Customer', '/crm/customers/' + job.customerId
                ], [
                  'Approved Configuration', '/configurations/' + job.configurationId
                ], [
                  'Warehouse Dispatch', '/inventory/issues/' + job.dispatchId + '?kind=dispatch'
                ]
              ].map(([name, url]) => <div key={name}>
                <dt className="text-slate-500">
                  {name}
                </dt>
                <dd>
                  <Link className="text-green-700" to={url}>
                    {name} Record</Link>
                </dd>
              </div>)}
              <dt>Site Identity</dt>
              <dd className="break-all">
                {job.siteId}
              </dd>
              <dt>Approved Configuration Version / BOM Version</dt>
              <dd>
                {job.configurationApprovedVersion} / {job.bomVersion}
              </dd>
            </dl>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Dates and Assigned Work</h2>
            <dl className="space-y-2 text-sm">
              {[
                [
                  'Planned Start', job.plannedStartAt
                ], [
                  'Planned End', job.plannedEndAt
                ], [
                  'Actual Start', job.actualStartAt
                ], [
                  'Actual End', job.actualEndAt
                ], [
                  'Physical Site Receipt', job.deliveryConfirmedAt
                ], [
                  'Internal Commissioning', job.commissionedAt
                ]
              ].map(([name, value]) => <div key={name}>
                <dt className="text-slate-500">
                  {name}
                </dt>
                <dd>
                  {date(value)}
                </dd>
              </div>)}
            </dl>
            {job.assignments && <p className="text-sm mt-3">Assigned technicians: {job.assignments.map(a => a.user.name).join(', ') || 'None'}
            </p>}
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold">Safety and Readiness Notes</h2>
          <p className="whitespace-pre-wrap mt-2">
            {job.safetyNotes || 'No safety planning notes recorded.'}
          </p>
          <p className="whitespace-pre-wrap mt-2">
            {job.siteReadinessNotes || 'No readiness planning notes recorded.'}
          </p>
          <p className="text-sm text-amber-800 mt-3">Warehouse dispatch is release only. Physical receipt, safety checks, installed equipment and required tests must be verified separately.</p>
        </Card>
        {writable && actions.filter(a => a.states.includes(job.status) && (!a.admin || admin)).map(a => <InstallationActionForm key={a.action} title={a.label} submit={async (reason) => {
          await installationClient.command(job.id, a.action, {
            version: job.version, reason
          });
          await refresh();
        }}>
          <p className="text-sm text-slate-500">The backend verifies prerequisites and preserves an audited versioned transition.</p>
        </InstallationActionForm>)}
      </>}
      {tab === 'plan' && (writable ? <InstallationPlanForm job={job} admin={admin} onSaved={refresh} /> : <Card>This submitted or terminal plan is immutable. Use an explicit review or rework workflow where supported.</Card>)}
      {tab === 'readiness' && <>
        {writable && <InstallationReadinessForm {...context} />}
        {writable && [
          'PLANNED', 'SITE_READY', 'ON_HOLD'
        ].includes(job.status) && <InstallationReceiptForm {...context} />}
        <InstallationCollection key={'readiness' + job.version} id={job.id} kind="readiness" />
        <InstallationCollection key={'receipts' + job.version} id={job.id} kind="receipts" />
      </>}
      {tab === 'equipment' && <>
        {(job.equipment ?? []).map(e => <Card key={e.id}>
          <h2 className="font-semibold">
            {equipmentLabel(e)}
          </h2>
          <p className="text-sm">Dispatched {e.dispatchedQuantity} {e.unit}; usable at site {e.receivedQuantity}; damaged {e.damagedQuantity}; installed {e.installedQuantity}.</p>
          <p>Installed position: {e.installedLocation || 'Not recorded'}
          </p>
          <ul className="mt-2 text-sm">
            {e.serials.map(s => <li key={s.id}>
              {s.serialUnit.serialNumber}: {s.installedAt ? 'Installed ' + date(s.installedAt) : s.received ? 'Verified Usable' : s.damaged ? 'Damaged' : 'Not Verified'}
            </li>)}
          </ul>
        </Card>)}
        {writable && [
          'IN_PROGRESS', 'REWORK_REQUIRED'
        ].includes(job.status) && (job.equipment ?? []).map(e => <InstallationEquipmentForm key={e.id} {...context} equipment={e} />)}
      </>}
      {tab === 'milestones' && <>
        {(job.milestones ?? []).map(m => writable ? <InstallationMilestoneForm key={m.id} {...context} milestone={m} admin={admin} /> : <Card key={m.id}>
          <h2 className="font-semibold">
            {title(m.type)}: {title(m.status)}
          </h2>
          <p>
            {m.completionNotes || 'No completion notes.'}
          </p>
          <p className="text-sm">
            {m.required ? 'Required' : 'Optional'}; completed {date(m.actualEndAt)}
          </p>
        </Card>)}
      </>}
      {tab === 'issues' && <>
        {writable && <InstallationIssueForm {...context} />}
        <InstallationCollection key={job.version} id={job.id} kind="issues" context={context} admin={admin} writable={writable} />
      </>}
      {tab === 'evidence' && <>
        {writable && <InstallationEvidenceForm job={job} onSaved={refresh} />}
        <Card>
          <h2 className="font-semibold">Private Installation Evidence</h2>
          {!files.length ? <p>No evidence uploaded.</p> : <ul className="divide-y">
            {files.map(f => <li key={f.id} className="py-3 space-y-1">
              <div className="flex flex-wrap justify-between gap-2">
                <span>
                  {f.fileName} ({title(f.category)})</span>
                <Button size="sm" variant="outline" onClick={async () => {
                  setDownloadError('');
                  try {
                    await installationClient.download(job.id, f);
                  }
                  catch (e) {
                    setDownloadError(e instanceof Error ? e.message : 'Download failed.');
                  }
                }}>Download {f.fileName}
                </Button>
              </div>
              <p className="text-xs text-slate-500 break-all">
                {f.sizeBytes} bytes; recorded {date(f.createdAt)}; SHA-256 {f.sha256}
              </p>
            </li>)}
          </ul>}
          {downloadError && <p role="alert">
            {downloadError}
          </p>}
        </Card>
      </>}
      {tab === 'tests' && <>
        <Card>
          <h2 className="font-semibold">Internal Testing</h2>
          <p className="text-sm">Record actual observations against the design or manufacturer basis. These records do not constitute external electrical certification.</p>
        </Card>
        {writable && job.status === 'TESTING' && job.testRequirements.map(r => <InstallationTestForm key={r.type} {...context} requirement={r} admin={admin} />)}
        <InstallationCollection key={job.version} id={job.id} kind="tests" />
      </>}
      {tab === 'completion' && <>
        <Card>
          <h2 className="font-semibold">Completion Notes</h2>
          <p className="whitespace-pre-wrap">
            {job.completionNotes || 'No completion notes recorded.'}
          </p>
        </Card>
        {job.status === 'COMMISSIONING_REVIEW' && admin && <InstallationReviewForm job={job} onSaved={refresh} />}
        {handoff ? <Card>
          <h2 className="font-semibold">Approved Internal Commissioning Handoff</h2>
          <p>Review: {handoff.commissioningReviewId}
          </p>
          <p>Physical receipt: {date(handoff.deliveryConfirmedAt)}
          </p>
          <p>Internal commissioning: {date(handoff.commissioningDate)}
          </p>
          <p>Dispatch: {handoff.dispatchReference}
          </p>
          <p>Installed equipment lines: {handoff.equipment.length}; recorded test types: {handoff.testSummary.length}
          </p>
          <p className="text-sm text-amber-800 mt-2">External grid authorization is not recorded. Warranty start is determined separately by the warranty workflow.</p>
          <ul>
            {handoff.outstandingNonblockingIssues.map(i => <li key={i.id}>
              {i.description}
            </li>)}
          </ul>
        </Card> : <Card>No approved commissioning handoff is available yet.</Card>}
      </>}
      {tab === 'history' && <InstallationCollection id={job.id} kind="history" />}
    </div>
  </div>;
}
function InstallationCollection({ id, kind, context, admin = false, writable = false }: {
  id: string;
  kind: 'issues' | 'tests' | 'history' | 'readiness' | 'receipts';
  context?: {
    job: InstallationJob;
    files: InstallationAttachment[];
    onSaved: () => Promise<void>;
  };
  admin?: boolean;
  writable?: boolean;
}) {
  const [page, setPage] = useState(1), [rows, setRows] = useState<(InstallationIssue | InstallationTest | InstallationHistory | AuditRecord)[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    installationClient.collection<InstallationIssue | InstallationTest | InstallationHistory | AuditRecord>(id, kind, page).then(r => {
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
    id, kind, page, retry
  ]);
  return <Card>
    <h2 className="font-semibold text-lg mb-3">Recorded {title(kind)}
    </h2>
    {error ? <>
      <p role="alert" className="text-red-700">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </> : loading ? <p>Loading records...</p> : !rows.length ? <p>No records yet.</p> : <div className="space-y-4">
      {rows.map(row => <div className="border rounded-lg p-3 space-y-2" key={row.id}>
        {'severity' in row ? <>
          <p className="font-medium">
            {title(row.type)} | {row.severity} | {row.status}
            {row.blocking ? ' | Blocking' : ''}
          </p>
          <p>
            {row.description}
          </p>
          {row.resolution && <p>Resolution: {row.resolution}
          </p>}
          <p className="text-xs">Reported {date(row.reportedAt)}
          </p>
          {context && writable && (admin || (!row.blocking && ![
            'HIGH', 'CRITICAL'
          ].includes(row.severity))) && <InstallationIssueResolution {...context} issue={row} />}
        </> : 'result' in row ? <>
          <p className="font-medium">
            {title(row.type)}: {row.result}
            {!row.applicable ? ' (Not Applicable)' : ''}
          </p>
          <p>
            {row.observations}
          </p>
          {row.measurement !== null && <p>Measurement: {row.measurement} {row.unit}
          </p>}
          <p className="text-sm">Basis: {row.requirementsBasis}; execution revision {row.executionRevision}
          </p>
        </> : 'event' in row ? <>
          <p className="font-medium">
            {title(row.event)}: {row.fromStatus ?? 'New'} to {row.toStatus}
          </p>
          <p>
            {row.reason}
          </p>
          <p className="text-xs">Actor {row.actorId}; job version {row.jobVersion}; {date(row.createdAt)}
          </p>
        </> : <>
          <p className="font-medium">Version {row.jobVersion} | {date(row.receivedAt ?? row.createdAt)}
          </p>
          <p>
            {row.notes}
          </p>
          {row.checklist && <ul className="text-sm">
            {Object.entries(row.checklist).map(([key, value]) => <li key={key}>
              {title(key)}: {value ? 'Confirmed' : 'Not Confirmed'}
            </li>)}
          </ul>}
          {row.conditionalWorkResolution && <p>Conditions: {row.conditionalWorkResolution}
          </p>}
          {row.outstandingIssues && <p className="text-amber-800">Outstanding: {row.outstandingIssues}
          </p>}
          {row.snapshot && <ul className="text-sm">
            {row.snapshot.map(line => <li key={line.equipmentId}>Equipment {line.equipmentId}: usable {line.receivedQuantity}; damaged {line.damagedQuantity}; verified usable serials {line.receivedSerialIds.length}; damaged serials {line.damagedSerialIds.length}
            </li>)}
          </ul>}
        </>}
      </div>)}
    </div>}
    <div className="flex items-center gap-3 mt-4">
      <Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}>Previous Records</Button>
      <span className="text-sm">Page {page} of {Math.max(1, Math.ceil(total / 20))}
      </span>
      <Button size="sm" variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Records</Button>
    </div>
  </Card>;
}
