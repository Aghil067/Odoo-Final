import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { IdempotentActionForm } from '../../../components/common/IdempotentActionForm';
import { serviceClient, serviceCategories, servicePriorities, type ServiceInstallation, type ServiceEquipment, type ServiceSlaPolicy } from '../services/serviceClient';
import { warrantyClient, type WarrantyClaim } from '../../warranty/services/warrantyClient';
import { ServiceAccessManager } from '../components/ServiceAccessManager';
const installations = (q: RecordQuery) => serviceClient.installations(q), policies = (q: RecordQuery) => serviceClient.policies(q);
export function ServiceTicketCreatePage() {
  const { user } = useAuth(), navigate = useNavigate(), coordinator = [
    'admin', 'service_manager'
  ].includes(user?.role ?? ''), [installation, setInstallation] = useState<ServiceInstallation | null>(null), [equipment, setEquipment] = useState<ServiceEquipment | null>(null), [equipmentRows, setEquipmentRows] = useState<ServiceEquipment[]>([]), [equipmentPage, setEquipmentPage] = useState(1), [equipmentTotal, setEquipmentTotal] = useState(0), [serial, setSerial] = useState(''), [issue, setIssue] = useState(''), [description, setDescription] = useState(''), [category, setCategory] = useState('OTHER'), [priority, setPriority] = useState('MEDIUM'), [channel, setChannel] = useState(''), [sla, setSla] = useState<ServiceSlaPolicy | null>(null), [linkClaim, setLinkClaim] = useState(false), [claim, setClaim] = useState<WarrantyClaim | null>(null), [error, setError] = useState(''), created = useRef('');
  const claims = useCallback((q: RecordQuery) => warrantyClient.claims({
    ...q, installationId: installation?.id
  }), [
    installation?.id
  ]);
  useEffect(() => {
    setEquipmentRows([]);
    setEquipmentTotal(0);
    setError('');
    if (!installation || !coordinator)
      return;
    let live = true;
    serviceClient.equipment(installation.id, {
      page: equipmentPage, pageSize: 20
    }).then(r => {
      if (live) {
        setEquipmentRows(r.data);
        setEquipmentTotal(r.total);
      }
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    installation, equipmentPage, coordinator
  ]);
  if (!coordinator)
    return <Navigate to="/service/tickets" replace />;
  const equipmentOptions = [
    {
      value: '', label: 'Whole Installation / No Specific Equipment'
    }, ...equipmentRows.map(e => ({
      value: e.id, label: e.component.sku + ' - ' + e.component.name
    }))
  ];
  if (equipment && !equipmentRows.some(e => e.id === equipment.id))
    equipmentOptions.push({
      value: equipment.id, label: equipment.component.sku + ' - ' + equipment.component.name + ' (Selected)'
    });
  return <div className="space-y-5 max-w-5xl mx-auto">
    <Link className="text-green-700" to="/service/tickets">Back to Service Tickets</Link>
    <h1 className="text-2xl font-bold">Report Service Ticket</h1>
    <IdempotentActionForm title="Create Service Ticket" build={reason => {
      if (!installation)
        throw new Error('Select an authorized commissioned installation.');
      if (linkClaim && !claim)
        throw new Error('Choose an authorized warranty claim or turn off claim linking.');
      return {
        installationId: installation.id, equipmentId: equipment?.id ?? null, serialUnitId: serial || null, warrantyClaimId: linkClaim ? claim!.id : null, reportedIssue: issue, description, category, priority, channel, slaPolicyId: sla?.id ?? null, reason
      };
    }} send={async (body) => {
      const r = await serviceClient.create(body);
      created.current = r.id;
    }} onSaved={async () => {
      navigate('/service/tickets/' + created.current);
    }}>
      <PagedRecordSelect label="Service Installation" selected={installation} onChange={r => {
        setInstallation(r);
        setEquipment(null);
        setSerial('');
        setClaim(null);
        setEquipmentPage(1);
      }} load={installations} describe={r => r.name + ' - ' + r.reference} required />
      {installation && <>
        <Select label="Affected Installed Equipment" value={equipment?.id ?? ''} options={equipmentOptions} onChange={e => {
          setEquipment(equipmentRows.find(r => r.id === e.target.value) ?? null);
          setSerial('');
        }} />
        <div className="flex gap-3 items-center">
          <Button type="button" variant="outline" disabled={equipmentPage <= 1} onClick={() => setEquipmentPage(v => v - 1)}>Previous Equipment</Button>
          <span>Page {equipmentPage} of {Math.max(1, Math.ceil(equipmentTotal / 20))}
          </span>
          <Button type="button" variant="outline" disabled={equipmentPage * 20 >= equipmentTotal} onClick={() => setEquipmentPage(v => v + 1)}>Next Equipment</Button>
        </div>
        {equipment?.serializationRequired && <Select label="Exact Installed Serial Unit" required value={serial} options={[
          {
            value: '', label: 'Choose Installed Serial'
          }, ...equipment.serials.map(s => ({
            value: s.serialUnitId, label: s.serialUnit.serialNumber
          }))
        ]} onChange={e => setSerial(e.target.value)} />}
      </>}
      <Input label="Reported Service Issue" required maxLength={300} value={issue} onChange={e => setIssue(e.target.value)} />
      <Textarea label="Reported Issue Description" required value={description} onChange={e => setDescription(e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Initial Service Category" value={category} options={serviceCategories.map(v => ({
          value: v, label: v.replaceAll('_', ' ')
        }))} onChange={e => setCategory(e.target.value)} />
        <Select label="Initial Service Priority" value={priority} options={servicePriorities.map(v => ({
          value: v, label: v
        }))} onChange={e => setPriority(e.target.value)} />
      </div>
      <Input label="Actual Reporting Channel" required value={channel} onChange={e => setChannel(e.target.value)} />
      <PagedRecordSelect label="Applicable SLA Policy (Optional)" selected={sla} onChange={setSla} load={policies} describe={s => s.reference + ' v' + s.revision + ' | ' + s.category + ' | ' + s.priority} />
      <p className="text-sm text-slate-500">Choose an effective SLA for the same category and priority. If none is configured, deadlines remain unavailable; no universal SLA is invented.</p>
      {installation && <>
        <label className="block">
          <input type="checkbox" checked={linkClaim} onChange={e => setLinkClaim(e.target.checked)} /> Link an Existing Authorized Warranty Claim</label>
        {linkClaim && <PagedRecordSelect label="Related Warranty Claim" selected={claim} onChange={setClaim} load={claims} describe={c => c.reference + ' - ' + c.status} required />}
      </>}
      {error && <p role="alert">
        {error}
      </p>}
    </IdempotentActionForm>
    {user?.role === 'admin' && installation && <ServiceAccessManager key={installation.id} installation={installation} />}
    <Card>
      <p className="text-sm text-slate-500">Service starts from a commissioned installation. Warranty context is advisory and requires separate warranty access. No billing, stock movement or replacement identity is created by this report.</p>
    </Card>
  </div>;
}
