import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { workforceClient, type WorkforceAssignment, type WorkforceWorkload } from '../services/workforceClient';
export function AssignmentsPage() {
  const [kind, setKind] = useState<'SURVEY' | 'INSTALLATION'>('SURVEY'), [page, setPage] = useState(1), [rows, setRows] = useState<WorkforceAssignment[]>([]), [total, setTotal] = useState(0), [work, setWork] = useState<WorkforceWorkload[]>([]), [workPage, setWorkPage] = useState(1), [workTotal, setWorkTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    Promise.all([
      workforceClient.assignments(kind, {
        page, pageSize: 20
      }), workforceClient.workload({
        page: workPage, pageSize: 20
      })
    ]).then(([a, w]) => {
      if (live) {
        setRows(a.data);
        setTotal(a.total);
        setWork(w.data);
        setWorkTotal(w.total);
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
    kind, page, workPage, retry
  ]);
  const columns: Column<WorkforceAssignment>[] = [
    {
      key: 'reference', header: 'Source Work', render: r => <Link className="text-green-700" to={kind === 'SURVEY' ? '/surveys/' + r.id : '/installations/' + r.job!.id}>
        {r.reference ?? r.job?.reference}
      </Link>
    }, {
      key: 'status', header: 'Status', render: r => r.status ?? r.job?.status
    }, {
      key: 'user', header: 'Technician Identity', render: r => r.assignedToId ?? r.userId
    }, {
      key: 'start', header: 'Planned Start', render: r => {
        const v = r.scheduledAt ?? r.job?.plannedStartAt;
        return v ? new Date(v).toLocaleString() : 'Not Scheduled';
      }
    }, {
      key: 'end', header: 'Planned End', render: r => {
        const v = r.scheduledEndAt ?? r.job?.plannedEndAt;
        return v ? new Date(v).toLocaleString() : 'Not Scheduled';
      }
    }
  ];
  const workload: Column<WorkforceWorkload>[] = [
    {
      key: 'name', header: 'Technician'
    }, {
      key: 'activeSurveyAssignments', header: 'Active Survey Assignments'
    }, {
      key: 'activeInstallationAssignments', header: 'Active Installation Assignments'
    }, {
      key: 'plannedSurveyMinutes', header: 'Planned Survey Minutes', render: r => r.plannedSurveyMinutes ?? 'Unknown'
    }, {
      key: 'actualWorkedHours', header: 'Worked Hours', render: () => 'Not Captured'
    }, {
      key: 'utilizationPercent', header: 'Utilization', render: () => 'Not Reliably Measured'
    }
  ];
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Workforce Assignments</h1>
      <Link to="/technicians">
        <Button variant="outline">Technicians</Button>
      </Link>
    </div>
    <Card>
      <Select label="Assignment Source" value={kind} options={[
        {
          value: 'SURVEY', label: 'M02 Site Surveys'
        }, {
          value: 'INSTALLATION', label: 'M05 Installations'
        }
      ]} onChange={e => {
        setKind(e.target.value as typeof kind);
        setPage(1);
      }} />
      <p className="text-sm text-slate-500 mt-2">Assignments remain owned by their source workflow. Installation planning spans are not worked hours. Service assignments remain in service management.</p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <>
      <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized assignments." />
      <h2 className="text-lg font-semibold">Planned Workload</h2>
      <DataTable columns={workload} data={work} isLoading={loading} keyExtractor={r => r.id} page={workPage} pageSize={20} total={workTotal} onPageChange={setWorkPage} emptyMessage="No authorized workload records." />
    </>}
  </div>;
}
