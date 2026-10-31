import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError, pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { designer, handoff, json, requireConfiguration, saveConfiguration, scope, solarAtomic } from './common.js';
import { calculationData, rebuildBom } from './bom.service.js';
import * as v from './validation.js';

export function createConfiguration(user: Principal, input: z.infer<typeof v.configurationCreate>) {
  return solarAtomic(async tx => {
    designer(user);
    const survey = await handoff(tx, user, input);
    if (survey.recommendedSystemType !== input.systemType) throw new ApiError(422, 'SURVEY_SYSTEM_TYPE_MISMATCH', 'Select the approved survey system recommendation');
    let seriesId: string = randomUUID();
    let revisionNumber = 1;
    if (input.previousConfigurationId) {
      const previous = await requireConfiguration(tx, user, input.previousConfigurationId);
      if (!['APPROVED', 'REJECTED', 'ARCHIVED'].includes(previous.status)) throw new ApiError(409, 'PREVIOUS_CONFIGURATION_NOT_TERMINAL', 'Finish or archive the prior revision first');
      if (previous.leadId !== survey.leadId || previous.siteId !== survey.siteId || previous.customerId !== survey.customerId) throw new ApiError(422, 'REVISION_OWNERSHIP_MISMATCH', 'Revisions must retain lead, site and customer identity');
      if (await tx.solarConfiguration.count({ where: { previousConfigurationId: previous.id } })) throw new ApiError(409, 'CONFIGURATION_SUPERSEDED', 'Revise the latest configuration in the series');
      seriesId = previous.seriesId; revisionNumber = previous.revisionNumber + 1;
    }
    if (!!input.templateId !== !!input.templateVersion) throw new ApiError(422, 'TEMPLATE_VERSION_REQUIRED', 'Supply template ID and exact version together');
    const template = input.templateId ? await tx.solarSystemTemplate.findUnique({ where: { id: input.templateId }, include: { components: { orderBy: { position: 'asc' }, include: { component: true } } } }) : null;
    if (input.templateId && (!template?.isActive || template.version !== input.templateVersion)) throw new ApiError(409, 'TEMPLATE_UNAVAILABLE', 'Use a current active template version');
    if (template && (template.systemType !== input.systemType || template.minimumCapacityKw.gt(input.targetCapacityKw) || template.maximumCapacityKw.lt(input.targetCapacityKw))) throw new ApiError(422, 'TEMPLATE_INCOMPATIBLE', 'Template system type and capacity range must match');
    const validationPolicy = input.validationPolicy ?? (template ? v.policy.parse(template.validationPolicy) : undefined);
    if (!validationPolicy) throw new ApiError(422, 'POLICY_REQUIRED', 'Custom configurations need an explicit validation policy and design basis');
    const revision = template ? await tx.solarTemplateRevision.findUniqueOrThrow({ where: { templateId_version: { templateId: template.id, version: template.version } } }) : null;
    const row = await tx.solarConfiguration.create({ data: {
      reference: `CFG-${randomUUID()}`, name: input.name, seriesId, revisionNumber, previousConfigurationId: input.previousConfigurationId,
      leadId: survey.leadId, siteId: survey.siteId, customerId: survey.customerId, approvedSurveyId: input.approvedSurveyId, approvedSurveyVersion: input.approvedSurveyVersion, surveyReviewId: input.surveyReviewId, surveySnapshot: json(survey),
      templateId: template?.id, templateVersion: template?.version, templateSnapshot: revision ? revision.snapshot as Prisma.InputJsonValue : Prisma.DbNull,
      systemType: input.systemType, outputPhase: input.outputPhase, targetCapacityKw: input.targetCapacityKw, technicalAssumptions: input.technicalAssumptions, conditionalWorkRequirements: input.conditionalWorkRequirements,
      validationPolicy: json(validationPolicy), electricalDesign: json(input.electricalDesign ?? { arrays: [], batteryBank: null }), validationReport: {}, createdById: user.id,
    } });
    // Materialize server snapshots/calculations before recording the initial public version.
    const result = await rebuildBom(tx, row, input.currency, template?.components.map(line => ({ componentId: line.componentId, componentVersion: line.component.version, quantity: line.defaultQuantity.toString(), unit: line.unit, technicalNotes: line.notes })) ?? [], true);
    const configuration = await tx.solarConfiguration.update({ where: { id: row.id }, data: result.derived });
    await tx.solarConfigurationHistory.create({ data: { configurationId: row.id, actorId: user.id, event: 'CREATED', fromStatus: null, toStatus: 'DRAFT', version: 1, reason: input.reason, details: json({ previousConfigurationId: input.previousConfigurationId ?? null, templateId: template?.id ?? null, surveyReviewId: input.surveyReviewId }) } });
    return { configuration, bom: result.bom, validation: result.report };
  });
}
export function updateConfiguration(user: Principal, id: string, input: z.infer<typeof v.configurationUpdate>) {
  return solarAtomic(async tx => {
    const current = await requireConfiguration(tx, user, id, input.version, true);
    const { version: _version, reason, validationPolicy, electricalDesign, ...fields } = input;
    const proposed = { ...current, ...fields, ...(validationPolicy ? { validationPolicy: json(validationPolicy) } : {}), ...(electricalDesign ? { electricalDesign: json(electricalDesign) } : {}) };
    // Prisma model typing is retained for database-derived fields; parsed JSON is serialized.
    const result = await calculationData(tx, { ...current, ...fields, targetCapacityKw: fields.targetCapacityKw ? new Prisma.Decimal(fields.targetCapacityKw) : current.targetCapacityKw, validationPolicy: proposed.validationPolicy as Prisma.JsonValue, electricalDesign: proposed.electricalDesign as Prisma.JsonValue });
    return saveConfiguration(tx, user, current, { ...fields, ...(validationPolicy ? { validationPolicy: json(validationPolicy) } : {}), ...(electricalDesign ? { electricalDesign: json(electricalDesign) } : {}), ...result.derived }, 'DRAFT_UPDATED', reason, { fields: Object.keys(input).filter(key => !['version', 'reason'].includes(key)) });
  });
}
export function archiveConfiguration(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return solarAtomic(async tx => {
    designer(user);
    const current = await requireConfiguration(tx, user, id, input.version);
    return saveConfiguration(tx, user, current, { status: 'ARCHIVED' }, 'ARCHIVED', input.reason);
  });
}
export function listConfigurations(user: Principal, query: z.infer<typeof v.configurationQuery>) {
  return solarAtomic(async tx => {
    const { page, pageSize, q, status, leadId, siteId, approvedSurveyId } = query;
    const where: Prisma.SolarConfigurationWhereInput = { AND: [scope(user), { status, leadId, siteId, approvedSurveyId, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { reference: { contains: q, mode: 'insensitive' } }] } : {}) }] };
    const total = await tx.solarConfiguration.count({ where });
    const data = await tx.solarConfiguration.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
export function configurationDetail(user: Principal, id: string) {
  return solarAtomic(async tx => {
    await requireConfiguration(tx, user, id);
    return tx.solarConfiguration.findUniqueOrThrow({ where: { id }, include: { bom: { include: { lines: { orderBy: { position: 'asc' } } } }, nextRevision: { select: { id: true, reference: true, revisionNumber: true, status: true } } } });
  });
}
export function calculations(user: Principal, id: string) { return solarAtomic(async tx => { const row = await requireConfiguration(tx, user, id); return (await calculationData(tx, row)).report; }); }
export function history(user: Principal, id: string, query: z.infer<typeof v.page>, reviews = false) {
  return solarAtomic(async tx => {
    await requireConfiguration(tx, user, id);
    const where = { configurationId: id }, skip = (query.page - 1) * query.pageSize;
    const total = reviews ? await tx.solarConfigurationReview.count({ where }) : await tx.solarConfigurationHistory.count({ where });
    const data = reviews ? await tx.solarConfigurationReview.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take: query.pageSize }) : await tx.solarConfigurationHistory.findMany({ where, orderBy: { version: 'desc' }, skip, take: query.pageSize });
    return { data, pagination: pagination(query.page, query.pageSize, total) };
  });
}
