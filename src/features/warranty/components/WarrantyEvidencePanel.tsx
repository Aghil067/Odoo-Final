import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { warrantyClient, warrantyDocuments, type WarrantyEvidence } from '../services/warrantyClient';
export function WarrantyEvidenceChoice({ files, value, onChange }: {
  files: WarrantyEvidence[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return <fieldset className="border rounded-lg p-3">
    <legend className="text-sm font-medium">Exact Case Evidence</legend>
    {files.map(f => <label className="block text-sm py-1" key={f.id}>
      <input type="checkbox" checked={value.includes(f.id)} onChange={e => onChange(e.target.checked ? [
        ...value, f.id
      ] : value.filter(v => v !== f.id))} /> {f.fileName} ({f.documentType.replaceAll('_', ' ')})</label>)}
    {!files.length && <p className="text-sm text-amber-800">Upload evidence to this exact case first.</p>}
  </fieldset>;
}
export function WarrantyEvidencePanel({ id, parent, version, files, editable, onSaved }: {
  id: string;
  parent: 'registrations' | 'claims';
  version: number;
  files: WarrantyEvidence[];
  editable: boolean;
  onSaved: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null), [type, setType] = useState('OTHER'), [error, setError] = useState('');
  return <div className="space-y-4">
    {editable && <RecordActionForm title="Upload Private Warranty Evidence" submit={async (reason) => {
      if (!file)
        throw new Error('Choose evidence to upload.');
      if (file.size > 5 * 1024 * 1024)
        throw new Error('Maximum evidence size is 5 MiB.');
      if (![
        'image/jpeg', 'image/png', 'application/pdf'
      ].includes(file.type))
        throw new Error('Choose JPEG, PNG or PDF evidence.');
      await warrantyClient.upload(id, parent, file, {
        version, reason, documentType: type, fileName: file.name
      });
      await onSaved();
    }}>
      <Select label="Warranty Document Type" value={type} options={warrantyDocuments.map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setType(e.target.value)} />
      <Input label="Private Warranty Evidence File" type="file" accept="image/jpeg,image/png,application/pdf" required onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <p className="text-sm text-slate-500">Maximum 5 MiB. Safe filenames use letters, digits, spaces, underscores, hyphens and periods. File-format checks do not provide malware protection.</p>
    </RecordActionForm>}
    <Card>
      <h2 className="font-semibold">Private Evidence Records</h2>
      {files.map(f => <div key={f.id} className="border-t mt-3 pt-3 space-y-2">
        <p>
          {f.fileName} - {f.documentType.replaceAll('_', ' ')}
        </p>
        <p className="text-xs text-slate-500 break-all">
          {f.sizeBytes} bytes; recorded {new Date(f.createdAt).toLocaleString()}; SHA-256 {f.sha256}
        </p>
        <Button variant="outline" size="sm" onClick={async () => {
          setError('');
          try {
            await warrantyClient.download(f);
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
