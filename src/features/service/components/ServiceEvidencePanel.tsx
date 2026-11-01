import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { serviceClient, serviceEvidenceTypes, type ServiceVisit } from '../services/serviceClient';
import type { ServiceContext } from './ServiceTicketWorkForms';
export function ServiceEvidencePanel({ ticket: t, files, visits, technician, onSaved }: ServiceContext & {
  visits: ServiceVisit[];
  technician: boolean;
}) {
  const [file, setFile] = useState<File | null>(null), [type, setType] = useState(t.status === 'RESOLVED' ? 'CUSTOMER_ACKNOWLEDGEMENT' : 'OTHER'), [visit, setVisit] = useState(''), [error, setError] = useState(''), editable = ![
    'CLOSED', 'CANCELLED'
  ].includes(t.status) && (!technician || t.status !== 'RESOLVED');
  return <div className="space-y-4">
    {editable && <RecordActionForm title="Upload Private Service Evidence" submit={async (reason) => {
      if (!file)
        throw new Error('Choose a private evidence file.');
      if (file.size > 5 * 1024 * 1024)
        throw new Error('Maximum file size is 5 MiB.');
      if (![
        'image/jpeg', 'image/png', 'application/pdf'
      ].includes(file.type))
        throw new Error('Choose JPEG, PNG or PDF evidence.');
      await serviceClient.upload(t.id, file, {
        version: t.version, reason, type, ...(visit ? {
          visitId: visit
        } : {}), fileName: file.name
      });
      await onSaved();
    }}>
      <Select label="Service Evidence Category" value={type} options={(t.status === 'RESOLVED' ? [
        'CUSTOMER_ACKNOWLEDGEMENT'
      ] : serviceEvidenceTypes).map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setType(e.target.value)} />
      <Select label="Evidence Visit Association" required={technician} value={visit} options={[
        {
          value: '', label: 'Ticket-level Evidence'
        }, ...visits.filter(v => v.executionRevision === t.executionRevision).map(v => ({
          value: v.id, label: (v.assignment?.user.name ?? v.userId) + ' | ' + v.status + ' | ' + new Date(v.scheduledStartAt).toLocaleString()
        }))
      ]} onChange={e => setVisit(e.target.value)} />
      <Input label="Private Service Evidence File" type="file" required accept="image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <p className="text-sm">Maximum 5 MiB; private authorized downloads only. Field work requires evidence linked to the exact visit and current execution cycle. File format checks are not malware protection.</p>
    </RecordActionForm>}
    <Card>
      <h2 className="font-semibold">Private Service Evidence Records</h2>
      {files.map(f => <div className="border-t mt-3 pt-3 space-y-2" key={f.id}>
        <p>
          {f.fileName}: {f.type.replaceAll('_', ' ')}; cycle {f.executionRevision}
        </p>
        <p className="text-xs text-slate-500 break-all">
          {f.sizeBytes} bytes; {new Date(f.createdAt).toLocaleString()}; SHA-256 {f.sha256}
        </p>
        <Button variant="outline" size="sm" onClick={async () => {
          setError('');
          try {
            await serviceClient.download(t.id, f);
          }
          catch (e) {
            setError(e instanceof Error ? e.message : 'Could not download evidence.');
          }
        }}>Download {f.fileName}
        </Button>
      </div>)}
      {!files.length && <p>No evidence uploaded.</p>}
      {error && <p role="alert">
        {error}
      </p>}
    </Card>
  </div>;
}
