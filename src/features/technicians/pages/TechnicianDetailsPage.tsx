import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { workforceClient, type WorkforceSkill, type WorkforceCertification, type WorkforceSchedule, type WorkforceException, type WorkforceLeave } from '../services/workforceClient';
import { WorkforceProfileForm } from '../components/WorkforceProfileForm';
import { WorkforceQualificationForm } from '../components/WorkforceQualificationForm';
import { WorkforceScheduleForm, WorkforceExceptionForm, WorkforceLeaveForm, WorkforceLeaveReview } from '../components/WorkforceCalendarForms';
import { SkillCatalogEditor } from '../components/SkillCatalogForm';
const date = (v: string) => new Date(v).toLocaleString();
const clock = (m: number) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
type Audit = {
  id: string;
  event: string;
  reason: string;
  createdAt: string;
  actorId: string;
};
export function TechnicianDetailsPage() {
  const { id } = useParams(), { user } = useAuth(), [params, setParams] = useSearchParams(), tab = params.get('tab') ?? 'profile', admin = user?.role === 'admin';
  const [record, setRecord] = useState<Awaited<ReturnType<typeof workforceClient.detail>> | null>(null), [rows, setRows] = useState<(WorkforceSkill | WorkforceCertification | WorkforceSchedule | WorkforceException | WorkforceLeave | Audit)[]>([]), [total, setTotal] = useState(0), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!id)
      return;
    const detail = await workforceClient.detail(id);
    const result = [
      'skills', 'certifications', 'schedule', 'exceptions', 'history'
    ].includes(tab) ? await workforceClient.collection<WorkforceSkill | WorkforceCertification | WorkforceSchedule | WorkforceException | Audit>(id, tab, page) : tab === 'leaves' ? await workforceClient.leaves({
      userId: id, page, pageSize: 20
    }) : {
      data: [], total: 0
    };
    if (generation !== requestGeneration.current) return;
    setRecord(detail);
    setRows(result.data);
    setTotal(result.total);
    setError('');
  }, [
    id, tab, page
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
  if (loading)
    return <p>Loading workforce record...</p>;
  if (error || !record)
    return <Card>
      <p role="alert">
        {error || 'Workforce record unavailable.'}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card>;
  const p = record.profile, tabs = [
    'profile', 'skills', 'certifications', 'schedule', 'exceptions', 'leaves', 'history', ...(admin ? [
      'skill-policy'
    ] : [])
  ];
  return <div className="max-w-6xl mx-auto space-y-5">
    <Link className="text-green-700" to="/technicians">Back to Technicians</Link>
    <h1 className="text-2xl font-bold">
      {record.user.name}
    </h1>
    <p className="text-sm text-slate-500">
      {p ? p.employeeCode + ' | Profile Version ' + p.version : 'Existing technician account; workforce profile not created.'}
    </p>
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map(t => <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => {
        setPage(1);
        setParams({
          tab: t
        });
      }}>
        {t.replaceAll('-', ' ')}
      </Button>)}
    </div>
    <div className="space-y-5" key={tab + ':' + p?.version}>
      {tab === 'profile' && (admin ? <WorkforceProfileForm id={id!} profile={p} onSaved={refresh} /> : <Card>
        {p ? <dl className="space-y-2">
          <dt>Employment</dt>
          <dd>
            {p.employmentStatus}
          </dd>
          <dt>Base Location</dt>
          <dd>
            {p.baseLocation ?? 'Not Recorded'}
          </dd>
          <dt>Experience</dt>
          <dd>
            {p.experienceMonths} months</dd>
          <dt>Scheduling</dt>
          <dd>
            {p.enforceScheduling ? 'Managed Calendar and Qualification Eligibility' : 'Legacy Source Assignment Checks'}
          </dd>
          <dt>Specializations</dt>
          <dd>
            {p.specializations.join(', ') || 'Not Recorded'}
          </dd>
        </dl> : <p>Ask an administrator to create this existing account's workforce profile.</p>}
      </Card>)}
      {tab === 'skills' && p && <WorkforceQualificationForm id={id!} profile={p} admin={admin} onSaved={refresh} />}
      {tab === 'certifications' && p && <WorkforceQualificationForm id={id!} profile={p} admin={admin} certification onSaved={refresh} />}
      {tab === 'schedule' && p && admin && <WorkforceScheduleForm id={id!} profile={p} schedules={rows as WorkforceSchedule[]} onSaved={refresh} />}
      {tab === 'exceptions' && p && admin && <WorkforceExceptionForm id={id!} profile={p} onSaved={refresh} />}
      {tab === 'leaves' && p && <WorkforceLeaveForm id={id!} onSaved={refresh} />}
      {tab === 'skill-policy' && admin && <SkillCatalogEditor onSaved={refresh} />}
      {tab !== 'profile' && tab !== 'skill-policy' && <>
        <h2 className="text-lg font-semibold">Recorded {tab}
        </h2>
        {!rows.length ? <Card>No records on this page.</Card> : rows.map(row => <Card key={row.id}>
          {'level' in row ? <>
            <h3 className="font-semibold">
              {row.skill.name} ({row.skill.code})</h3>
            <p>Level {row.level}; {row.experienceMonths} months relevant experience; {row.verification}.</p>
            <p>Evidence reference: {row.evidenceReference ?? 'Not Recorded'}
            </p>
          </> : 'certificateNumber' in row ? <>
            <h3 className="font-semibold">
              {row.provider} - {row.certificateNumber}
            </h3>
            <p>
              {row.verification}; issued {date(row.issuedAt)}; expires {date(row.expiresAt)}
            </p>
            <p>Skill identity: {row.skillId}; evidence: {row.evidenceReference}
            </p>
            {admin && <CertificateReview userId={id!} certificate={row} onSaved={refresh} />}
          </> : 'shifts' in row ? <>
            <h3 className="font-semibold">
              {row.isActive ? 'Active' : 'Archived'} Schedule: {row.timezone}
            </h3>
            <p>
              {date(row.effectiveFrom)} through {date(row.effectiveTo)}
            </p>
            <ul className="text-sm mt-2">
              {row.shifts.map((s, i) => <li key={s.id ?? i}>
                {[
                  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
                ][s.weekday]} {clock(s.startMinute)} to {clock(s.endMinute)}
                {s.breakStartMinute !== null ? ' (break ' + clock(s.breakStartMinute) + ' to ' + clock(s.breakEndMinute!) + ')' : ''}
              </li>)}
            </ul>
          </> : 'category' in row ? <>
            <h3 className="font-semibold">
              {row.category}: {row.status}
            </h3>
            <p>
              {date(row.startsAt)} through {date(row.endsAt)}
            </p>
            {row.privateNotes && <p>Private note: {row.privateNotes}
            </p>}
            {row.decisionNotes && <p>Decision: {row.decisionNotes}
            </p>}
            {admin && row.status === 'REQUESTED' && <WorkforceLeaveReview leave={row} onSaved={refresh} />}
            {[
              'REQUESTED', 'APPROVED'
            ].includes(row.status) && <RecordActionForm title="Cancel Leave" submit={async (reason) => {
              await workforceClient.cancelLeave(row.id, {
                version: row.version, reason
              });
              await refresh();
            }}>
                <p className="text-sm">Approved leave may be canceled only before it begins.</p>
              </RecordActionForm>}
          </> : 'kind' in row ? <>
            <h3 className="font-semibold">
              {row.kind}: {row.isActive ? 'Active' : 'Canceled'}
            </h3>
            <p>
              {date(row.startsAt)} through {date(row.endsAt)}
            </p>
            <p>
              {row.reason}
            </p>
            {admin && row.isActive && <RecordActionForm title="Cancel Calendar Exception" submit={async (reason) => {
              await workforceClient.cancelException(id!, row.id, {
                version: row.version, reason
              });
              await refresh();
            }}>
              <p>Preserves the original exception in history.</p>
            </RecordActionForm>}
          </> : <>
            <h3 className="font-semibold">
              {row.event}
            </h3>
            <p>
              {row.reason}
            </p>
            <p className="text-sm">
              {date(row.createdAt)}; actor {row.actorId}
            </p>
          </>}
        </Card>)}
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Records</Button>
          <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(v => v + 1)}>Next Records</Button>
        </div>
      </>}
    </div>
  </div>;
}
function CertificateReview({ userId, certificate: c, onSaved }: {
  userId: string;
  certificate: WorkforceCertification;
  onSaved: () => Promise<void>;
}) {
  const [verification, setVerification] = useState(c.verification);
  return <RecordActionForm title="Review Certification" submit={async (reason) => {
    await workforceClient.reviewCertification(userId, c.id, {
      version: c.version, reason, verification
    });
    await onSaved();
  }}>
    <Select label="Certification Verification Decision" value={verification} options={[
      'DECLARED', 'VERIFIED', 'REJECTED'
    ].map(v => ({
      value: v, label: v
    }))} onChange={e => setVerification(e.target.value)} />
  </RecordActionForm>;
}
