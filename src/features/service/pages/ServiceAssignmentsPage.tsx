import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { serviceClient, type ServiceVisit } from '../services/serviceClient';
export function ServiceAssignmentsPage() {
  const [page, setPage] = useState(1), [rows, setRows] = useState<ServiceVisit[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    serviceClient.workload({
      page, pageSize: 20
    }).then(r => {
      if (live) {
        setRows(r.data);
        setTotal(r.pagination.totalItems);
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
    page, retry
  ]);
  const columns: Column<ServiceVisit>[] = [
    {
      key: 'ticketId', header: 'Source Ticket', render: r => <Link className="text-green-700" to={'/service/tickets/' + r.ticketId + '?tab=visits'}>Open Service Ticket</Link>
    }, {
      key: 'userId', header: 'Technician Identity'
    }, {
      key: 'status', header: 'Visit State'
    }, {
      key: 'scheduledStartAt', header: 'Booked Start', render: r => new Date(r.scheduledStartAt).toLocaleString()
    }, {
      key: 'scheduledEndAt', header: 'Booked End', render: r => new Date(r.scheduledEndAt).toLocaleString()
    }, {
      key: 'arrivedAt', header: 'Observed Arrival', render: r => r.arrivedAt ? new Date(r.arrivedAt).toLocaleString() : 'Not Checked In'
    }
  ];
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Active Service Visits</h1>
    <p className="text-sm text-slate-500">Scheduled and running visits from real service assignments. These records are not attendance or measured labor utilization.</p>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized active visits." />}
  </div>;
}
