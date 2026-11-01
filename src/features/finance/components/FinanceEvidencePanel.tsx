import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { financeClient } from '../services/financeClient';
import type { FinanceContext } from './FinanceWorkForms';
const categories: Record<string, string> = {
  quotations: 'CUSTOMER_ACCEPTANCE', payments: 'PAYMENT_PROOF', 'credit-notes': 'CREDIT_SUPPORT', refunds: 'REFUND_PROOF', expenses: 'EXPENSE_RECEIPT', 'service-charges': 'SERVICE_CHARGE_SUPPORT'
};
const states: Record<string, string[]> = {
  quotations: [
    'DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'SENT'
  ], payments: [
    'RECORDED', 'PENDING_VERIFICATION', 'VERIFIED'
  ], 'credit-notes': [
    'DRAFT', 'SUBMITTED'
  ], refunds: [
    'REQUESTED', 'APPROVED'
  ], expenses: [
    'DRAFT', 'SUBMITTED'
  ], 'service-charges': [
    'DRAFT', 'SUBMITTED'
  ]
};
export function FinanceEvidencePanel({ group, document: d, files, onSaved }: FinanceContext) {
  const [file, setFile] = useState<File | null>(null), [type, setType] = useState(categories[group] ?? 'OTHER'), [error, setError] = useState(''), editable = states[group]?.includes(d.status ?? '');
  return <div className="space-y-4">
    {editable && <RecordActionForm title="Upload Private Financial Evidence" submit={async (reason) => {
      if (!file)
        throw new Error('Choose a private evidence file.');
      if (file.size > 5 * 1024 * 1024)
        throw new Error('Maximum file size is 5 MiB.');
      if (![
        'image/jpeg', 'image/png', 'application/pdf'
      ].includes(file.type))
        throw new Error('Choose JPEG, PNG or PDF evidence.');
      await financeClient.upload(group, d.id, file, {
        version: d.version, reason, type, fileName: file.name
      });
      await onSaved();
    }}>
      <Select label="Exact Financial Evidence Category" value={type} options={[
        categories[group], 'OTHER'
      ].filter(Boolean).map(v => ({
        value: v, label: v.replaceAll('_', ' ')
      }))} onChange={e => setType(e.target.value)} />
      <Input label="Private Financial Evidence File" type="file" required accept="image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <p className="text-sm text-slate-500">Maximum 5 MiB; filenames use letters, digits, spaces, underscores, hyphens and periods. Keep credentials and full card numbers out of evidence. Format checks are not malware protection.</p>
    </RecordActionForm>}
    <Card>
      <h2 className="font-semibold">Private Financial Evidence</h2>
      {files.map(f => <div className="border-t mt-3 pt-3 space-y-2" key={f.id}>
        <p>
          {f.fileName} - {f.type.replaceAll('_', ' ')}
        </p>
        <p className="text-xs text-slate-500 break-all">
          {f.sizeBytes} bytes; owner version {f.ownerVersion}; {new Date(f.createdAt).toLocaleString()}; SHA-256 {f.sha256}
        </p>
        <Button variant="outline" size="sm" onClick={async () => {
          setError('');
          try {
            await financeClient.download(group, d.id, f);
          }
          catch (e) {
            setError(e instanceof Error ? e.message : 'Could not download evidence.');
          }
        }}>Download {f.fileName}
        </Button>
      </div>)}
      {!files.length && <p>No evidence uploaded to this exact financial document.</p>}
      {error && <p role="alert">
        {error}
      </p>}
    </Card>
  </div>;
}
