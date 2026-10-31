/**
 * mockData.ts
 * ─────────────────────────────────────────────────────────────
 * ⚠️ DEMO DATA ONLY – for UI development and hackathon demonstration.
 * All records are fictional. Replace with real API calls when backend is ready.
 *
 * This is the ONLY place mock data lives.  Service files reference this;
 * UI components never import mock data directly.
 */

import type { Customer, CustomerActivity } from '../types/customer.types';
import type { Enquiry } from '../types/enquiry.types';
import type { FollowUp } from '../types/followUp.types';

// ─── Mock Customers ─────────────────────────────────────────────

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001', customerId: 'CUST-0001', customerType: 'individual',
    fullName: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh.kumar@gmail.com',
    city: 'Kochi', state: 'Kerala', pinCode: '682001', country: 'India',
    addressLine1: '12, MG Road', source: 'referral', status: 'active',
    numberOfSites: 1, createdAt: '2026-10-01T09:00:00Z', updatedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'cust-002', customerId: 'CUST-0002', customerType: 'business',
    fullName: 'SunBright Enterprises', contactPerson: 'Priya Menon',
    phone: '9988776655', email: 'info@sunbright.in', gstNumber: '32AABCS1429B1Z9',
    city: 'Thrissur', state: 'Kerala', pinCode: '680001', country: 'India',
    addressLine1: '45, Commerce Road', source: 'website', status: 'active',
    numberOfSites: 2, createdAt: '2026-10-03T10:30:00Z', updatedAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'cust-003', customerId: 'CUST-0003', customerType: 'individual',
    fullName: 'Anil Sharma', phone: '9123456780', email: 'anil.sharma@yahoo.com',
    city: 'Kozhikode', state: 'Kerala', pinCode: '673001', country: 'India',
    addressLine1: '7, Beach Road', source: 'social_media', status: 'prospect',
    numberOfSites: 0, createdAt: '2026-10-05T08:00:00Z', updatedAt: '2026-10-05T08:00:00Z',
  },
  {
    id: 'cust-004', customerId: 'CUST-0004', customerType: 'organization',
    fullName: 'GreenLeaf School', contactPerson: 'Thomas Mathew',
    phone: '9456789012', email: 'admin@greenleaf.edu.in',
    city: 'Ernakulam', state: 'Kerala', pinCode: '682011', country: 'India',
    addressLine1: 'NH-66, Bypass Road', source: 'phone_call', status: 'active',
    numberOfSites: 3, createdAt: '2026-10-08T11:00:00Z', updatedAt: '2026-10-25T09:00:00Z',
  },
  {
    id: 'cust-005', customerId: 'CUST-0005', customerType: 'individual',
    fullName: 'Meena Pillai', phone: '9567890123', email: 'meena.pillai@hotmail.com',
    city: 'Thiruvananthapuram', state: 'Kerala', pinCode: '695001', country: 'India',
    addressLine1: '3, Statue Junction', source: 'walk_in', status: 'inactive',
    numberOfSites: 1, createdAt: '2026-09-20T14:00:00Z', updatedAt: '2026-10-10T16:00:00Z',
  },
  {
    id: 'cust-006', customerId: 'CUST-0006', customerType: 'business',
    fullName: 'Kerala Agro Industries', contactPerson: 'Suresh Nair',
    phone: '9654321098', email: 'suresh@keralaagro.com', gstNumber: '32AADCK3456B1Z2',
    city: 'Palakkad', state: 'Kerala', pinCode: '678001', country: 'India',
    addressLine1: 'Industrial Area, KINFRA Park', source: 'referral', status: 'prospect',
    numberOfSites: 0, createdAt: '2026-10-28T09:30:00Z', updatedAt: '2026-10-28T09:30:00Z',
  },
  {
    id: 'cust-007', customerId: 'CUST-0007', customerType: 'individual',
    fullName: 'Deepa Krishnan', phone: '9789012345', email: 'deepa.k@gmail.com',
    city: 'Kottayam', state: 'Kerala', pinCode: '686001', country: 'India',
    addressLine1: '25, Baker Junction', source: 'website', status: 'active',
    numberOfSites: 1, createdAt: '2026-10-12T10:00:00Z', updatedAt: '2026-10-22T15:00:00Z',
  },
  {
    id: 'cust-008', customerId: 'CUST-0008', customerType: 'individual',
    fullName: 'Mohammed Asif', phone: '9890123456', email: 'asif.m@gmail.com',
    city: 'Malappuram', state: 'Kerala', pinCode: '676501', country: 'India',
    addressLine1: '8, Mini Civil Station Road', source: 'social_media', status: 'prospect',
    numberOfSites: 0, createdAt: '2026-10-29T11:00:00Z', updatedAt: '2026-10-29T11:00:00Z',
  },
];

// ─── Mock Enquiries ─────────────────────────────────────────────

export const MOCK_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-001', enquiryId: 'ENQ-0001', customerId: 'cust-001',
    customerName: 'Rajesh Kumar', customerPhone: '9876543210', customerEmail: 'rajesh.kumar@gmail.com',
    systemType: 'on_grid', capacityOption: '3kw', propertyType: 'residential',
    installationLocation: '12, MG Road, Kochi', monthlyElectricityBill: 3500,
    requirements: 'Rooftop solar for home, need subsidy guidance',
    leadSource: 'referral', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-02T09:00:00Z', nextFollowUpDate: '2026-11-03',
    priority: 'high', status: 'qualified', createdAt: '2026-10-02T09:00:00Z', updatedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'enq-002', enquiryId: 'ENQ-0002', customerId: 'cust-002',
    customerName: 'SunBright Enterprises', customerPhone: '9988776655', customerEmail: 'info@sunbright.in',
    systemType: 'on_grid', capacityOption: '5kw', propertyType: 'commercial',
    installationLocation: '45, Commerce Road, Thrissur',
    requirements: 'Commercial solar installation for office building',
    leadSource: 'website', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-04T10:00:00Z', nextFollowUpDate: '2026-11-05',
    priority: 'high', status: 'site_survey_pending', createdAt: '2026-10-04T10:00:00Z', updatedAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'enq-003', enquiryId: 'ENQ-0003', customerId: 'cust-003',
    customerName: 'Anil Sharma', customerPhone: '9123456780',
    systemType: 'on_grid', capacityOption: '2kw', propertyType: 'residential',
    installationLocation: '7, Beach Road, Kozhikode',
    leadSource: 'social_media', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-06T08:00:00Z', priority: 'medium', status: 'new',
    createdAt: '2026-10-06T08:00:00Z', updatedAt: '2026-10-06T08:00:00Z',
  },
  {
    id: 'enq-004', enquiryId: 'ENQ-0004', customerId: 'cust-004',
    customerName: 'GreenLeaf School', customerPhone: '9456789012', customerEmail: 'admin@greenleaf.edu.in',
    systemType: 'on_grid', capacityOption: 'custom', customCapacity: '20 kW',
    propertyType: 'commercial', installationLocation: 'NH-66 Bypass, Ernakulam',
    requirements: '20kW system for school campus, rooftop + ground mount',
    leadSource: 'phone_call', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-09T09:00:00Z', nextFollowUpDate: '2026-11-02',
    priority: 'high', status: 'quotation_sent', createdAt: '2026-10-09T09:00:00Z', updatedAt: '2026-10-26T10:00:00Z',
  },
  {
    id: 'enq-005', enquiryId: 'ENQ-0005', customerId: 'cust-005',
    customerName: 'Meena Pillai', customerPhone: '9567890123',
    systemType: 'off_grid', capacityOption: '1kw', propertyType: 'residential',
    installationLocation: '3, Statue Junction, Thiruvananthapuram',
    leadSource: 'walk_in', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-09-22T14:00:00Z',
    priority: 'low', status: 'lost', lostReason: 'Customer opted for competitor',
    createdAt: '2026-09-22T14:00:00Z', updatedAt: '2026-10-10T16:00:00Z',
  },
  {
    id: 'enq-006', enquiryId: 'ENQ-0006', customerId: 'cust-007',
    customerName: 'Deepa Krishnan', customerPhone: '9789012345', customerEmail: 'deepa.k@gmail.com',
    systemType: 'on_grid', capacityOption: '3kw', propertyType: 'residential',
    installationLocation: '25, Baker Junction, Kottayam',
    leadSource: 'website', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-13T10:00:00Z', nextFollowUpDate: '2026-11-01',
    priority: 'medium', status: 'won',
    createdAt: '2026-10-13T10:00:00Z', updatedAt: '2026-10-22T15:00:00Z',
  },
  {
    id: 'enq-007', enquiryId: 'ENQ-0007', customerId: 'cust-006',
    customerName: 'Kerala Agro Industries', customerPhone: '9654321098',
    systemType: 'on_grid', capacityOption: 'custom', customCapacity: '50 kW',
    propertyType: 'commercial', installationLocation: 'KINFRA Park, Palakkad',
    leadSource: 'referral', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-29T09:00:00Z', priority: 'high', status: 'new',
    createdAt: '2026-10-29T09:00:00Z', updatedAt: '2026-10-29T09:00:00Z',
  },
  {
    id: 'enq-008', enquiryId: 'ENQ-0008', customerId: 'cust-008',
    customerName: 'Mohammed Asif', customerPhone: '9890123456',
    systemType: 'on_grid', capacityOption: '5kw', propertyType: 'residential',
    installationLocation: 'Mini Civil Station Road, Malappuram',
    leadSource: 'social_media', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    enquiryDate: '2026-10-29T11:00:00Z', priority: 'medium', status: 'contacted',
    createdAt: '2026-10-29T11:00:00Z', updatedAt: '2026-10-30T09:00:00Z',
  },
];

// ─── Mock Follow-ups ────────────────────────────────────────────

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

function fmtDate(d: Date) { return d.toISOString().split('T')[0]; }

export const MOCK_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'fu-001', followUpId: 'FU-0001', customerId: 'cust-001', customerName: 'Rajesh Kumar',
    enquiryId: 'enq-001', enquiryRef: 'ENQ-0001', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    followUpDate: fmtDate(today), followUpTime: '10:00', type: 'phone_call',
    status: 'pending', notes: 'Discuss subsidy documentation requirements',
    createdAt: '2026-10-28T09:00:00Z', updatedAt: '2026-10-28T09:00:00Z',
  },
  {
    id: 'fu-002', followUpId: 'FU-0002', customerId: 'cust-002', customerName: 'SunBright Enterprises',
    enquiryId: 'enq-002', enquiryRef: 'ENQ-0002', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    followUpDate: fmtDate(tomorrow), followUpTime: '14:00', type: 'site_visit',
    status: 'pending', notes: 'Visit for site survey coordination',
    createdAt: '2026-10-28T10:00:00Z', updatedAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'fu-003', followUpId: 'FU-0003', customerId: 'cust-004', customerName: 'GreenLeaf School',
    enquiryId: 'enq-004', enquiryRef: 'ENQ-0004', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    followUpDate: fmtDate(yesterday), followUpTime: '11:00', type: 'meeting',
    status: 'pending', notes: 'Review final quotation details',
    createdAt: '2026-10-27T09:00:00Z', updatedAt: '2026-10-27T09:00:00Z',
  },
  {
    id: 'fu-004', followUpId: 'FU-0004', customerId: 'cust-003', customerName: 'Anil Sharma',
    enquiryId: 'enq-003', enquiryRef: 'ENQ-0003', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    followUpDate: fmtDate(nextWeek), followUpTime: '16:00', type: 'phone_call',
    status: 'pending', notes: 'Initial contact and requirement gathering',
    createdAt: '2026-10-28T11:00:00Z', updatedAt: '2026-10-28T11:00:00Z',
  },
  {
    id: 'fu-005', followUpId: 'FU-0005', customerId: 'cust-007', customerName: 'Deepa Krishnan',
    enquiryId: 'enq-006', enquiryRef: 'ENQ-0006', assignedTo: 'user-sales-01', assignedToName: 'Sam Sales',
    followUpDate: '2026-10-20', followUpTime: '10:00', type: 'phone_call',
    status: 'completed', notes: 'Final confirmation call',
    outcomeNote: 'Customer confirmed the order. Handover to installation team.',
    createdAt: '2026-10-18T09:00:00Z', updatedAt: '2026-10-20T11:00:00Z',
  },
];

// ─── Mock Activity ──────────────────────────────────────────────

export function getMockCustomerActivity(customerId: string): CustomerActivity[] {
  const base: CustomerActivity[] = [
    { id: 'act-001', type: 'customer_created', description: 'Customer registered in the system.', performedBy: 'Sam Sales', timestamp: '2026-10-01T09:00:00Z' },
  ];
  if (customerId === 'cust-001') return [
    ...base,
    { id: 'act-002', type: 'enquiry_created', description: 'Enquiry ENQ-0001 created for 3 kW on-grid system.', performedBy: 'Sam Sales', timestamp: '2026-10-02T09:00:00Z' },
    { id: 'act-003', type: 'follow_up_scheduled', description: 'Follow-up FU-0001 scheduled for today.', performedBy: 'Sam Sales', timestamp: '2026-10-28T09:00:00Z' },
  ];
  if (customerId === 'cust-004') return [
    ...base,
    { id: 'act-002', type: 'enquiry_created', description: 'Enquiry ENQ-0004 created for 20 kW custom system.', performedBy: 'Sam Sales', timestamp: '2026-10-09T09:00:00Z' },
    { id: 'act-003', type: 'status_changed', description: 'Enquiry status changed to Quotation Sent.', performedBy: 'Sam Sales', timestamp: '2026-10-26T10:00:00Z' },
  ];
  return base;
}

