import { useCallback, useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { customerService } from '../services/customerService';
import { siteService } from '../../surveys/services/siteService';
import { getPage } from '../../../services/apiClient';
import { useAuth } from '../../auth/hooks/useAuth';
import type { CustomerSummary } from '../types/customer.types';
import type { Site } from '../../surveys/types/site.types';
import type { Enquiry, EnquiryFormData, EnquiryPriority, SystemType, LeadSource } from '../types/enquiry.types';
import { SYSTEM_TYPE_LABELS, LEAD_SOURCE_LABELS, PRIORITY_LABELS } from '../types/enquiry.types';
interface Props {
  initialData?: Enquiry;
  onSubmit: (data: EnquiryFormData) => Promise<void>;
  isLoading?: boolean;
}
const customers = (q: RecordQuery) => customerService.list({
  search: q.q, page: q.page, pageSize: q.pageSize
}), salespeople = (q: RecordQuery) => getPage<{
  id: string;
  name: string;
}>('/crm/salespeople', {
  ...q
}), local = (s: string) => new Date(new Date(s).getTime() - new Date(s).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export function EnquiryForm({ initialData, onSubmit, isLoading }: Props) {
  const navigate = useNavigate(), [params] = useSearchParams(), { user } = useAuth(), [customer, setCustomer] = useState<CustomerSummary | null>(null), [site, setSite] = useState<Site | null>(null), [person, setPerson] = useState<{
    id: string;
    name: string;
  } | null>(null), [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EnquiryFormData>({
    version: initialData?.version, customerId: initialData?.customerId ?? '', siteId: initialData?.siteId ?? '', customerName: initialData?.customerName ?? '', customerPhone: initialData?.customerPhone ?? '', systemType: initialData?.systemType ?? 'undecided', capacityOption: 'custom', customCapacity: initialData?.customCapacity ?? '', propertyType: null, installationLocation: '', requirements: initialData?.requirements ?? '', leadSource: initialData?.leadSource ?? 'website', assignedTo: initialData?.assignedTo ?? (user?.role === 'sales_executive' ? user.id : ''), enquiryDate: initialData?.enquiryDate ?? new Date().toISOString(), priority: initialData?.priority ?? 'medium', monthlyElectricityBill: initialData?.monthlyElectricityBill ?? '', nextFollowUpDate: initialData?.nextFollowUpDate ? local(initialData.nextFollowUpDate) : ''
  });
  const initialCustomerId = initialData?.customerId ?? params.get('customerId'), initialSiteId = initialData?.siteId, loadSites = useCallback((q: RecordQuery) => siteService.list(customer?.id ?? '', q), [
    customer?.id
  ]);
  useEffect(() => {
    let live = true;
    if (initialCustomerId)
      customerService.getById(initialCustomerId).then(c => {
        if (live) {
          setCustomer(c);
          setForm(f => ({
            ...f, customerId: c.id
          }));
        }
      }).catch(e => {
        if (live)
          setError(e.message);
      });
    if (initialSiteId)
      siteService.getById(initialSiteId).then(s => {
        if (live)
          setSite(s);
      }).catch(e => {
        if (live)
          setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [
    initialCustomerId, initialSiteId
  ]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (!customer || !site)
        throw new Error('Select an existing customer and installation site.');
      const followUp = initialData?.nextFollowUpDate && form.nextFollowUpDate === local(initialData.nextFollowUpDate) ? initialData.nextFollowUpDate : form.nextFollowUpDate;
      await onSubmit({
        ...form, customerId: customer.id, siteId: site.id, customerName: customer.fullName, customerPhone: customer.phone, nextFollowUpDate: followUp, capacityOption: form.customCapacity ? 'custom' : 'unspecified'
      });
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Lead was not saved.');
    }
  }
  return <form onSubmit={submit} className="space-y-6">
    {error && <div role="alert" className="bg-red-50 text-red-800 p-3 rounded">
      {error}
    </div>}
    <fieldset disabled={isLoading} className="space-y-6">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Customer and Installation Site</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {initialData ? <div>
            <p className="text-sm text-slate-500">Original Customer (Immutable Lead Identity)</p>
            <p>
              {customer?.fullName ?? 'Loading Customer...'}
            </p>
          </div> : <PagedRecordSelect label="Customer" selected={customer} onChange={c => {
            setCustomer(c);
            setSite(null);
            setForm(f => ({
              ...f, customerId: c?.id, siteId: ''
            }));
          }} load={customers} describe={c => c.fullName + ' - ' + c.customerId} required />}
          {customer && <PagedRecordSelect label="Installation Site" selected={site} onChange={s => {
            setSite(s);
            setForm(f => ({
              ...f, siteId: s?.id
            }));
          }} load={loadSites} describe={s => s.siteName + ' - ' + s.city} required />}
        </div>
        <p className="text-sm text-slate-500 mt-3">Use an existing customer and actual installation site. Site changes are validated against linked project obligations.</p>
      </Card>
      <Card>
        <h3 className="font-semibold mb-4">Solar Requirements</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="System Type" value={form.systemType} options={Object.entries(SYSTEM_TYPE_LABELS).map(([value, label]) => ({
            value, label
          }))} onChange={e => setForm({
            ...form, systemType: e.target.value as SystemType
          })} />
          <Input label="Requested Capacity (kW)" inputMode="decimal" value={form.customCapacity ?? ''} onChange={e => setForm({
            ...form, customCapacity: e.target.value
          })} />
          <Input label="Monthly Electricity Bill" inputMode="decimal" value={form.monthlyElectricityBill ?? ''} onChange={e => setForm({
            ...form, monthlyElectricityBill: e.target.value
          })} />
          <Textarea label="Qualification / Requirements Notes" value={form.requirements} onChange={e => setForm({
            ...form, requirements: e.target.value
          })} />
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-4">Sales Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Source" value={form.leadSource} options={Object.entries(LEAD_SOURCE_LABELS).filter(([v]) => v !== 'social_media').map(([value, label]) => ({
            value, label
          }))} onChange={e => setForm({
            ...form, leadSource: e.target.value as LeadSource
          })} />
          <Select label="Priority" value={form.priority} options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
            value, label
          }))} onChange={e => setForm({
            ...form, priority: e.target.value as EnquiryPriority
          })} />
          {!initialData && user?.role === 'admin' ? <PagedRecordSelect label="Assigned Salesperson (Optional)" selected={person} onChange={p => {
            setPerson(p);
            setForm({
              ...form, assignedTo: p?.id ?? ''
            });
          }} load={salespeople} describe={p => p.name} /> : <div>
            <p className="text-sm text-slate-500">Sales Assignment</p>
            <p>
              {initialData?.assignedToName ?? user?.name ?? 'Unassigned'}
            </p>
            <p className="text-xs text-slate-500">Existing lead reassignment is a separate versioned action.</p>
          </div>}
          <Input label="Next Follow-up (Local Time)" type="datetime-local" value={form.nextFollowUpDate ?? ''} onChange={e => setForm({
            ...form, nextFollowUpDate: e.target.value
          })} />
        </div>
      </Card>
    </fieldset>
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
      <Button type="submit" isLoading={isLoading}>Save Enquiry</Button>
    </div>
  </form>;
}
