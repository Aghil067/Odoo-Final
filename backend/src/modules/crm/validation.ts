import { z } from 'zod';
import { ActivityType, CustomerType, LeadPriority, LeadSource, LeadStatus, SystemType } from '@prisma/client';
import { getCountries, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { env } from '../../config/env.js';

export const uuid = z.uuid();
export const idParams = z.strictObject({ id: uuid });
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => text(max).nullable().optional();
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const q = text(160).optional();
export const customerQuery = pageQuery.extend({ q, type: z.enum(CustomerType).optional(), archived: z.enum(['true', 'false']).default('false') }).strict();
export const leadQuery = pageQuery.extend({
  q, status: z.enum(LeadStatus).optional(), source: z.enum(LeadSource).optional(), priority: z.enum(LeadPriority).optional(),
  customerId: uuid.optional(), siteId: uuid.optional(), assignedToId: uuid.optional(),
  followUp: z.enum(['upcoming', 'overdue']).optional(),
}).strict();
export const salespersonQuery = pageQuery.extend({ q }).strict();
export const timelineQuery = pageQuery.strict();

export function normalizePhone(value: string): string | undefined {
  const phone = parsePhoneNumberFromString(value, { defaultCountry: env.DEFAULT_PHONE_COUNTRY as CountryCode, extract: false });
  return phone?.isValid() && !phone.ext ? phone.number : undefined;
}
const phone = text(40).refine(value => normalizePhone(value) !== undefined, 'Valid phone required; use international format, with no extension');
const customerFields = z.strictObject({
  name: text(160), type: z.enum(CustomerType), phone,
  email: z.email().max(254).transform(value => value.toLowerCase()).nullable().optional(),
  companyName: optionalText(160), notes: optionalText(5000),
});
export const createCustomer = customerFields.extend({ type: z.enum(CustomerType).default('INDIVIDUAL') });
export const updateCustomer = customerFields.partial().extend({ version: z.number().int().positive() }).refine(value => Object.keys(value).length > 1, 'Supply at least one editable field');
export const versionInput = z.strictObject({ version: z.number().int().positive() });

const countryCodes = new Set<string>(getCountries());
const siteFields = z.strictObject({
  name: text(160), addressLine1: text(250), addressLine2: optionalText(250), city: text(100), state: text(100),
  postalCode: text(20), country: z.string().length(2).toUpperCase().refine(value => countryCodes.has(value), 'ISO 3166-1 alpha-2 country code required'),
  landmark: optionalText(250), propertyNotes: optionalText(5000),
  latitude: z.number().min(-90).max(90).multipleOf(0.000001).nullable().optional(),
  longitude: z.number().min(-180).max(180).multipleOf(0.000001).nullable().optional(),
});
function coordinatePair(value: { latitude?: number | null; longitude?: number | null }) {
  if (value.latitude === undefined && value.longitude === undefined) return true;
  return (typeof value.latitude === 'number' && typeof value.longitude === 'number') || (value.latitude === null && value.longitude === null);
}
export const createSite = siteFields.refine(coordinatePair, 'Supply both coordinates, omit both, or clear both with null');
export const updateSite = siteFields.partial().extend({ version: z.number().int().positive() })
  .refine(value => Object.keys(value).length > 1, 'Supply at least one editable field').refine(coordinatePair, 'Supply or clear both coordinates together');

// Decimal inputs are strings; no binary floating point arithmetic for money or capacity.
const capacity = z.string().regex(/^(0|[1-9]\d{0,6})(\.\d{1,3})?$/).refine(value => Number(value) > 0, 'Capacity must be positive');
const money = z.string().regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/);
const dateTime = z.iso.datetime({ offset: true }).transform(value => new Date(value));
const leadFields = z.strictObject({
  source: z.enum(LeadSource), priority: z.enum(LeadPriority),
  requestedCapacityKw: capacity.nullable().optional(), preferredSystemType: z.enum(SystemType),
  monthlyElectricityBill: money.nullable().optional(), qualificationNotes: optionalText(5000),
  nextFollowUpAt: dateTime.nullable().optional(),
});
export const createLead = leadFields.extend({ customerId: uuid, siteId: uuid, assignedToId: uuid.nullable().optional(),
  priority: z.enum(LeadPriority).default('MEDIUM'), preferredSystemType: z.enum(SystemType).default('UNDECIDED'),
});
export const updateLead = leadFields.partial().extend({ siteId: uuid.optional(), version: z.number().int().positive() })
  .refine(value => Object.keys(value).length > 1, 'Supply at least one editable field');
export const assignLead = z.strictObject({ assignedToId: uuid.nullable(), version: z.number().int().positive() });
export const changeStatus = z.strictObject({ status: z.enum(LeadStatus), reason: optionalText(2000), version: z.number().int().positive() });
export const createActivity = z.strictObject({ type: z.enum(ActivityType), description: text(5000) });
