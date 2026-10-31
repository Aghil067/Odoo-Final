/**
 * enquiry.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for the Enquiry entity.
 * @provisional – confirm all fields with backend developer.
 */

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_survey_pending'
  | 'survey_completed'
  | 'quotation_sent'
  | 'won'
  | 'lost';

export type SystemType = 'on_grid' | 'off_grid';
export type PropertyType = 'residential' | 'commercial';
export type CapacityOption = '1kw' | '2kw' | '3kw' | '4kw' | '5kw' | 'custom';
export type EnquiryPriority = 'low' | 'medium' | 'high';
export type LeadSource =
  | 'website'
  | 'phone_call'
  | 'referral'
  | 'social_media'
  | 'walk_in'
  | 'other';

// ─── Core Entity ────────────────────────────────────────────────

export interface Enquiry {
  id: string;
  enquiryId: string;            // Human-readable e.g. ENQ-0001
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Solar requirements
  systemType: SystemType;
  capacityOption: CapacityOption;
  customCapacity?: string;      // when capacityOption === 'custom'
  propertyType: PropertyType;
  installationLocation: string;
  monthlyElectricityBill?: number;
  requirements?: string;

  // Sales
  leadSource: LeadSource;
  assignedTo: string;           // user ID of assigned sales executive
  assignedToName: string;       // display name
  enquiryDate: string;
  nextFollowUpDate?: string;
  priority: EnquiryPriority;

  // Status
  status: EnquiryStatus;
  lostReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface EnquirySummary {
  id: string;
  enquiryId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  enquiryDate: string;
  systemType: SystemType;
  capacityOption: CapacityOption;
  installationLocation: string;
  leadSource: LeadSource;
  assignedToName: string;
  status: EnquiryStatus;
  nextFollowUpDate?: string;
  priority: EnquiryPriority;
  createdAt: string;
}

// ─── Request Shapes ─────────────────────────────────────────────

export interface EnquiryFormData {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  systemType: SystemType;
  capacityOption: CapacityOption;
  customCapacity?: string;
  propertyType: PropertyType;
  installationLocation: string;
  monthlyElectricityBill?: number;
  requirements?: string;
  leadSource: LeadSource;
  assignedTo: string;
  enquiryDate: string;
  nextFollowUpDate?: string;
  priority: EnquiryPriority;
  status?: EnquiryStatus;
}

export interface UpdateEnquiryStatusData {
  status: EnquiryStatus;
  lostReason?: string;
}

// ─── Filters ────────────────────────────────────────────────────

export interface EnquiryFilters {
  search?: string;
  status?: EnquiryStatus | '';
  systemType?: SystemType | '';
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: keyof EnquirySummary;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ─── Display Helpers ────────────────────────────────────────────

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_survey_pending: 'Survey Pending',
  survey_completed: 'Survey Done',
  quotation_sent: 'Quotation Sent',
  won: 'Won',
  lost: 'Lost',
};

export const ENQUIRY_STATUS_COLOURS: Record<EnquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-indigo-100 text-indigo-800',
  qualified: 'bg-violet-100 text-violet-800',
  site_survey_pending: 'bg-amber-100 text-amber-800',
  survey_completed: 'bg-orange-100 text-orange-800',
  quotation_sent: 'bg-cyan-100 text-cyan-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

/** Pipeline stages in order */
export const PIPELINE_STAGES: EnquiryStatus[] = [
  'new',
  'contacted',
  'qualified',
  'site_survey_pending',
  'survey_completed',
  'quotation_sent',
  'won',
];

export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  on_grid: 'On-grid',
  off_grid: 'Off-grid',
};

export const CAPACITY_LABELS: Record<CapacityOption, string> = {
  '1kw': '1 kW',
  '2kw': '2 kW',
  '3kw': '3 kW',
  '4kw': '4 kW',
  '5kw': '5 kW',
  custom: 'Custom',
};

export const PRIORITY_LABELS: Record<EnquiryPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COLOURS: Record<EnquiryPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  phone_call: 'Phone Call',
  referral: 'Referral',
  social_media: 'Social Media',
  walk_in: 'Walk-in',
  other: 'Other',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
};

