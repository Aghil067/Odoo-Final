import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { getPage, postData } from '../../../services/apiClient';
import type { Enquiry } from '../types/enquiry.types';
const people = (q: RecordQuery) => getPage<{
  id: string;
  name: string;
}>('/crm/salespeople', {
  ...q
});
export function LeadAssignmentForm({ lead, onSaved }: {
  lead: Enquiry;
  onSaved: () => Promise<void>;
}) {
  const [person, setPerson] = useState<{
    id: string;
    name: string;
  } | null>(lead.assignedTo ? {
    id: lead.assignedTo, name: lead.assignedToName
  } : null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy)
      return;
    setBusy(true);
    setError('');
    try {
      if (!lead.version)
        throw new Error('Refresh the current lead version.');
      await postData('/leads/' + lead.id + '/assign', {
        version: lead.version, assignedToId: person?.id ?? null
      });
      await onSaved();
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment was not saved.');
    }
    finally {
      setBusy(false);
    }
  }
  return <Card>
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-semibold">Explicit Sales Reassignment</h3>
      <fieldset disabled={busy}>
        <PagedRecordSelect label="New Lead Salesperson (Optional)" selected={person} onChange={setPerson} load={people} describe={u => u.name} />
      </fieldset>
      <p className="text-sm text-slate-500">Clearing the selection removes the assignment. The backend preserves an audit entry and checks the exact lead version.</p>
      {error && <p role="alert">
        {error}
      </p>}
      <Button type="submit" isLoading={busy}>Save Versioned Lead Assignment</Button>
    </form>
  </Card>;
}
