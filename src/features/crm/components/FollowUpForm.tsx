import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { PagedRecordSelect, type RecordQuery } from '../../../components/common/PagedRecordSelect';
import { enquiryService } from '../services/enquiryService';
import type { Enquiry } from '../types/enquiry.types';
import type { FollowUpFormData, FollowUpType } from '../types/followUp.types';
import { FOLLOW_UP_TYPE_LABELS } from '../types/followUp.types';
interface Props {
  customerId: string;
  enquiryId?: string;
  defaultDate?: string;
  onSubmit: (data: FollowUpFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
export function FollowUpForm({ customerId, enquiryId, defaultDate, onSubmit, onCancel, isLoading }: Props) {
  const [lead, setLead] = useState<Enquiry | null>(null), [date, setDate] = useState(defaultDate ?? ''), [time, setTime] = useState(''), [type, setType] = useState<FollowUpType>('phone_call'), [notes, setNotes] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false), load = useCallback((q: RecordQuery) => enquiryService.list({
    customerId, search: q.q, page: q.page, pageSize: q.pageSize
  }), [
    customerId
  ]);
  useEffect(() => {
    if (!enquiryId)
      return;
    let live = true;
    enquiryService.getById(enquiryId).then(r => {
      if (live)
        setLead(r);
    }).catch(e => {
      if (live)
        setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [
    enquiryId
  ]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving)
      return;
    setSaving(true);
    setError('');
    try {
      if (!lead || !lead.version)
        throw new Error('Choose an actual customer lead and its current version.');
      await onSubmit({
        customerId, enquiryId: lead.id, version: lead.version, assignedTo: lead.assignedTo, followUpDate: date, followUpTime: time, type, notes, reschedule: !!lead.nextFollowUpDate
      });
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Follow-up was not saved.');
    }
    finally {
      setSaving(false);
    }
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={isLoading || saving} className="space-y-4">
      <PagedRecordSelect label="Customer Lead" selected={lead} onChange={setLead} load={load} describe={l => l.enquiryId + ' | ' + l.status} required />
      {lead?.nextFollowUpDate && <p className="text-sm text-amber-800">This lead has a follow-up at {new Date(lead.nextFollowUpDate).toLocaleString()}. Saving explicitly reschedules it with your notes.</p>}
      <div className="grid md:grid-cols-3 gap-3">
        <Select label="Follow-up Type Recorded in Notes" value={type} options={Object.entries(FOLLOW_UP_TYPE_LABELS).filter(([key]) => key !== 'unspecified').map(([value, label]) => ({
          value, label
        }))} onChange={e => setType(e.target.value as FollowUpType)} />
        <Input label="Follow-up Date (Local Time)" type="date" required value={date} onChange={e => setDate(e.target.value)} />
        <Input label="Follow-up Time (Local Time)" type="time" required value={time} onChange={e => setTime(e.target.value)} />
      </div>
      <Textarea label="Actual Follow-up Agenda or Rescheduling Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
    </fieldset>
    {error && <p role="alert" className="text-red-700">
      {error}
    </p>}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button type="submit" isLoading={saving || isLoading}>
        {lead?.nextFollowUpDate ? 'Explicitly Reschedule Follow-up' : 'Schedule Follow-up'}
      </Button>
    </div>
  </form>;
}
