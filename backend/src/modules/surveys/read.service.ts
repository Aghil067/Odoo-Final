import {availabilityIn} from '../technicians/availability.service.js';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError, pagination } from '../../lib/http.js';
import { publicUser, type Principal } from '../auth/auth.js';
import { attachmentPublic, customerForVisit, requireAdmin, requireSurvey, siteForVisit, surveyScope } from './access.js';
import { activeSurveyStatuses, surveyAtomic } from './policy.js';
import * as v from './validation.js';

export function listSurveys(user: Principal, query: z.infer<typeof v.list>) {
  return surveyAtomic(async tx => {
    const { page, pageSize, q, status, leadId, siteId, customerId, assignedToId } = query;
    const where: Prisma.SiteSurveyWhereInput = { AND: [surveyScope(user), { status, leadId, siteId, customerId, assignedToId,
      ...(q ? { OR: [{ reference: { contains: q, mode: 'insensitive' } }, { site: { name: { contains: q, mode: 'insensitive' } } }, { lead: { reference: { contains: q, mode: 'insensitive' } } }, { customer: { name: { contains: q, mode: 'insensitive' } } }, { site: { city: { contains: q, mode: 'insensitive' } } }] } : {}),
    }] };
    const total = await tx.siteSurvey.count({ where });
    const data = await tx.siteSurvey.findMany({ where, include: { assignedTo: { select: publicUser }, customer: { select: customerForVisit }, site: { select: siteForVisit } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
export function surveyDetail(user: Principal, id: string) {
  return surveyAtomic(async tx => {
    await requireSurvey(tx, user, id);
    const survey = await tx.siteSurvey.findUniqueOrThrow({ where: { id }, include: {
      customer: { select: customerForVisit }, site: { select: siteForVisit }, lead: { select: { id: true, reference: true, status: true } },
      assignedTo: { select: publicUser }, requestedBy: { select: publicUser },
      roofAssessment: true, electricalAssessment: true, reassessment: { select: { id: true, reference: true, assessmentNumber: true, status: true } },
      _count: { select: { attachments: true, history: true, reviews: true } },
    } });
    const { _count, ...data } = survey;
    return { ...data, counts: _count };
  });
}
export function surveyCollection(user: Principal, id: string, query: z.infer<typeof v.page>, kind: 'attachments' | 'history' | 'reviews') {
  return surveyAtomic(async tx => {
    await requireSurvey(tx, user, id);
    const { page, pageSize } = query;
    const args = { where: { surveyId: id }, orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }], skip: (page - 1) * pageSize, take: pageSize };
    const total = kind === 'attachments' ? await tx.surveyAttachment.count({ where: args.where }) : kind === 'history' ? await tx.surveyStatusHistory.count({ where: args.where }) : await tx.surveyReview.count({ where: args.where });
    const data = kind === 'attachments' ? await tx.surveyAttachment.findMany({ ...args, select: attachmentPublic }) : kind === 'history' ? await tx.surveyStatusHistory.findMany({ ...args, include: { actor: { select: publicUser } } }) : await tx.surveyReview.findMany({ ...args, include: { reviewer: { select: publicUser } } });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
export function summary(user: Principal) {
  return surveyAtomic(async tx => {
    const scope = surveyScope(user);
    const groups = await tx.siteSurvey.groupBy({ by: ['status'], where: scope, _count: { _all: true }, orderBy: { status: 'asc' } });
    const count = (status: string) => groups.find(group => group.status === status)?._count._all ?? 0;
    return { asOf: new Date(), totalSurveys: groups.reduce((sum, group) => sum + group._count._all, 0), pendingReview: count('SUBMITTED'), approved: count('APPROVED'), revisionRequired: count('REVISION_REQUIRED'),
      unassigned: await tx.siteSurvey.count({ where: { AND: [scope, { assignedToId: null, status: { in: activeSurveyStatuses } }] } }),
      byStatus: groups.map(group => ({ status: group.status, count: group._count._all })),
    };
  });
}
export function surveyors(user: Principal, query: z.infer<typeof v.page>) {
  return surveyAtomic(async tx => {
    requireAdmin(user);
    const where = { role: 'TECHNICIAN' as const, isActive: true };
    const total = await tx.user.count({ where });
    const data = await tx.user.findMany({ where, select: publicUser, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data, pagination: pagination(query.page, query.pageSize, total) };
  });
}
export function availability(user: Principal, query: z.infer<typeof v.availability>) {
  return surveyAtomic(async tx => {
    if (user.role !== 'ADMIN' && !(user.role === 'TECHNICIAN' && user.id === query.surveyorId)) throw new ApiError(403, 'FORBIDDEN', 'Availability is visible to ADMIN or the surveyor themselves');
    const surveyor = await tx.user.findFirst({ where: { id: query.surveyorId, role: 'TECHNICIAN', isActive: true }, select: publicUser });
    if (!surveyor) throw new ApiError(404, 'NOT_FOUND', 'Active surveyor not found');
    const where = { assignedToId: query.surveyorId, status: { in: ['SCHEDULED' as const, 'IN_PROGRESS' as const] }, scheduledAt: { lt: query.to }, scheduledEndAt: { gt: query.from } };
    const total = await tx.siteSurvey.count({ where });
    const ongoingVisits = await tx.siteSurvey.count({ where: { assignedToId: query.surveyorId, status: 'IN_PROGRESS' } });
    const data = await tx.siteSurvey.findMany({ where, select: { id: true, reference: true, status: true, scheduledAt: true, scheduledEndAt: true, expectedDurationMinutes: true }, orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    const workforce=query.to.getTime()-query.from.getTime()<=7*86400000?await availabilityIn(tx,query.surveyorId,query.from,query.to,['SURVEY']):null;
    return { surveyor, from: query.from, to: query.to, available: total === 0 && ongoingVisits === 0 && workforce?.status==='AVAILABLE', workforceStatus:workforce?.status??'NEEDS_REVIEW', ongoingVisits,
      activeWorkload: await tx.siteSurvey.count({ where: { assignedToId: query.surveyorId, status: { in: activeSurveyStatuses } } }),
      appointments: { data, pagination: pagination(query.page, query.pageSize, total) },
    };
  });
}
