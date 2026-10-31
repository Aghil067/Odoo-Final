import { randomUUID } from 'node:crypto';
import type { SolarConfiguration } from '@prisma/client';
import { z } from 'zod';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { Decimal, json, requireConfiguration, saveConfiguration, solarAtomic } from './common.js';
import { checkQuantity } from './catalog.service.js';
import { calculate } from './calculations.js';
import * as v from './validation.js';

const maximumMoney = new Decimal('9999999999999999999999.99');
export async function calculationData(tx: Transaction, configuration: SolarConfiguration) {
  const bom = await tx.billOfMaterials.findUniqueOrThrow({ where: { configurationId: configuration.id }, include: { lines: { orderBy: { position: 'asc' } } } });
  const components = await tx.solarComponent.findMany({ where: { id: { in: bom.lines.map(line => line.componentId) } } });
  const report = calculate(configuration, bom.lines, components);
  if (!new Decimal(report.calculations.totalEstimatedMaterialCost).eq(bom.totalEstimatedMaterialCost) || bom.lines.some(line => line.currency !== bom.currency)) {
    report.findings.push({ severity: 'BLOCKER', code: 'BOM_HEADER_MISMATCH', message: 'Header amount/currency must match the server-calculated snapshot lines' });
    report.blockingErrors += 1;
  }
  return { bom, report, derived: { calculatedDcCapacityKw: report.calculations.totalPanelDcCapacityKw, inverterAcCapacityKw: report.calculations.totalInverterAcCapacityKw, batteryNominalEnergyKwh: report.calculations.batteryNominalEnergyKwh, validationReport: json(report) } };
}
export async function rebuildBom(tx: Transaction, configuration: SolarConfiguration, currency: string, input: z.infer<typeof v.bomLine>[], initial = false) {
  if (new Set(input.map(line => line.componentId)).size !== input.length) throw new ApiError(422, 'DUPLICATE_BOM_COMPONENT', 'Each component appears once; combine its quantity');
  const components = await tx.solarComponent.findMany({ where: { id: { in: input.map(line => line.componentId) } } });
  let bom = await tx.billOfMaterials.findUnique({ where: { configurationId: configuration.id } });
  if (!bom) bom = await tx.billOfMaterials.create({ data: { reference: `BOM-${randomUUID()}`, configurationId: configuration.id, currency } });
  let total = new Decimal(0);
  const lines = input.map((line, position) => {
    const component = components.find(row => row.id === line.componentId);
    if (!component?.isActive) throw new ApiError(422, 'INACTIVE_COMPONENT', 'Select active catalog components');
    if (component.version !== line.componentVersion) throw new ApiError(409, 'COMPONENT_VERSION_CONFLICT', 'Catalog changed; reselect the current component version');
    if (component.currency !== currency) throw new ApiError(422, 'CURRENCY_MISMATCH', 'All components must use the BOM currency; no implicit FX conversion');
    if (component.unit !== line.unit) throw new ApiError(422, 'UNIT_MISMATCH', 'Use the component catalog unit');
    checkQuantity(line.unit, line.quantity, component.category);
    const lineTotal = new Decimal(line.quantity).mul(component.unitCost).toDecimalPlaces(2);
    total = total.plus(lineTotal);
    if (lineTotal.gt(maximumMoney) || total.gt(maximumMoney)) throw new ApiError(422, 'BOM_TOTAL_OUT_OF_RANGE', 'Material estimate exceeds supported monetary precision');
    return { bomId: bom!.id, componentId: component.id, componentVersion: component.version, skuSnapshot: component.sku, descriptionSnapshot: `${component.name}${component.description ? ': ' + component.description : ''}`, componentSnapshot: json(component), category: component.category, quantity: line.quantity, unit: line.unit, unitCostSnapshot: component.unitCost, currency, lineTotal, technicalNotes: line.technicalNotes, position };
  });
  await tx.bOMLine.deleteMany({ where: { bomId: bom.id } });
  if (lines.length) await tx.bOMLine.createMany({ data: lines });
  await tx.billOfMaterials.update({ where: { id: bom.id }, data: { totalEstimatedMaterialCost: total, ...(initial ? {} : { version: { increment: 1 } }) } });
  return calculationData(tx, configuration);
}
export function replaceBom(user: Principal, id: string, input: z.infer<typeof v.bomReplace>) {
  return solarAtomic(async tx => {
    const current = await requireConfiguration(tx, user, id, input.version, true);
    const header = await tx.billOfMaterials.findUniqueOrThrow({ where: { configurationId: id } });
    const result = await rebuildBom(tx, current, header.currency, input.lines);
    const configuration = await saveConfiguration(tx, user, current, result.derived, 'BOM_UPDATED', input.reason, { bomId: result.bom.id, bomVersion: result.bom.version });
    return { configuration, bom: result.bom, validation: result.report };
  });
}
export function regenerateBom(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return solarAtomic(async tx => {
    const current = await requireConfiguration(tx, user, id, input.version, true);
    const header = await tx.billOfMaterials.findUniqueOrThrow({ where: { configurationId: id }, include: { lines: { orderBy: { position: 'asc' } } } });
    const components = await tx.solarComponent.findMany({ where: { id: { in: header.lines.map(line => line.componentId) } } });
    const result = await rebuildBom(tx, current, header.currency, header.lines.map(line => ({ componentId: line.componentId, componentVersion: components.find(component => component.id === line.componentId)?.version ?? line.componentVersion, quantity: line.quantity.toString(), unit: line.unit, technicalNotes: line.technicalNotes })));
    const configuration = await saveConfiguration(tx, user, current, result.derived, 'BOM_REFRESHED', input.reason, { bomVersion: result.bom.version });
    return { configuration, bom: result.bom, validation: result.report };
  });
}
export function validateConfiguration(user: Principal, id: string, input: z.infer<typeof v.command>) {
  return solarAtomic(async tx => {
    const current = await requireConfiguration(tx, user, id, input.version, true);
    const result = await calculationData(tx, current);
    const configuration = await saveConfiguration(tx, user, current, result.derived, 'VALIDATED', input.reason);
    return { configuration, validation: result.report };
  });
}
