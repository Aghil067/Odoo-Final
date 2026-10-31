/**
 * src/features/crm/components/FollowUpForm.tsx
 * Modal or standalone form to schedule, reschedule, or complete follow-ups.
 */
import { useState,useEffect, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import type {
  FollowUpFormData,
  FollowUpType,
} from '../types/followUp.types';
import {enquiryService} from '../services/enquiryService';
import type {EnquirySummary} from '../types/enquiry.types';
import { FOLLOW_UP_TYPE_LABELS } from '../types/followUp.types';

interface FollowUpFormProps {
  customerId: string;
  enquiryId?: string;
  defaultDate?: string;
  onSubmit: (data: FollowUpFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FollowUpForm({
  customerId,
  enquiryId,
  defaultDate,
  onSubmit,
  onCancel,
  isLoading,
}: FollowUpFormProps) {
  const [formData, setFormData] = useState<FollowUpFormData>({
    customerId,
    enquiryId,
    assignedTo: '',
    followUpDate: defaultDate ?? new Date().toISOString().split('T')[0],
    followUpTime: '10:00',
    type: 'phone_call',
    notes: '',
  });

  const [leads,setLeads]=useState<EnquirySummary[]>([]);
  useEffect(()=>{void enquiryService.getByCustomerId(customerId).then(rows=>{setLeads(rows);if(enquiryId){const lead=rows.find(r=>r.id===enquiryId);setFormData(f=>({...f,version:lead?.version}));}}).catch(e=>setErrors({load:e.message}));},[customerId,enquiryId]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.followUpDate) errs.followUpDate = 'Date is required';
    if (!formData.followUpTime) errs.followUpTime = 'Time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const typeOptions = Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.load&&<p role="alert" className="text-red-700">{errors.load}</p>}
      <Select label="Customer Lead" required value={formData.enquiryId??''} options={[{value:'',label:'Select a lead'},...leads.map(l=>({value:l.id,label:l.enquiryId}))]} onChange={e=>setFormData({...formData,enquiryId:e.target.value,version:leads.find(l=>l.id===e.target.value)?.version})}/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Follow-up Type"
          options={typeOptions}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as FollowUpType })}
        />

        <Input
          label="Date"
          required
          type="date"
          value={formData.followUpDate}
          error={errors.followUpDate}
          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
        />

        <Input
          label="Time"
          required
          type="time"
          value={formData.followUpTime}
          error={errors.followUpTime}
          onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
        />
      </div>

      <Textarea
        label="Agenda / Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Topics to discuss, customer questions..."
      />

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
          Schedule Follow-up
        </Button>
      </div>
    </form>
  );
}

