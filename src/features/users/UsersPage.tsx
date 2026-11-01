import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { ApiError, getPage, postData } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { RecordPagination } from '../../components/common/RecordPagination';

const roles = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'SALES', label: 'Sales' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'WAREHOUSE', label: 'Warehouse / Inventory' },
  { value: 'SUPPORT', label: 'Support / Service' },
  { value: 'FINANCE', label: 'Finance' },
];
type Account = { id: string; name: string; email: string; role: string; isActive: boolean };
export function UsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Account[]>([]), [total, setTotal] = useState(0);
  const [q, setQ] = useState(''), [role, setRole] = useState(''), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [newRole, setNewRole] = useState('');
  const [busy, setBusy] = useState(false), [saveError, setSaveError] = useState(''), [saved, setSaved] = useState(''), [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let live = true;
    setLoading(true); setError('');
    getPage<Account>('/users', { q: q || undefined, role: role || undefined, page, pageSize: 20 })
      .then(r => { if (live) { setRows(r.data); setTotal(r.total); } })
      .catch(e => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [user?.role, q, role, page, refresh]);
  if (user?.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  async function create(e: FormEvent) {
    e.preventDefault();
    if (lock.current || uncertain) return;
    lock.current = true; setBusy(true); setSaveError(''); setSaved('');
    try {
      const account = await postData<Account>('/users', { name, email, password, role: newRole });
      setPassword(''); setName(''); setEmail(''); setNewRole('');
      setSaved('Created ' + account.email + '. The account can now sign in.');
      setPage(1); setRefresh(v => v + 1);
    } catch (e) {
      const unknown = e instanceof ApiError && (e.status === 0 || e.status >= 500);
      setUncertain(unknown);
      setSaveError(unknown ? 'The result is unknown. Refresh and search for the email before trying again.' : e instanceof Error ? e.message : 'Account creation failed.');
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="max-w-7xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
    <Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Find Account" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        <Select label="Role" value={role} options={[{ value: '', label: 'All Roles' }, ...roles]} onChange={e => { setRole(e.target.value); setPage(1); }} />
      </div>
      {error ? <div role="alert" className="mt-4 text-red-700">{error}<Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Retry</Button></div> : loading ? <p className="py-5">Loading accounts...</p> : <>
        <div className="overflow-x-auto mt-5"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t"><td className="p-3">{r.name}</td><td>{r.email}</td><td>{roles.find(x => x.value === r.role)?.label ?? r.role}</td><td>{r.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>
        {!rows.length && <p className="py-4">No accounts match these filters.</p>}
        <RecordPagination page={page} pageSize={20} total={total} onChange={setPage} />
      </>}
    </Card>
    <Card><form onSubmit={create} className="space-y-4">
      <h2 className="text-lg font-semibold">Create Account</h2>
      <p className="text-sm text-slate-500">The role controls module access. Project assignments and customer access grants are managed separately in their respective modules. Existing roles and passwords cannot be changed from this page.</p>
      <fieldset disabled={busy || uncertain} className="grid md:grid-cols-2 gap-4">
        <Input label="Name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} />
        <Input label="Email" type="email" required maxLength={254} autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} />
        <Select label="Account Role" required value={newRole} options={[{ value: '', label: 'Select Role' }, ...roles]} onChange={e => setNewRole(e.target.value)} />
        <Input label="Initial Password" type="password" required minLength={12} maxLength={256} autoComplete="new-password" hint="12–256 characters. Share privately with the account holder." value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" isLoading={busy}>Create Account</Button>
      </fieldset>
      {saveError && <p role="alert" className="text-red-700">{saveError}</p>}
      {saved && <p role="status" className="text-green-700">{saved}</p>}
    </form></Card>
  </div>;
}
