/**
 * site.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Customer Installation Sites.
 * Designed to be reusable across Surveys (M02), Installations (M05), and Service (M08).
 */

export type PropertyType = 'residential' | 'commercial';

export interface Site {
  id: string;
  customerId: string;
  siteName: string; // e.g. "Main Rooftop", "Warehouse Unit 2"
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  propertyType: PropertyType;
  contactPersonOnSite: string;
  contactPhoneOnSite: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteFormData {
  customerId: string;
  siteName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country?: string;
  propertyType: PropertyType;
  contactPersonOnSite: string;
  contactPhoneOnSite: string;
}

