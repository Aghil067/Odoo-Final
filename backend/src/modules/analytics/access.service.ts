import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/http.js';
import { leadScope, customerScope as crmCustomers } from '../crm/access.js';
import { surveyScope } from '../surveys/access.js';
import { scope as installationScope } from '../installations/common.js';
import { scope as serviceScope } from '../service/common.js';
import { jobScope as warrantyProjects } from '../warranties/common.js';
import { customerScope as financeCustomers } from '../finance/common.js';
import type { Context } from './common.js';
export const permissions = { sales: ['ADMIN', 'SALES'], surveys: ['ADMIN', 'SALES', 'TECHNICIAN'], solar: ['ADMIN', 'SALES', 'TECHNICIAN'], inventory: ['ADMIN', 'WAREHOUSE', 'FINANCE'], installations: ['ADMIN', 'SALES', 'TECHNICIAN'], technicians: ['ADMIN', 'TECHNICIAN'], warranties: ['ADMIN', 'SUPPORT'], service: ['ADMIN', 'SUPPORT', 'TECHNICIAN'], finance: ['ADMIN', 'FINANCE'] } as const;
export type Department = keyof typeof permissions;
export function allowed(c: Context, department: Department) { return (permissions[department] as readonly string[]).includes(c.user.role); }
export function requireDepartment(c: Context, department: Department) {
    if (!allowed(c, department))
        throw new ApiError(403, 'ANALYTICS_FORBIDDEN', 'Your role cannot access this analytics department');
}
export function leadWhere(c: Context): Prisma.LeadWhereInput { return { AND: [leadScope(c.user), { customerId: c.q.customerId, siteId: c.q.siteId, ...(c.q.installationId ? { installationJobs: { some: { id: c.q.installationId } } } : {}), ...(c.q.technicianId ? { surveys: { some: { assignedToId: c.q.technicianId } } } : {}) }] }; }
export function customerWhere(c: Context): Prisma.CustomerWhereInput { return { AND: [crmCustomers(c.user), { id: c.q.customerId, ...(c.q.siteId ? { sites: { some: { id: c.q.siteId } } } : {}), ...(c.q.installationId ? { installationJobs: { some: { id: c.q.installationId } } } : {}), ...(c.q.technicianId ? { surveys: { some: { assignedToId: c.q.technicianId } } } : {}) }] }; }
export function surveyWhere(c: Context): Prisma.SiteSurveyWhereInput { return { AND: [surveyScope(c.user), { customerId: c.q.customerId, siteId: c.q.siteId, assignedToId: c.q.technicianId, ...(c.q.installationId ? { lead: { installationJobs: { some: { id: c.q.installationId } } } } : {}) }] }; }
export function solarWhere(c: Context): Prisma.SolarConfigurationWhereInput { return { AND: [{ customerId: c.q.customerId, siteId: c.q.siteId, ...(c.q.installationId ? { installationJobs: { some: { id: c.q.installationId } } } : {}) }, ...(c.user.role === 'SALES' ? [{ lead: leadScope(c.user) }] : c.user.role === 'TECHNICIAN' ? [{ survey: { assignedToId: c.user.id } }] : []), ...(c.q.technicianId ? [{ survey: { assignedToId: c.q.technicianId } }] : [])] }; }
export function installationWhere(c: Context): Prisma.InstallationJobWhereInput { return { AND: [installationScope(c.user), { id: c.q.installationId, customerId: c.q.customerId, siteId: c.q.siteId, ...(c.q.technicianId ? { assignments: { some: { userId: c.q.technicianId } } } : {}) }] }; }
export function warrantyWhere(c: Context): Prisma.WarrantyRegistrationWhereInput { return { installation: warrantyProjects(c.user), customerId: c.q.customerId, siteId: c.q.siteId, installationId: c.q.installationId }; }
export function serviceWhere(c: Context): Prisma.ServiceTicketWhereInput { return { AND: [serviceScope(c.user), { customerId: c.q.customerId, siteId: c.q.siteId, installationId: c.q.installationId, ...(c.q.technicianId ? { assignments: { some: { userId: c.q.technicianId, endedAt: null } } } : {}) }] }; }
export function technicianWhere(c: Context): Prisma.UserWhereInput { return { role: 'TECHNICIAN', AND: [...(c.user.role === 'TECHNICIAN' ? [{ id: c.user.id }] : []), ...(c.q.technicianId ? [{ id: c.q.technicianId }] : [])] }; }
export function financeCustomerWhere(c: Context): Prisma.CustomerWhereInput { return { AND: [financeCustomers(c.user), { id: c.q.customerId }] }; }
export function financeOrderWhere(c: Context): Prisma.FinanceSalesOrderWhereInput { return { customer: financeCustomerWhere(c), siteId: c.q.siteId, installationId: c.q.installationId, currency: c.q.currency }; }
export function financeQuoteWhere(c: Context): Prisma.FinanceQuotationWhereInput { return { customer: financeCustomerWhere(c), siteId: c.q.siteId, currency: c.q.currency, ...(c.q.installationId ? { OR: [{ configuration: { installationJobs: { some: { id: c.q.installationId } } } }, { serviceCharge: { serviceTicket: { installationId: c.q.installationId } } }] } : {}) }; }
