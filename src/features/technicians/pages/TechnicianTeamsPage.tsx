import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { workforceClient, type WorkforceTeam, type WorkforceUser, type TeamMember } from '../services/workforceClient';
const technicians = (q: RecordQuery) => workforceClient.list(q);
export function TechnicianTeamsPage() {
  const { user } = useAuth(), [params, setParams] = useSearchParams(), id = params.get('team'), admin = user?.role === 'admin';
  const [rows, setRows] = useState<WorkforceTeam[]>([]), [total, setTotal] = useState(0), [page, setPage] = useState(1), [team, setTeam] = useState<WorkforceTeam | null>(null), [members, setMembers] = useState<TeamMember[]>([]), [memberPage, setMemberPage] = useState(1), [memberTotal, setMemberTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);
  const invalidate = useCallback(() => { requestGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    const r = await workforceClient.teams({
      page, pageSize: 20
    });
    let detail: Awaited<ReturnType<typeof workforceClient.team>> | null = null;
    if (id)
      detail = await workforceClient.team(id, memberPage);
    if (generation !== requestGeneration.current) return;
    setRows(r.data);
    setTotal(r.total);
    setTeam(detail?.team ?? null);
    setMembers(detail?.data ?? []);
    setMemberTotal(detail?.pagination.totalItems ?? 0);
    setError('');
  }, [
    id, page, memberPage
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
  const columns: Column<WorkforceTeam>[] = [
    {
      key: 'code', header: 'Code'
    }, {
      key: 'name', header: 'Team', render: r => <Button variant="ghost" onClick={() => {
        setMemberPage(1);
        setParams({
          team: r.id
        });
      }}>
        {r.name}
      </Button>
    }, {
      key: 'isActive', header: 'State', render: r => r.isActive ? 'Active' : 'Inactive'
    }
  ];
  return <div className="space-y-5 max-w-6xl mx-auto">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Technician Teams</h1>
      <Link to="/technicians">
        <Button variant="outline">Technicians</Button>
      </Link>
    </div>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized teams." />}
    {admin && <TeamCreateForm onSaved={refresh} />}
    {team && !error && <div className="space-y-5" key={team.id + ':' + team.version}>
      <Card>
        <h2 className="text-lg font-semibold">
          {team.name} ({team.code})</h2>
        <p className="text-sm text-slate-500">Team membership is organizational. Survey, installation and service assignments stay with their own source workflows.</p>
        <ul className="divide-y mt-3">
          {members.map(m => <li className="py-3 space-y-2" key={m.id}>
            <p>
              {m.user.name}
              {team.leadId === m.userId ? ' (Team Lead)' : ''} - {m.endedAt ? 'Ended ' + new Date(m.endedAt).toLocaleString() : 'Current Member'}
            </p>
            {admin && !m.endedAt && <RecordActionForm title={'End ' + m.user.name + ' Membership'} submit={async (reason) => {
              await workforceClient.removeMember(team.id, m.userId, {
                version: team.version, reason
              });
              await refresh();
            }}>
              <p className="text-sm">Clear or change team lead first if this member is the lead.</p>
            </RecordActionForm>}
          </li>)}
        </ul>
        {!members.length && <p>No memberships on this page.</p>}
        <div className="flex gap-3 items-center mt-3">
          <Button variant="outline" disabled={memberPage <= 1} onClick={() => setMemberPage(v => v - 1)}>Previous Members</Button>
          <span>Page {memberPage} of {Math.max(1, Math.ceil(memberTotal / 20))}
          </span>
          <Button variant="outline" disabled={memberPage * 20 >= memberTotal} onClick={() => setMemberPage(v => v + 1)}>Next Members</Button>
        </div>
      </Card>
      {admin && <TeamEditForm team={team} members={members} onSaved={refresh} />}
    </div>}
  </div>;
}
function TeamCreateForm({ onSaved }: {
  onSaved: () => Promise<void>;
}) {
  const [code, setCode] = useState(''), [name, setName] = useState('');
  return <RecordActionForm title="Create Workforce Team" submit={async (reason) => {
    await workforceClient.createTeam({
      code, name, reason
    });
    setCode('');
    setName('');
    await onSaved();
  }}>
    <Input label="Team Code" required value={code} onChange={e => setCode(e.target.value)} />
    <Input label="Team Name" required value={name} onChange={e => setName(e.target.value)} />
  </RecordActionForm>;
}
function TeamEditForm({ team, members, onSaved }: {
  team: WorkforceTeam;
  members: TeamMember[];
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(team.name), [lead, setLead] = useState(team.leadId ?? ''), [active, setActive] = useState(team.isActive), [member, setMember] = useState<WorkforceUser | null>(null);
  const choices = [
    {
      value: '', label: 'No Team Lead'
    }, ...members.filter(m => !m.endedAt).map(m => ({
      value: m.userId, label: m.user.name
    }))
  ];
  if (team.leadId && !choices.some(c => c.value === team.leadId))
    choices.push({
      value: team.leadId, label: 'Current Team Lead (Another Membership Page)'
    });
  return <>
    <RecordActionForm title="Update Workforce Team" submit={async (reason) => {
      await workforceClient.updateTeam(team.id, {
        version: team.version, reason, name, leadId: lead || null, isActive: active
      });
      await onSaved();
    }}>
      <Input label="Updated Team Name" required value={name} onChange={e => setName(e.target.value)} />
      <Select label="Team Lead from This Membership Page" value={lead} options={choices} onChange={e => setLead(e.target.value)} />
      <label className="block">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active Team</label>
      <p className="text-sm">Clear the lead and end all current memberships before deactivating the team.</p>
    </RecordActionForm>
    {team.isActive && <RecordActionForm title="Add Team Member" submit={async (reason) => {
      if (!member)
        throw new Error('Choose an existing technician.');
      await workforceClient.addMember(team.id, {
        version: team.version, reason, userId: member.id
      });
      await onSaved();
    }}>
      <PagedRecordSelect label="Existing Technician" selected={member} onChange={setMember} load={technicians} describe={u => u.name + (u.technicianProfile ? '' : ' (Profile Required)')} required />
      <p className="text-sm">Membership requires an active workforce profile and no other active team membership.</p>
    </RecordActionForm>}
  </>;
}
