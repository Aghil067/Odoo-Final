import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { serviceClient, serviceStates, serviceCategories, servicePriorities, type ServiceTicket } from '../services/serviceClient';
export function ServiceTicketsPage({ history = false }: {
  history?: boolean;
}) {
  const { user } = useAuth(), sales = user?.role === 'sales_executive', coordinator = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [q, setQ] = useState(''), [status, setStatus] = useState(history ? 'CLOSED' : ''), [priority, setPriority] = useState(''), [category, setCategory] = useState(''), [sort, setSort] = useState('newest'), [page, setPage] = useState(1), [rows, setRows] = useState<ServiceTicket[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    serviceClient.tickets({
      q: q || undefined, status: status || undefined, priority: priority || undefined, category: category || undefined, sort, page, pageSize: 20
    }).then(r => {
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
    q, status, priority, category, sort, page, retry
  ]);
  const columns: Column<ServiceTicket>[] = [
    {
      key: 'reference', header: 'Service Ticket', render: r => sales ? r.reference : <Link className="font-semibold text-green-700" to={'/service/tickets/' + r.id}>
        {r.reference}
      </Link>
    }, {
      key: 'status', header: 'State'
    }, {
      key: 'category', header: 'Category'
    }, {
      key: 'priority', header: 'Priority'
    }, {
      key: 'openedAt', header: 'Reported', render: r => new Date(r.openedAt).toLocaleString()
    }, ...(!sales ? [
      {
        key: 'sla', header: 'SLA', render: (r: ServiceTicket) => r.sla?.configured ? (r.sla.resolutionBreached ? 'Resolution Target Breached' : r.sla.firstResponseBreached ? 'First Response Target Breached' : 'Within Recorded Targets') : 'Not Configured'
      }
    ] : [])
  ];
  return <div className="space-y-5 max-w-7xl mx-auto">
    <div className="flex flex-wrap justify-between gap-3">
      <h1 className="text-2xl font-bold">
        {history ? 'Service History' : 'Service Tickets'}
      </h1>
      <div className="flex gap-2">
        <Link to="/service/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
        {coordinator && <Link to="/service/tickets/new">
          <Button>Report Service Ticket</Button>
        </Link>}
      </div>
    </div>
    <Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input label="Find Service Reference" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
        <Select label="Service State" value={status} options={[
          {
            value: '', label: 'All States'
          }, ...serviceStates.map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => {
          setStatus(e.target.value);
          setPage(1);
        }} />
        <Select label="Service Priority" value={priority} options={[
          {
            value: '', label: 'All Priorities'
          }, ...servicePriorities.map(v => ({
            value: v, label: v
          }))
        ]} onChange={e => {
          setPriority(e.target.value);
          setPage(1);
        }} />
        <Select label="Service Category" value={category} options={[
          {
            value: '', label: 'All Categories'
          }, ...serviceCategories.map(v => ({
            value: v, label: v.replaceAll('_', ' ')
          }))
        ]} onChange={e => {
          setCategory(e.target.value);
          setPage(1);
        }} />
        <Select label="Service Ordering" value={sort} options={[
          {
            value: 'newest', label: 'Newest First'
          }, {
            value: 'responseDue', label: 'First Response Due'
          }, {
            value: 'resolutionDue', label: 'Resolution Due'
          }
        ]} onChange={e => {
          setSort(e.target.value);
          setPage(1);
        }} />
      </div>
      <p className="text-sm text-slate-500 mt-3">SLA targets use elapsed UTC time. Holds do not pause the clock.{sales ? ' Your role receives scoped project summaries only.' : ''}
      </p>
    </Card>
    {error ? <Card>
      <p role="alert">
        {error}
      </p>
      <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>
    </Card> : <DataTable columns={columns} data={rows} isLoading={loading} keyExtractor={r => r.id} page={page} pageSize={20} total={total} onPageChange={setPage} emptyMessage="No authorized service tickets match." />}
  </div>;
}
