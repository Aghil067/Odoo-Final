/**
 * followUp.types.ts
 * @provisional – confirm with backend developer.
 */

export type FollowUpType = 'phone_call' | 'email' | 'site_visit' | 'meeting' | 'other' | 'unspecified';
export type FollowUpStatus = 'pending' | 'completed' | 'rescheduled' | 'cancelled';

export interface FollowUp {
  id: string;
  version?:number;
  followUpId: string;           // e.g. FU-0001
  customerId: string;
  customerName: string;
  enquiryId?: string;
  enquiryRef?: string;
  assignedTo: string;
  assignedToName: string;
  followUpDate: string;         // ISO date
  followUpTime: string;         // HH:MM
  type: FollowUpType;
  status: FollowUpStatus;
  notes?: string;
  outcomeNote?: string;         // filled when marking as completed
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpFormData {
  version?:number;
  customerId: string;
  enquiryId?: string;
  assignedTo: string;
  followUpDate: string;
  followUpTime: string;
  type: FollowUpType;
  notes?: string;
}

export interface CompleteFollowUpData {
  version?:number;
  outcomeNote: string;
}

export interface RescheduleFollowUpData {
  version?:number;
  followUpDate: string;
  followUpTime: string;
  notes?: string;
}

export interface FollowUpFilters {
  search?: string;
  status?: FollowUpStatus | '';
  type?: FollowUpType | '';
  assignedTo?: string;
  dateFilter?: 'today' | 'upcoming' | 'overdue' | 'all';
  page?: number;
  pageSize?: number;
}

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  phone_call: 'Phone Call',
  email: 'Email',
  site_visit: 'Site Visit',
  meeting: 'Meeting',
  other: 'Other',
  unspecified:'Not specified',
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
};

export const FOLLOW_UP_STATUS_COLOURS: Record<FollowUpStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  rescheduled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export const FOLLOW_UP_TYPE_COLOURS: Record<FollowUpType, string> = {
  unspecified:'bg-slate-100 text-slate-700',
  phone_call: 'bg-indigo-100 text-indigo-800',
  email: 'bg-cyan-100 text-cyan-800',
  site_visit: 'bg-green-100 text-green-800',
  meeting: 'bg-violet-100 text-violet-800',
  other: 'bg-slate-100 text-slate-600',
};

