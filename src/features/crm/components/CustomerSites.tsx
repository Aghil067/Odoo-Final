import { useState, useEffect, useRef, type FormEvent } from 'react';
import { ApiError } from '../../../services/apiClient';
import { siteService } from '../../surveys/services/siteService';
import type { Site } from '../../surveys/types/site.types';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';

const empty = {
  siteName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pinCode: '',
  country: 'IN',
  latitude: '',
  longitude: '',
};

export function CustomerSites({ customerId, onChanged }: {
  customerId: string;
  onChanged?: () => Promise<void>;
}) {
  const { getModulePermission } = useAuth(),
    [sites, setSites] = useState<Site[]>([]),
    [page, setPage] = useState(1),
    [q, setQ] = useState(''),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Site | null>(null),
    [form, setForm] = useState(empty),
    [retry, setRetry] = useState(0),
    writable = getModulePermission('customers') === 'full';

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
      const latTrim = form.latitude.trim();
      const lngTrim = form.longitude.trim();
      const latNum = latTrim === '' ? null : Number(parseFloat(latTrim).toFixed(6));
      const lngNum = lngTrim === '' ? null : Number(parseFloat(lngTrim).toFixed(6));

      if ((latNum === null && lngNum !== null) || (latNum !== null && lngNum === null)) {
        throw new Error('Supply both latitude and longitude together, or leave both empty.');
      }
      if (latNum !== null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
        throw new Error('Latitude must be a valid number between -90 and 90.');
      }
      if (lngNum !== null && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
        throw new Error('Longitude must be a valid number between -180 and 180.');
      }

      const data = {
        siteName: form.siteName,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        country: form.country,
        latitude: latNum,
        longitude: lngNum,
        propertyType: null,
        contactPersonOnSite: '',
        contactPhoneOnSite: '',
      };

      if (editing) {
        if (!editing.version)
          throw new Error('Refresh the actual site version before editing.');
        await siteService.update(editing.id, editing.version, data);
      } else {
        await siteService.create({
          ...data,
          customerId,
        });
      }
      setOpen(false);
      setEditing(null);
      setPage(1);
      setRetry(v => v + 1);
      await onChanged?.();
    } catch (e) {
      const unknownOutcome = e instanceof ApiError && (e.status === 0 || e.status >= 500);
      setUncertain(unknownOutcome);
      setError(unknownOutcome ? 'The save outcome is unknown. Refresh the customer site list before retrying to avoid duplicates.' : e instanceof Error ? e.message : 'Site was not saved.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Installation Sites</h3>
          <p className="text-xs text-slate-500">Manage customer survey and solar installation locations</p>
        </div>
        {writable && (
          <Button variant="outline" size="sm" onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(v => !v);
          }}>
            Add Site
          </Button>
        )}
      </div>

      <Input
        label="Find Customer Site"
        value={q}
        onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }}
      />

      {error ? (
        <div className="my-3">
          <p role="alert" className="text-red-700 text-sm font-medium mb-2">
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={() => setRetry(v => v + 1)}>Retry Sites</Button>
        </div>
      ) : loading ? (
        <p className="mt-3 text-sm text-slate-500">Loading actual customer sites...</p>
      ) : (
        <>
          <div className="divide-y divide-slate-100 mt-2">
            {sites.map(site => {
              const hasCoords = site.latitude !== null && site.latitude !== undefined &&
                               site.longitude !== null && site.longitude !== undefined;
              return (
                <div key={site.id} className="py-3 flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{site.siteName}</p>
                      {hasCoords ? (
                        <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                          📍 {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          ⚠️ Location Not Set
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {site.addressLine1}
                      {site.addressLine2 ? ', ' + site.addressLine2 : ''}, {site.city}, {site.state} {site.pinCode}, {site.country}
                    </p>
                  </div>
                  {writable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(site);
                        setForm({
                          siteName: site.siteName,
                          addressLine1: site.addressLine1,
                          addressLine2: site.addressLine2 ?? '',
                          city: site.city,
                          state: site.state,
                          pinCode: site.pinCode,
                          country: site.country,
                          latitude: site.latitude !== null && site.latitude !== undefined ? String(site.latitude) : '',
                          longitude: site.longitude !== null && site.longitude !== undefined ? String(site.longitude) : '',
                        });
                        setOpen(true);
                      }}
                    >
                      Edit Site
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {!sites.length && <p className="text-sm text-slate-500 mt-3">No sites match this customer and filter.</p>}

          <div className="flex gap-3 items-center mt-4 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>
              Previous Sites
            </Button>
            <span className="text-xs text-slate-600">
              Page {page} of {Math.max(1, Math.ceil(total / 10))}
            </span>
            <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(v => v + 1)}>
              Next Sites
            </Button>
          </div>
        </>
      )}

      {open && (
        <form onSubmit={submit} className="space-y-3 mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-800">
              {editing ? 'Edit Installation Site' : 'Add Actual Installation Site'}
            </h4>
            <span className="text-xs text-slate-500">Coordinates optional; both required if set</span>
          </div>
          <fieldset disabled={saving || uncertain} className="grid md:grid-cols-2 gap-3">
            <Input
              label="Site Name"
              required
              value={form.siteName}
              onChange={e => setForm({ ...form, siteName: e.target.value })}
            />
            <Input
              label="Site Address"
              required
              value={form.addressLine1}
              onChange={e => setForm({ ...form, addressLine1: e.target.value })}
            />
            <Input
              label="Additional Address (Optional)"
              value={form.addressLine2}
              onChange={e => setForm({ ...form, addressLine2: e.target.value })}
            />
            <Input
              label="City"
              required
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              required
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
            />
            <Input
              label="Postal Code"
              required
              value={form.pinCode}
              onChange={e => setForm({ ...form, pinCode: e.target.value })}
            />
            <Input
              label="Country Code (ISO 2 letters)"
              required
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value.toUpperCase() })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Latitude (-90 to 90)"
                placeholder="e.g. 17.4947"
                value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })}
              />
              <Input
                label="Longitude (-180 to 180)"
                placeholder="e.g. 78.3578"
                value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
          </fieldset>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editing ? 'Save Changes' : 'Create Site'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
