/**
 * customer.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for the Customer entity.
 * All fields marked @provisional until confirmed with backend developer.
 */

// ─── Enums / Union Types ────────────────────────────────────────

export type CustomerType = 'individual' | 'business' | 'organization';
export type CustomerStatus = 'active' | 'inactive' | 'prospect';
export type CustomerSource =
  | 'website'
  | 'phone_call'
  | 'referral'
  | 'social_media'
  | 'walk_in'
  | 'other';

// ─── Core Entity ────────────────────────────────────────────────
/**
 * Full customer record as returned by GET /api/customers/:id
 * @provisional
 */
export interface Customer {
  id: string;
  customerId: string;           // Human-readable ID e.g. CUST-0001
  customerType: CustomerType;
  fullName: string;             // Full name or business name
  contactPerson?: string;       // Required for business/organization
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;

  // Meta
  source?: CustomerSource;
  notes?: string;
  status: CustomerStatus;
  numberOfSites: number;        // Count of linked site surveys (future)

  // Timestamps
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

/** Summary record used in list views (lighter than full Customer) */
export interface CustomerSummary {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  customerType: CustomerType;
  city?: string;
  numberOfSites: number;
  status: CustomerStatus;
  createdAt: string;
}

// ─── Request / Response Shapes ─────────────────────────────────

/** Body sent to POST /api/customers or PUT /api/customers/:id @provisional */
export interface CustomerFormData {
  customerType: CustomerType;
  fullName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  source?: CustomerSource;
  notes?: string;
  status?: CustomerStatus;
}

/** Activity event on a customer timeline */
export interface CustomerActivity {
  id: string;
  type:
    | 'customer_created'
    | 'enquiry_created'
    | 'follow_up_scheduled'
    | 'follow_up_completed'
    | 'status_changed'
    | 'note_added';
  description: string;
  performedBy: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// ─── Filter / Search ───────────────────────────────────────────

export interface CustomerFilters {
  search?: string;
  customerType?: CustomerType | '';
  city?: string;
  status?: CustomerStatus | '';
  sortBy?: keyof CustomerSummary;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ─── Display Helpers ────────────────────────────────────────────

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  individual: 'Individual',
  business: 'Business',
  organization: 'Organization',
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  prospect: 'Prospect',
};

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  website: 'Website',
  phone_call: 'Phone Call',
  referral: 'Referral',
  social_media: 'Social Media',
  walk_in: 'Walk-in',
  other: 'Other',
};

export const CUSTOMER_STATUS_COLOURS: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  prospect: 'bg-blue-100 text-blue-800',
};

export const CUSTOMER_TYPE_COLOURS: Record<CustomerType, string> = {
  individual: 'bg-violet-100 text-violet-800',
  business: 'bg-amber-100 text-amber-800',
  organization: 'bg-cyan-100 text-cyan-800',
};

