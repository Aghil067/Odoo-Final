import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { workforceClient, type WorkforceAvailability } from '../services/workforceClient';
export function TechnicianAvailabilityPage() {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [purpose, setPurpose] = useState('SURVEY'), [query, setQuery] = useState<{
    from: string;
    to: string;
    purpose: string;
  } | null>(null), [page, setPage] = useState(1), [rows, setRows] = useState<WorkforceAvailability[]>([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!query)
      return;
    let live = true;
    setLoading(true);
    setError('');
    workforceClient.availability({
      ...query, page, pageSize: 20
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
    query, page, retry
  ]);
  function submit(e: FormEvent) {
    e.preventDefault();
    const a = new Date(from), b = new Date(to);
    if (b <= a || b.getTime() - a.getTime() > 7 * 86400000) {
      setError('Choose a positive interval of at most seven days.');
      return;
    }
    setPage(1);
    setQuery({
      from: a.toISOString(), to: b.toISOString(), purpose
    });
  }
  return <div className="space-y-5">
    <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Technician Availability</h1>
      <Link to="/technicians">
        <Button variant="outline">Technicians</Button>
      </Link>
    </div>
    <Card>
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-4 items-end">
        <Input label="Availability From (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
        <Input label="Availability Through (Local Time)" type="datetime-local" required min={from} value={to} onChange={e => setTo(e.target.value)} />
        <Select label="Work Purpose" value={purpose} options={[
          'SURVEY', 'SERVICE', 'PV_INSTALLATION', 'INVERTER', 'BATTERY', 'COMMISSIONING'
        ].map(v => ({
          value: v, label: v.replaceAll('_', ' ')
        }))} onChange={e => setPurpose(e.target.value)} />
        <Button type="submit" isLoading={loading}>Check Real Availability</Button>
      </form>
      <p className="text-sm text-slate-500 mt-3">Missing profile, calendar coverage or verified qualifications remains unknown or needs review. Availability does not invent attendance or reserve work.</p>
    </Card>
    {error ? <Card>
      <p role="alert" className="text-red-700">
        {error}
      </p>
      {query && <Button onClick={() => setRetry(v => v + 1)}>Retry</Button>}
    </Card> : loading ? <p>Checking calendars, leave, qualifications and actual assignments...</p> : query ? <>
      <div className="grid lg:grid-cols-2 gap-4">
        {rows.map(r => <Card key={r.userId}>
          <Link className="font-semibold text-green-700" to={'/technicians/' + r.userId}>
            {r.name}
          </Link>
          <p className="font-medium mt-2">
            {r.status.replaceAll('_', ' ')}
          </p>
          <p className="text-sm">
            {r.managed ? 'Managed Scheduling' : 'Legacy Assignment Policy'}; exact-window committable: {r.committable ? 'Yes' : 'No'}.</p>
          <ul className="text-sm text-amber-800 mt-2">
            {r.reasons.map(reason => <li key={reason}>
              {reason.replaceAll('_', ' ')}
            </li>)}
          </ul>
          <p className="text-sm mt-2">Known shift minutes: {r.shiftMinutes ?? 'Unknown'}; available shift minutes: {r.availableShiftMinutes ?? 'Unknown'}.</p>
          <ul className="text-sm">
            {r.freeIntervals.map((f, i) => <li key={i}>Free shift interval: {new Date(f.from).toLocaleString()} to {new Date(f.to).toLocaleString()}
            </li>)}
          </ul>
          {r.conflicts?.map(c => <p className="text-sm text-red-700" key={c.kind + c.id}>
            {c.kind}: {c.reference} ({new Date(c.from).toLocaleString()} to {new Date(c.to).toLocaleString()})</p>)}
        </Card>)}
      </div>
      {!rows.length && <Card>No authorized technician accounts.</Card>}
      <div className="flex gap-3 items-center">
        <Button disabled={page <= 1} variant="outline" onClick={() => setPage(v => v - 1)}>Previous</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}
        </span>
        <Button disabled={page * 20 >= total} variant="outline" onClick={() => setPage(v => v + 1)}>Next</Button>
      </div>
    </> : <Card>Select the actual work window to inspect availability.</Card>}
  </div>;
}
