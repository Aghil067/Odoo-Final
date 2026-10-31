import type { SolarComponentCategory, SolarUnit } from '@prisma/client';
import { z } from 'zod';
import type { Transaction } from '../../lib/db.js';
import { ApiError, pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { Decimal, admin, json, solarAtomic } from './common.js';
import * as v from './validation.js';

export function checkQuantity(unit: SolarUnit, value: string, category: SolarComponentCategory) {
  const quantity = new Decimal(value);
  if (['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER'].includes(category) && unit !== 'PCS') throw new ApiError(422, 'INVALID_COMPONENT_UNIT', 'Panels, inverters, batteries and controllers use PCS');
  if (['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER'].includes(category) && quantity.gt(1000000)) throw new ApiError(422, 'QUANTITY_OUT_OF_RANGE', 'At most 1000000 power-device units per BOM line');
  if (['PCS', 'SET', 'PAIR'].includes(unit) && !quantity.isInteger()) throw new ApiError(422, 'FRACTIONAL_DISCRETE_QUANTITY', 'Counted units require whole positive quantities');
  if (!quantity.gt(0)) throw new ApiError(422, 'INVALID_QUANTITY', 'Quantity must be positive');
}
export function createComponent(user: Principal, input: z.infer<typeof v.componentCreate>) {
  return solarAtomic(async tx => {
    admin(user); checkQuantity(input.unit, '1', input.category);
    return tx.solarComponent.create({ data: { ...input, specifications: json(v.parseSpecifications(input.category, input.specifications)), createdById: user.id } });
  });
}
export function updateComponent(user: Principal, id: string, input: z.infer<typeof v.componentUpdate>) {
  return solarAtomic(async tx => {
    admin(user);
    const current = await tx.solarComponent.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Component not found');
    if (current.version !== input.version) throw new ApiError(409, 'VERSION_CONFLICT', 'Component changed; refresh');
    const { version, reason, specifications, ...fields } = input;
    return tx.solarComponent.update({ where: { id, version }, data: { ...fields, lastChangeReason: reason, ...(specifications === undefined ? {} : { specifications: json(v.parseSpecifications(current.category, specifications)) }), version: { increment: 1 } } });
  });
}
export function listComponents(user: Principal, query: z.infer<typeof v.componentQuery>) {
  return solarAtomic(async tx => {
    const { page, pageSize, q } = query;
    const where = { category: query.category, isActive: query.active === 'true', ...(q ? { OR: [{ sku: { contains: q, mode: 'insensitive' as const } }, { name: { contains: q, mode: 'insensitive' as const } }, { manufacturer: { contains: q, mode: 'insensitive' as const } }] } : {}) };
    const total = await tx.solarComponent.count({ where });
    const data = await tx.solarComponent.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
export function componentDetail(id: string) { return solarAtomic(async tx => { const row = await tx.solarComponent.findUnique({ where: { id } }); if (!row) throw new ApiError(404, 'NOT_FOUND', 'Component not found'); return row; }); }

async function checkTemplateLines(tx: Transaction, lines: z.infer<typeof v.templateLine>[]) {
  if (new Set(lines.map(line => line.componentId)).size !== lines.length || new Set(lines.map(line => line.position)).size !== lines.length) throw new ApiError(422, 'DUPLICATE_TEMPLATE_LINE', 'Each component and position appears once per template');
  const components = await tx.solarComponent.findMany({ where: { id: { in: lines.map(line => line.componentId) } } });
  for (const line of lines) {
    const component = components.find(row => row.id === line.componentId);
    if (!component?.isActive) throw new ApiError(422, 'INACTIVE_COMPONENT', 'Template lines must reference active catalog components');
    if (component.unit !== line.unit) throw new ApiError(422, 'UNIT_MISMATCH', 'Template units must match the catalog');
    checkQuantity(line.unit, line.defaultQuantity, component.category);
  }
}
function checkRange(min: string, nominal: string, max: string) {
  if (new Decimal(min).gt(nominal) || new Decimal(nominal).gt(max)) throw new ApiError(422, 'INVALID_CAPACITY_RANGE', 'Require minimum <= nominal <= maximum capacity');
}
async function snapshotTemplate(tx: Transaction, user: Principal, id: string, reason: string) {
  const template = await tx.solarSystemTemplate.findUniqueOrThrow({ where: { id }, include: { components: { orderBy: { position: 'asc' }, include: { component: true } } } });
  await tx.solarTemplateRevision.create({ data: { templateId: id, version: template.version, actorId: user.id, snapshot: json(template), reason } });
  return template;
}
export function createTemplate(user: Principal, input: z.infer<typeof v.templateCreate>) {
  return solarAtomic(async tx => {
    admin(user); checkRange(input.minimumCapacityKw, input.nominalCapacityKw, input.maximumCapacityKw);
    await checkTemplateLines(tx, input.components);
    const { components, validationPolicy, ...fields } = input;
    const template = await tx.solarSystemTemplate.create({ data: { ...fields, validationPolicy: json(validationPolicy), createdById: user.id, components: { create: components } } });
    return snapshotTemplate(tx, user, template.id, 'Template created');
  });
}
export function updateTemplate(user: Principal, id: string, input: z.infer<typeof v.templateUpdate>) {
  return solarAtomic(async tx => {
    admin(user);
    const current = await tx.solarSystemTemplate.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Template not found');
    if (current.version !== input.version) throw new ApiError(409, 'VERSION_CONFLICT', 'Template changed; refresh');
    checkRange(input.minimumCapacityKw ?? current.minimumCapacityKw.toString(), input.nominalCapacityKw ?? current.nominalCapacityKw.toString(), input.maximumCapacityKw ?? current.maximumCapacityKw.toString());
    if (input.components) await checkTemplateLines(tx, input.components);
    const { version, reason, components, validationPolicy, ...fields } = input;
    await tx.solarSystemTemplate.update({ where: { id, version }, data: { ...fields, ...(validationPolicy ? { validationPolicy: json(validationPolicy) } : {}), version: { increment: 1 } } });
    if (components) { await tx.solarTemplateComponent.deleteMany({ where: { templateId: id } }); await tx.solarTemplateComponent.createMany({ data: components.map(line => ({ ...line, templateId: id })) }); }
    return snapshotTemplate(tx, user, id, reason);
  });
}
export function listTemplates(query: z.infer<typeof v.templateQuery>) {
  return solarAtomic(async tx => {
    const { page, pageSize, q } = query;
    const where = { systemType: query.systemType, isActive: query.active === 'true', ...(q ? { OR: [{ code: { contains: q, mode: 'insensitive' as const } }, { name: { contains: q, mode: 'insensitive' as const } }] } : {}) };
    const total = await tx.solarSystemTemplate.count({ where });
    const data = await tx.solarSystemTemplate.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
    return { data, pagination: pagination(page, pageSize, total) };
  });
}
export function templateDetail(id: string) { return solarAtomic(async tx => { const row = await tx.solarSystemTemplate.findUnique({ where: { id }, include: { components: { orderBy: { position: 'asc' }, include: { component: true } } } }); if (!row) throw new ApiError(404, 'NOT_FOUND', 'Template not found'); return row; }); }
export function templateRevision(id: string, version: number) { return solarAtomic(async tx => { const row = await tx.solarTemplateRevision.findUnique({ where: { templateId_version: { templateId: id, version } } }); if (!row) throw new ApiError(404, 'NOT_FOUND', 'Template revision not found'); return row; }); }
