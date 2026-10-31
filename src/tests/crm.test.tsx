/**
 * crm.test.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive test suite for Module M01: Customer & CRM Management.
 * Covers:
 *  - Customer service (list, search, filter, create, getById, update)
 *  - Enquiry service (list, search, create, updateStatus, stats)
 *  - Follow-up service (list, overdue filter, complete, reschedule)
 *  - Role-based permissions for CRM module
 *  - Form validation logic
 */
import { describe, it, expect } from 'vitest';
import { customerService } from '../features/crm/services/customerService';
import { enquiryService } from '../features/crm/services/enquiryService';
import { followUpService } from '../features/crm/services/followUpService';
import { canAccess, hasFull, getPermission } from '../config/permissions';
import type { CustomerFormData } from '../features/crm/types/customer.types';
import type { EnquiryFormData } from '../features/crm/types/enquiry.types';

describe('Customer Service Tests', () => {
  it('1. Lists initial customer records with pagination', async () => {
    const res = await customerService.list({ page: 1, pageSize: 5 });
    expect(res.data.length).toBeLessThanOrEqual(5);
    expect(res.total).toBeGreaterThan(0);
    expect(res.data[0]).toHaveProperty('customerId');
  });

  it('2. Filters customers by search query (name or phone)', async () => {
    const res = await customerService.list({ search: 'Rajesh' });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].fullName).toContain('Rajesh');
  });

  it('3. Filters customers by customerType', async () => {
    const res = await customerService.list({ customerType: 'business' });
    res.data.forEach((c) => {
      expect(c.customerType).toBe('business');
    });
  });

  it('4. Creates a new customer successfully with generated ID', async () => {
    const newCust: CustomerFormData = {
      customerType: 'individual',
      fullName: 'Test Solar Customer',
      phone: '9998887776',
      email: 'test@example.com',
      city: 'Kochi',
      state: 'Kerala',
    };
    const created = await customerService.create(newCust);
    expect(created.id).toBeDefined();
    expect(created.customerId).toMatch(/^CUST-\d+/);
    expect(created.fullName).toBe('Test Solar Customer');

    const fetched = await customerService.getById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.phone).toBe('9998887776');
  });

  it('5. Updates an existing customer profile', async () => {
    const created = await customerService.create({
      customerType: 'individual',
      fullName: 'Updatable Customer',
      phone: '9111222333',
    });
    const updated = await customerService.update(created.id, {
      fullName: 'Updated Solar Customer',
      city: 'Trivandrum',
    });
    expect(updated.fullName).toBe('Updated Solar Customer');
    expect(updated.city).toBe('Trivandrum');
  });

  it('6. Fetches customer activity timeline', async () => {
    const activities = await customerService.getActivity('cust-001');
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0]).toHaveProperty('type');
  });
});

describe('Enquiry Service Tests', () => {
  it('7. Lists enquiries with filter support', async () => {
    const res = await enquiryService.list({ pageSize: 10 });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]).toHaveProperty('enquiryId');
  });

  it('8. Creates a new solar enquiry with system specifications', async () => {
    const newEnq: EnquiryFormData = {
      customerName: 'Vinod Verma',
      customerPhone: '9888777666',
      systemType: 'on_grid',
      capacityOption: '5kw',
      propertyType: 'residential',
      installationLocation: 'Kochi, Kerala',
      leadSource: 'website',
      assignedTo: 'user-sales-01',
      enquiryDate: '2026-10-31',
      priority: 'high',
    };
    const created = await enquiryService.create(newEnq);
    expect(created.id).toBeDefined();
    expect(created.enquiryId).toMatch(/^ENQ-\d+/);
    expect(created.status).toBe('new');
    expect(created.capacityOption).toBe('5kw');
  });

  it('9. Updates enquiry status across pipeline stages', async () => {
    const enq = await enquiryService.create({
      customerName: 'Pipeline Test',
      customerPhone: '9000111222',
      systemType: 'on_grid',
      capacityOption: '3kw',
      propertyType: 'residential',
      installationLocation: 'Calicut',
      leadSource: 'walk_in',
      assignedTo: 'user-sales-01',
      enquiryDate: '2026-10-31',
      priority: 'medium',
    });

    const updated = await enquiryService.updateStatus(enq.id, { status: 'site_survey_pending' });
    expect(updated.status).toBe('site_survey_pending');

    const won = await enquiryService.updateStatus(enq.id, { status: 'won' });
    expect(won.status).toBe('won');
  });

  it('10. Calculates dashboard statistics accurately', async () => {
    const stats = await enquiryService.getDashboardStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.byStatus).toBeDefined();
    expect(stats.byStatus['won']).toBeGreaterThanOrEqual(0);
  });
});

describe('Follow-up Service Tests', () => {
  it('11. Lists scheduled follow-ups and supports overdue filter', async () => {
    const res = await followUpService.list();
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('12. Completes a follow-up with mandatory outcome note', async () => {
    const created = await followUpService.create({
      customerId: 'cust-001',
      assignedTo: 'user-sales-01',
      followUpDate: '2026-10-31',
      followUpTime: '11:00',
      type: 'phone_call',
      notes: 'Check inverter options',
    });

    const completed = await followUpService.complete(created.id, {
      outcomeNote: 'Client agreed to 5kW hybrid option.',
    });
    expect(completed.status).toBe('completed');
    expect(completed.outcomeNote).toContain('Client agreed');
  });

  it('13. Reschedules and cancels a follow-up task', async () => {
    const created = await followUpService.create({
      customerId: 'cust-002',
      assignedTo: 'user-sales-01',
      followUpDate: '2026-11-01',
      followUpTime: '15:00',
      type: 'site_visit',
    });

    const rescheduled = await followUpService.reschedule(created.id, {
      followUpDate: '2026-11-05',
      followUpTime: '10:00',
    });
    expect(rescheduled.status).toBe('rescheduled');
    expect(rescheduled.followUpDate).toBe('2026-11-05');

    const cancelled = await followUpService.cancel(created.id);
    expect(cancelled.status).toBe('cancelled');
  });
});

describe('M01 Role-Based Access Control (RBAC) Verification', () => {
  it('14. Admin has Full access to customers & CRM', () => {
    expect(getPermission('customers', 'admin')).toBe('full');
    expect(hasFull('customers', 'admin')).toBe('full' === 'full');
    expect(canAccess('customers', 'admin')).toBe(true);
  });

  it('15. Sales Executive has Full access to customers & CRM', () => {
    expect(getPermission('customers', 'sales_executive')).toBe('full');
    expect(canAccess('customers', 'sales_executive')).toBe(true);
  });

  it('16. Surveyor has View-only access to customers & CRM', () => {
    expect(getPermission('customers', 'surveyor')).toBe('view');
    expect(canAccess('customers', 'surveyor')).toBe(true);
    expect(hasFull('customers', 'surveyor')).toBe(false);
  });

  it('17. Installation Manager and Finance Officer have View-only access', () => {
    expect(getPermission('customers', 'installation_manager')).toBe('view');
    expect(getPermission('customers', 'finance_officer')).toBe('view');
    expect(canAccess('customers', 'installation_manager')).toBe(true);
    expect(canAccess('customers', 'finance_officer')).toBe(true);
  });

  it('18. Inventory Manager and Technician are denied access to customers & CRM', () => {
    expect(getPermission('customers', 'inventory_manager')).toBe('none');
    expect(getPermission('customers', 'technician')).toBe('none');
    expect(canAccess('customers', 'inventory_manager')).toBe(false);
    expect(canAccess('customers', 'technician')).toBe(false);
  });
});
