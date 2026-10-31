import { randomUUID } from 'node:crypto';
import { Prisma, type LeadStatus } from '@prisma/client';
import { z } from 'zod';
import { atomic, type Transaction } from '../../lib/db.js';
import { ApiError, pagination } from '../../lib/http.js';
import { publicUser, type Principal } from '../auth/auth.js';
import { checkVersion, leadScope, requireCustomer, requireLead, requireSite } from './access.js';
import { openStatuses } from './customers.service.js';
import * as v from './validation.js';
import { activeSurveyStatuses } from '../surveys/policy.js';

export const transitions: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST', 'DISQUALIFIED'],
  CONTACTED: ['QUALIFIED', 'LOST', 'DISQUALIFIED'],
  QUALIFIED: ['SURVEY_REQUESTED', 'LOST', 'DISQUALIFIED'],
  SURVEY_REQUESTED: ['QUALIFIED', 'LOST', 'DISQUALIFIED'],
  LOST: ['CONTACTED'],
  DISQUALIFIED: ['CONTACTED'],
};
const terminal = (status: LeadStatus) => status === 'LOST' || status === 'DISQUALIFIED';

function requireOpen(status: LeadStatus) {
  if (terminal(status)) throw new ApiError(409, 'LEAD_CLOSED', 'Reopen the lead before editing or assigning it');
}
function validateFollowUp(value?: Date | null) {
  if (value && value <= new Date()) throw new ApiError(422, 'FOLLOW_UP_IN_PAST', 'Newly scheduled follow-ups must be in the future');
}
async function validateSalesperson(tx: Transaction, user: Principal, assignedToId: string | null) {
  if (user.role !== 'ADMIN' && assignedToId !== user.id) throw new ApiError(403, 'ASSIGNMENT_FORBIDDEN', 'Salespeople may assign only to themselves');
  if (assignedToId) {
    const target = await tx.user.findFirst({ where: { id: assignedToId, role: 'SALES', isActive: true }, select: { id: true } });
    if (!target) throw new ApiError(422, 'INVALID_SALESPERSON', 'Choose an active SALES user');
  }
}
async function auditNote(tx: Transaction, user: Principal, leadId: string, description: string) {
  await tx.leadActivity.create({ data: { leadId, actorId: user.id, type: 'NOTE', description } });
}

export function createLead(user: Principal, input: z.infer<typeof v.createLead>) {
  return atomic(async tx => {
    await requireCustomer(tx, user, input.customerId, true);
    await requireSite(tx, input.customerId, input.siteId);
    validateFollowUp(input.nextFollowUpAt);
    const assignedToId = input.assignedToId === undefined ? (user.role === 'SALES' ? user.id : null) : input.assignedToId;
    // An explicitly unassigned new lead remains owned by its creator.
    if (assignedToId !== null || user.role === 'ADMIN') await validateSalesperson(tx, user, assignedToId);
    const lead = await tx.lead.create({ data: { ...input, assignedToId, reference: `LED-${randomUUID()}`, createdById: user.id } });
    await tx.leadStatusHistory.create({ data: { leadId: lead.id, actorId: user.id, fromStatus: null, toStatus: 'NEW', reason: 'Customer enquiry created' } });
    await auditNote(tx, user, lead.id, 'Lead created from customer enquiry');
    return lead;
  });
}

export function listLeads(user: Principal, query: z.infer<typeof v.leadQuery>) {
  return atomic(async tx => {
    const { page, pageSize, q, status, source, priority, customerId, siteId, assignedToId, followUp } = query;
    const now = new Date();
    const where: Prisma.LeadWhereInput = { AND: [leadScope(user), {
      status, source, priority, customerId, siteId, assignedToId,
      ...(q ? { OR: [
        { reference: { contains: q, mode: 'insensitive' } }, { customer: { name: { contains: q, mode: 'insensitive' } } },
        { site: { name: { contains: q, mode: 'insensitive' } } }, { qualificationNotes: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    }, ...(followUp ? [{ status: { in: [...openStatuses] }, nextFollowUpAt: followUp === 'overdue' ? { lt: now } : { gte: now, lte: new Date(now.getTime() + 7 * 86400_000) } }] : [])] };
    const total = await tx.lead.count({ where });
    const data = await tx.lead.findMany({ where, include: { assignedTo: { select: publicUser }, customer: { select: { id: true, reference: true, name: true } }, site: { select: { id: true, name: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}

export function leadDetail(user: Principal, id: string) {
  return atomic(async tx => {
    await requireLead(tx, user, id);
    const lead = await tx.lead.findUniqueOrThrow({ where: { id }, include: {
      customer: true, site: true, assignedTo: { select: publicUser }, createdBy: { select: publicUser },
      activities: { take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { actor: { select: publicUser } } },
      statusHistory: { take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { actor: { select: publicUser } } },
      _count: { select: { activities: true, statusHistory: true } },
    } });
    const { _count, ...data } = lead;
    return { ...data, activitiesPagination: pagination(1, 20, _count.activities), historyPagination: pagination(1, 20, _count.statusHistory) };
  });
}

export function updateLead(user: Principal, id: string, input: z.infer<typeof v.updateLead>) {
  return atomic(async tx => {
    const current = await requireLead(tx, user, id, true);
    checkVersion(current.version, input.version);
    requireOpen(current.status);
    validateFollowUp(input.nextFollowUpAt);
    if (input.siteId) {
      await requireSite(tx, current.customerId, input.siteId);
      if (input.siteId !== current.siteId && await tx.siteSurvey.count({ where: { leadId: id } })) throw new ApiError(409, 'SURVEY_SITE_LOCKED', 'Survey history fixes this lead installation site; create a separate lead for another site');
    }
    if (['QUALIFIED', 'SURVEY_REQUESTED'].includes(current.status) && input.qualificationNotes === null) {
      throw new ApiError(422, 'QUALIFICATION_REQUIRED', 'Qualified leads must retain qualification notes');
    }
    const { version, ...fields } = input;
    const lead = await tx.lead.update({ where: { id, version }, data: { ...fields, version: { increment: 1 } } });
    await auditNote(tx, user, id, `Lead fields updated: ${Object.keys(fields).sort().join(', ')}`);
    if (fields.nextFollowUpAt !== undefined) {
      await tx.leadActivity.create({ data: { leadId: id, actorId: user.id, type: 'FOLLOW_UP', description: fields.nextFollowUpAt ? `Follow-up scheduled for ${fields.nextFollowUpAt.toISOString()}` : 'Follow-up schedule cleared' } });
    }
    return lead;
  });
}

export function assignLead(user: Principal, id: string, input: z.infer<typeof v.assignLead>) {
  return atomic(async tx => {
    const current = await requireLead(tx, user, id, true);
    checkVersion(current.version, input.version);
    requireOpen(current.status);
    await validateSalesperson(tx, user, input.assignedToId);
    const lead = await tx.lead.update({ where: { id, version: input.version }, data: { assignedToId: input.assignedToId, version: { increment: 1 } } });
    await auditNote(tx, user, id, `Salesperson assignment changed from ${current.assignedToId ?? 'unassigned'} to ${input.assignedToId ?? 'unassigned'}`);
    return lead;
  });
}

export function changeStatus(user: Principal, id: string, input: z.infer<typeof v.changeStatus>) {
  return atomic(async tx => {
    const current = await requireLead(tx, user, id, true);
    checkVersion(current.version, input.version);
    if (!transitions[current.status].includes(input.status)) throw new ApiError(409, 'INVALID_TRANSITION', `Cannot move from ${current.status} to ${input.status}`);
    if (current.status === 'SURVEY_REQUESTED' && await tx.siteSurvey.count({ where: { leadId: id, status: { in: activeSurveyStatuses } } })) throw new ApiError(409, 'ACTIVE_SURVEY_EXISTS', 'Finish or cancel active surveys before changing the lead status');
    if (terminal(current.status) && user.role !== 'ADMIN') throw new ApiError(403, 'REOPEN_FORBIDDEN', 'Only ADMIN may reopen a closed lead');
    if ((terminal(current.status) || terminal(input.status)) && !input.reason) throw new ApiError(422, 'REASON_REQUIRED', 'A reason is required for closing or reopening');
    if (input.status === 'QUALIFIED' && !current.qualificationNotes) throw new ApiError(422, 'QUALIFICATION_REQUIRED', 'Add qualification notes before qualifying');
    const lead = await tx.lead.update({ where: { id, version: input.version }, data: {
      status: input.status, version: { increment: 1 }, closedReason: terminal(input.status) ? input.reason! : null,
      ...(terminal(input.status) ? { nextFollowUpAt: null } : {}),
    } });
    await tx.leadStatusHistory.create({ data: { leadId: id, actorId: user.id, fromStatus: current.status, toStatus: input.status, reason: input.reason } });
    return lead;
  });
}

export function createActivity(user: Principal, id: string, input: z.infer<typeof v.createActivity>) {
  return atomic(async tx => {
    await requireLead(tx, user, id, true);
    return tx.leadActivity.create({ data: { ...input, leadId: id, actorId: user.id } });
  });
}

export function leadTimeline(user: Principal, id: string, query: z.infer<typeof v.timelineQuery>, kind: 'activities' | 'history') {
  return atomic(async tx => {
    await requireLead(tx, user, id);
    const { page, pageSize } = query;
    const args = { where: { leadId: id }, include: { actor: { select: publicUser } }, orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }], skip: (page - 1) * pageSize, take: pageSize };
    const total = kind === 'activities' ? await tx.leadActivity.count({ where: args.where }) : await tx.leadStatusHistory.count({ where: args.where });
    const data = kind === 'activities' ? await tx.leadActivity.findMany(args) : await tx.leadStatusHistory.findMany(args);
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
