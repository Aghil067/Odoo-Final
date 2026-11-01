import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { RecordActionForm } from '../../../components/common/RecordActionForm';
import { workforceClient, type WorkforceProfile, type WorkforceSchedule, type WorkforceLeave } from '../services/workforceClient';
const days = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
const minute = (s: string) => {
  if (!/^\d{2}:\d{2}$/.test(s))
    throw new Error('Enter each shift time.');
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
type DraftShift = {
  key: string;
  weekday: string;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};
export function WorkforceScheduleForm({ id, profile, schedules, onSaved }: {
  id: string;
  profile: WorkforceProfile;
  schedules: WorkforceSchedule[];
  onSaved: () => Promise<void>;
}) {
  const [zone, setZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone), [from, setFrom] = useState(''), [to, setTo] = useState(''), [replace, setReplace] = useState(''), [shifts, setShifts] = useState<DraftShift[]>([]);
  const update = (key: string, patch: Partial<DraftShift>) => setShifts(rows => rows.map(r => r.key === key ? {
    ...r, ...patch
  } : r));
  return <RecordActionForm title="Save Effective Work Schedule" submit={async (reason) => {
    await workforceClient.schedule(id, {
      version: profile.version, reason, timezone: zone, effectiveFrom: new Date(from).toISOString(), effectiveTo: new Date(to).toISOString(), ...(replace ? {
        replaceScheduleId: replace
      } : {}), shifts: shifts.map(s => {
        if (!s.weekday)
          throw new Error('Choose a weekday for each shift.');
        return {
          weekday: Number(s.weekday), startMinute: minute(s.start), endMinute: minute(s.end), breakStartMinute: s.breakStart ? minute(s.breakStart) : null, breakEndMinute: s.breakEnd ? minute(s.breakEnd) : null
        };
      })
    });
    await onSaved();
  }}>
    <p className="text-sm text-slate-500">Weekly shifts use the chosen IANA timezone. Effective bounds are entered in your local time and sent as UTC instants. Split overnight shifts across weekdays. Existing schedules are archived only through explicit replacement.</p>
    <Input label="Schedule IANA Timezone" required value={zone} onChange={e => setZone(e.target.value)} />
    <div className="grid sm:grid-cols-2 gap-3">
      <Input label="Schedule Effective From (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
      <Input label="Schedule Effective Through (Local Time)" type="datetime-local" required min={from} value={to} onChange={e => setTo(e.target.value)} />
    </div>
    <Select label="Schedule to Replace from This Page" value={replace} options={[
      {
        value: '', label: 'Create Separate Effective Period'
      }, ...schedules.filter(s => s.isActive).map(s => ({
        value: s.id, label: s.timezone + ' ' + new Date(s.effectiveFrom).toLocaleString()
      }))
    ]} onChange={e => setReplace(e.target.value)} />
    {shifts.map((s, i) => <div key={s.key} className="border rounded p-3 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Select label={'Shift ' + (i + 1) + ' Weekday'} required value={s.weekday} options={[
          {
            value: '', label: 'Choose Weekday'
          }, ...days.map((d, n) => ({
            value: String(n), label: d
          }))
        ]} onChange={e => update(s.key, {
          weekday: e.target.value
        })} />
        <Input label={'Shift ' + (i + 1) + ' Starts'} type="time" required value={s.start} onChange={e => update(s.key, {
          start: e.target.value
        })} />
        <Input label={'Shift ' + (i + 1) + ' Ends'} type="time" required value={s.end} onChange={e => update(s.key, {
          end: e.target.value
        })} />
        <Input label={'Shift ' + (i + 1) + ' Break Starts (Optional)'} type="time" value={s.breakStart} onChange={e => update(s.key, {
          breakStart: e.target.value
        })} />
        <Input label={'Shift ' + (i + 1) + ' Break Ends (Optional)'} type="time" value={s.breakEnd} onChange={e => update(s.key, {
          breakEnd: e.target.value
        })} />
      </div>
      <Button type="button" variant="ghost" onClick={() => setShifts(rows => rows.filter(r => r.key !== s.key))}>Remove Shift</Button>
    </div>)}
    <Button type="button" variant="outline" disabled={shifts.length >= 14} onClick={() => setShifts(rows => [
      ...rows, {
        key: crypto.randomUUID(), weekday: '', start: '', end: '', breakStart: '', breakEnd: ''
      }
    ])}>Add Weekly Shift</Button>
    <p className="text-xs text-amber-800">New shift times must be entered to match the agreed work calendar; no shift is inferred from assignment dates.</p>
  </RecordActionForm>;
}
export function WorkforceExceptionForm({ id, profile, onSaved }: {
  id: string;
  profile: WorkforceProfile;
  onSaved: () => Promise<void>;
}) {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [kind, setKind] = useState('ADMIN_BLOCK');
  return <RecordActionForm title="Record Calendar Exception" submit={async (reason) => {
    await workforceClient.exception(id, {
      version: profile.version, reason, startsAt: new Date(from).toISOString(), endsAt: new Date(to).toISOString(), kind
    });
    await onSaved();
  }}>
    <Select label="Calendar Exception Type" value={kind} options={[
      'HOLIDAY', 'NONWORKING', 'ADMIN_BLOCK'
    ].map(v => ({
      value: v, label: v.replaceAll('_', ' ')
    }))} onChange={e => setKind(e.target.value)} />
    <Input label="Exception Starts (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
    <Input label="Exception Ends (Local Time)" type="datetime-local" required min={from} value={to} onChange={e => setTo(e.target.value)} />
    <p className="text-sm text-slate-500">The backend blocks exceptions that conflict with committed source work.</p>
  </RecordActionForm>;
}
export function WorkforceLeaveForm({ id, onSaved }: {
  id: string;
  onSaved: () => Promise<void>;
}) {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [category, setCategory] = useState('PERSONAL'), [notes, setNotes] = useState('');
  return <RecordActionForm title="Request Technician Leave" submit={async (reason) => {
    await workforceClient.requestLeave({
      userId: id, startsAt: new Date(from).toISOString(), endsAt: new Date(to).toISOString(), category, privateNotes: notes || null, reason
    });
    await onSaved();
  }}>
    <Select label="Leave Category" value={category} options={[
      'PERSONAL', 'MEDICAL', 'EMERGENCY', 'UNAVAILABLE'
    ].map(v => ({
      value: v, label: v
    }))} onChange={e => setCategory(e.target.value)} />
    <Input label="Leave Starts (Local Time)" type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)} />
    <Input label="Leave Ends (Local Time)" type="datetime-local" required min={from} value={to} onChange={e => setTo(e.target.value)} />
    <Textarea label="Private Leave Notes" value={notes} onChange={e => setNotes(e.target.value)} />
  </RecordActionForm>;
}
export function WorkforceLeaveReview({ leave, onSaved }: {
  leave: WorkforceLeave;
  onSaved: () => Promise<void>;
}) {
  const [decision, setDecision] = useState('REJECTED'), [notes, setNotes] = useState('');
  return <RecordActionForm title="Review Leave Request" submit={async (reason) => {
    await workforceClient.reviewLeave(leave.id, {
      version: leave.version, reason, decision, decisionNotes: notes
    });
    await onSaved();
  }}>
    <Select label="Leave Decision" value={decision} options={[
      {
        value: 'REJECTED', label: 'Reject'
      }, {
        value: 'APPROVED', label: 'Approve'
      }
    ]} onChange={e => setDecision(e.target.value)} />
    <Textarea label="Leave Decision Notes" required value={notes} onChange={e => setNotes(e.target.value)} />
  </RecordActionForm>;
}
