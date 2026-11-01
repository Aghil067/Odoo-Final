import { useState, useEffect, useRef, type FormEvent } from 'react';
import { ApiError } from '../../../services/apiClient';
import { siteService } from '../../surveys/services/siteService';
import type { Site } from '../../surveys/types/site.types';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
const empty = {
  siteName: '', addressLine1: '', addressLine2: '', city: '', state: '', pinCode: '', country: 'IN'
};
export function CustomerSites({ customerId, onChanged }: {
  customerId: string;
  onChanged?: () => Promise<void>;
}) {
  const { getModulePermission } = useAuth(), [sites, setSites] = useState<Site[]>([]), [page, setPage] = useState(1), [q, setQ] = useState(''), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [saving, setSaving] = useState(false), [open, setOpen] = useState(false), [editing, setEditing] = useState<Site | null>(null), [form, setForm] = useState(empty), [retry, setRetry] = useState(0), writable = getModulePermission('customers') === 'full';
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    siteService.list(customerId, {
      q: q || undefined, page, pageSize: 10
    }).then(r => {
      if (live) {
        setSites(r.data);
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
    customerId, page, q, retry
  ]);
  const inFlight = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current || uncertain) return;
    inFlight.current = true;
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form, propertyType: null, contactPersonOnSite: '', contactPhoneOnSite: ''
      };
      if (editing) {
        if (!editing.version)
          throw new Error('Refresh the actual site version before editing.');
        await siteService.update(editing.id, editing.version, data);
      }
      else
        await siteService.create({
          ...data, customerId
        });
      setOpen(false);
      setEditing(null);
      setPage(1);
      setRetry(v => v + 1);
      await onChanged?.();
    }
    catch (e) {
      const unknownOutcome = e instanceof ApiError && (e.status === 0 || e.status >= 500);
      setUncertain(unknownOutcome);
      setError(unknownOutcome ? 'The save outcome is unknown. Refresh the customer site list before retrying to avoid duplicates.' : e instanceof Error ? e.message : 'Site was not saved.');
    }
    finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  return <Card>
    <div className="flex justify-between">
      <h3 className="font-semibold text-slate-800">Installation Sites</h3>
      {writable && <Button variant="outline" size="sm" onClick={() => {
        setEditing(null);
        setForm(empty);
        setOpen(v => !v);
      }}>Add Site</Button>}
    </div>
    <Input label="Find Customer Site" value={q} onChange={e => {
      setQ(e.target.value);
      setPage(1);
    }} />
    {error ? <div>
      <p role="alert" className="text-red-700 mt-2">
        {error}
      </p>
      <Button variant="outline" onClick={() => setRetry(v => v + 1)}>Retry Sites</Button>
    </div> : loading ? <p className="mt-3">Loading actual customer sites...</p> : <>
      <div className="divide-y">
        {sites.map(site => <div key={site.id} className="py-3 flex flex-wrap justify-between gap-3">
          <div>
            <p className="font-medium">
              {site.siteName}
            </p>
            <p className="text-sm text-slate-500">
              {site.addressLine1}
              {site.addressLine2 ? ', ' + site.addressLine2 : ''}, {site.city}, {site.state} {site.pinCode}, {site.country}
            </p>
          </div>
          {writable && <Button variant="ghost" size="sm" onClick={() => {
            setEditing(site);
            setForm({
              siteName: site.siteName, addressLine1: site.addressLine1, addressLine2: site.addressLine2 ?? '', city: site.city, state: site.state, pinCode: site.pinCode, country: site.country
            });
            setOpen(true);
          }}>Edit Site {site.siteName}
          </Button>}
        </div>)}
      </div>
      {!sites.length && <p className="text-sm text-slate-500 mt-3">No sites match this customer and filter.</p>}
      <div className="flex gap-3 items-center mt-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous Sites</Button>
        <span className="text-sm">Page {page} of {Math.max(1, Math.ceil(total / 10))}
        </span>
        <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(v => v + 1)}>Next Sites</Button>
      </div>
    </>}
    {open && <form onSubmit={submit} className="space-y-3 mt-4">
      <h4 className="font-semibold">
        {editing ? 'Edit Recorded Site' : 'Add Actual Installation Site'}
      </h4>
      <fieldset disabled={saving || uncertain} className="grid md:grid-cols-2 gap-3">
        {Object.entries({
          siteName: 'Site Name', addressLine1: 'Site Address', addressLine2: 'Additional Address (Optional)', city: 'City', state: 'State', pinCode: 'Postal Code', country: 'Country Code (ISO 2 letters)'
        }).map(([field, label]) => <Input key={field} label={label} required={field !== 'addressLine2'} value={form[field as keyof typeof form]} onChange={e => setForm({
          ...form, [field]: e.target.value
        })} />)}
      </fieldset>
      <Button type="submit" isLoading={saving}>Save Site</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel Site Changes</Button>
    </form>}
  </Card>;
}
