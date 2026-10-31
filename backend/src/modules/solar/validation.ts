import { z } from 'zod';
import { SolarComponentCategory, SolarConfigurationStatus, SolarPhase, SolarReviewDecision, SolarUnit } from '@prisma/client';
import { pageQuery, uuid } from '../crm/validation.js';

export const text = (max = 2000) => z.string().trim().min(1).max(max);
export const version = z.number().int().min(1).max(2147483646);
export const reason = text();
export const idParams = z.strictObject({ id: uuid });
export const revisionParams = z.strictObject({ id: uuid, revision: z.coerce.number().int().min(1).max(2147483647) });
export const page = pageQuery.strict();
export const currency = z.enum(['INR', 'USD', 'EUR', 'GBP']);
export const systemType = z.enum(['ON_GRID', 'OFF_GRID']);
export const decimal = z.string().max(16).regex(/^(0|[1-9]\d{0,8})(\.\d{1,4})?$/);
export const positive = decimal.refine(value => Number(value) > 0, 'Must be positive');
const bounded = (max: number) => positive.refine(value => Number(value) <= max, `Must be at most ${max}`);
export const quantity = z.string().regex(/^(0|[1-9]\d{0,8})(\.\d{1,3})?$/).refine(value => Number(value) > 0, 'Must be positive');
export const capacity = z.string().regex(/^(0|[1-9]\d{0,6})(\.\d{1,3})?$/).refine(value => Number(value) > 0, 'Must be positive');
const money = z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,4})?$/);
const code = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/).transform(value => value.toUpperCase());
const strings = z.array(text(100)).min(1).max(20).refine(values => new Set(values).size === values.length, 'Duplicate values');
const pv = {
  mpptInputs: z.number().int().min(1).max(32).optional(), maxDcVoltageV: bounded(10000).optional(),
  minMpptVoltageV: bounded(10000).optional(), maxMpptVoltageV: bounded(10000).optional(),
  maxInputCurrentPerMpptA: bounded(100000).optional(), maxIscPerMpptA: bounded(100000).optional(),
};
const batteryInput = { batteryVoltageMinV: bounded(10000).optional(), batteryVoltageMaxV: bounded(10000).optional(), supportedBatteryChemistries: strings.optional() };
export const panelSpecs = z.strictObject({ ratedPowerW: bounded(10000).optional(), vmpV: bounded(10000).optional(), vocV: bounded(10000).optional(), impA: bounded(100000).optional(), iscA: bounded(100000).optional(), efficiencyPercent: bounded(100).optional() });
export const inverterSpecs = z.strictObject({ ...pv, ...batteryInput, ratedAcPowerKw: bounded(100000).optional(), maxPvPowerW: bounded(100000000).optional(), supportedSystemTypes: z.array(systemType).min(1).max(2).refine(values => new Set(values).size === values.length).optional(), phase: z.enum(SolarPhase).optional(), integratedChargeController: z.boolean().optional(), maxChargeCurrentA: bounded(100000).optional(), efficiencyPercent: bounded(100).optional(), batterylessSupported: z.boolean().optional(), externalControllerSupported: z.boolean().optional() });
export const batterySpecs = z.strictObject({ nominalVoltageV: bounded(10000).optional(), minimumOperatingVoltageV: bounded(10000).optional(), maximumChargeVoltageV: bounded(10000).optional(), capacityAh: bounded(1000000).optional(), nominalEnergyKwh: bounded(100000).optional(), chemistry: text(100).optional(), maxChargeCurrentA: bounded(100000).optional(), maxDischargeCurrentA: bounded(100000).optional() });
export const controllerSpecs = z.strictObject({ ...pv, ...batteryInput, maxPvPowerW: bounded(100000000).optional(), maxChargeCurrentA: bounded(100000).optional() });
export const otherSpecs = z.strictObject({ notes: text().optional() });
export function parseSpecifications(category: SolarComponentCategory, input: unknown) {
  const parsed = category === 'SOLAR_PANEL' ? panelSpecs.parse(input) : category === 'INVERTER' ? inverterSpecs.parse(input) : category === 'BATTERY' ? batterySpecs.parse(input) : category === 'CHARGE_CONTROLLER' ? controllerSpecs.parse(input) : otherSpecs.parse(input);
  const record = parsed as Record<string, unknown>;
  for (const [low, high] of [['minMpptVoltageV', 'maxMpptVoltageV'], ['maxMpptVoltageV', 'maxDcVoltageV'], ['batteryVoltageMinV', 'batteryVoltageMaxV'], ['minimumOperatingVoltageV', 'nominalVoltageV'], ['nominalVoltageV', 'maximumChargeVoltageV'], ['minimumOperatingVoltageV', 'maximumChargeVoltageV'], ['vmpV', 'vocV'], ['impA', 'iscA']]) {
    if (typeof record[low!] === 'string' && typeof record[high!] === 'string' && Number(record[low!]) > Number(record[high!])) throw new z.ZodError([{ code: 'custom', path: ['specifications', high!], message: `${high} must be at least ${low}` }]);
  }
  return parsed;
}
export const componentCreate = z.strictObject({ sku: code, name: text(160), category: z.enum(SolarComponentCategory), manufacturer: text(160).nullable().optional(), modelNumber: text(160).nullable().optional(), description: text().nullable().optional(), specifications: z.unknown(), specificationSource: text().nullable().optional(), unit: z.enum(SolarUnit), unitCost: money, currency, warrantyMonths: z.number().int().min(0).max(600).nullable().optional(), serializationRequired: z.boolean().default(false) });
export const componentUpdate = componentCreate.omit({ sku: true, category: true, unit: true, serializationRequired: true }).partial().extend({ version, reason, serializationRequired: z.boolean().optional(), isActive: z.boolean().optional() }).refine(value => Object.keys(value).length > 2, 'Supply an editable field');
export const archive = z.strictObject({ version, reason });
export const componentQuery = pageQuery.extend({ q: text(160).optional(), category: z.enum(SolarComponentCategory).optional(), active: z.enum(['true', 'false']).default('true') }).strict();
export const policy = z.strictObject({
  capacityTolerancePercent: decimal.refine(value => Number(value) <= 100), minDcAcRatio: positive, maxDcAcRatio: positive,
  voltageHeadroomPercent: decimal.refine(value => Number(value) < 100), batteryRequired: z.boolean(),
  requiredCategories: z.array(z.enum(SolarComponentCategory)).min(1).max(13).refine(values => new Set(values).size === values.length, 'Duplicate required categories'),
  pvInputMode: z.enum(['INVERTER', 'EXTERNAL_CONTROLLER']), basis: text(),
}).refine(value => Number(value.minDcAcRatio) <= Number(value.maxDcAcRatio), 'Minimum DC/AC ratio cannot exceed maximum');
export const templateLine = z.strictObject({ componentId: uuid, defaultQuantity: quantity, unit: z.enum(SolarUnit), required: z.boolean(), notes: text(1000).nullable().optional(), position: z.number().int().min(0).max(10000) });
export const templateCreate = z.strictObject({ code, name: text(160), description: text().nullable().optional(), systemType, nominalCapacityKw: capacity, minimumCapacityKw: capacity, maximumCapacityKw: capacity, validationPolicy: policy, components: z.array(templateLine).min(1).max(100) });
export const templateUpdate = templateCreate.omit({ code: true }).partial().extend({ version, reason, isActive: z.boolean().optional() }).refine(value => Object.keys(value).length > 2, 'Supply an editable field');
export const templateQuery = pageQuery.extend({ q: text(160).optional(), systemType: systemType.optional(), active: z.enum(['true', 'false']).default('true') }).strict();
export const arrayDesign = z.strictObject({ panelComponentId: uuid, deviceComponentId: uuid, deviceUnit: z.number().int().min(1).max(1000000), mpptInput: z.number().int().min(1).max(32), seriesPanels: z.number().int().min(1).max(10000), parallelStrings: z.number().int().min(1).max(10000), coldVocPerPanelV: positive, hotVmpPerPanelV: positive, maximumVmpPerPanelV: positive, operatingCurrentPerStringA: positive, shortCircuitCurrentPerStringA: positive, basis: text() });
export const batteryBank = z.strictObject({ componentId: uuid, seriesUnits: z.number().int().min(1).max(10000), parallelStrings: z.number().int().min(1).max(10000) });
export const electricalDesign = z.strictObject({ arrays: z.array(arrayDesign).max(100), batteryBank: batteryBank.nullable() });
export const configurationCreate = z.strictObject({ name: text(160), approvedSurveyId: uuid, approvedSurveyVersion: version, surveyReviewId: uuid, templateId: uuid.optional(), templateVersion: version.optional(), systemType, outputPhase: z.enum(SolarPhase), targetCapacityKw: capacity, currency, technicalAssumptions: text(5000), conditionalWorkRequirements: text(5000).nullable().optional(), validationPolicy: policy.optional(), electricalDesign: electricalDesign.optional(), previousConfigurationId: uuid.optional(), reason });
export const configurationUpdate = z.strictObject({ version, reason, name: text(160).optional(), targetCapacityKw: capacity.optional(), technicalAssumptions: text(5000).optional(), conditionalWorkRequirements: text(5000).nullable().optional(), validationPolicy: policy.optional(), electricalDesign: electricalDesign.optional() }).refine(value => Object.keys(value).length > 2, 'Supply an editable field');
export const bomLine = z.strictObject({ componentId: uuid, componentVersion: version, quantity, unit: z.enum(SolarUnit), technicalNotes: text(1000).nullable().optional() });
export const bomReplace = z.strictObject({ version, reason, lines: z.array(bomLine).min(1).max(100) });
export const command = z.strictObject({ version, reason });
export const checklist = z.strictObject({ compatibilityReviewed: z.boolean(), costingReviewed: z.boolean(), assumptionsReviewed: z.boolean(), surveyConditionsAcknowledged: z.boolean(), designLimitationsAcknowledged: z.boolean() });
export const review = z.strictObject({ version, decision: z.enum(SolarReviewDecision), notes: text(5000), checklist: checklist.optional() });
export const configurationQuery = pageQuery.extend({ q: text(160).optional(), status: z.enum(SolarConfigurationStatus).optional(), leadId: uuid.optional(), siteId: uuid.optional(), approvedSurveyId: uuid.optional() }).strict();
