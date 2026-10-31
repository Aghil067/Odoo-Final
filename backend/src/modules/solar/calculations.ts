import { Prisma, type BOMLine, type SolarComponent, type SolarConfiguration } from '@prisma/client';
import { Decimal } from './common.js';
import * as v from './validation.js';

type D = Prisma.Decimal;
type RecordValue = Record<string, unknown>;
export type Finding = { severity: 'BLOCKER' | 'WARNING' | 'CONDITION'; code: string; message: string; componentId?: string };
export function record(value: unknown): RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RecordValue : {}; }
const numeric = (spec: RecordValue, key: string): D | null => typeof spec[key] === 'string' ? new Decimal(spec[key] as string) : null;
const total = (values: D[]) => values.reduce((sum, value) => sum.plus(value), new Decimal(0));
const output = (value: D | null) => value === null ? null : value.toDecimalPlaces(6).toString();

export function calculate(configuration: SolarConfiguration, lines: BOMLine[], liveComponents: SolarComponent[]) {
  const findings: Finding[] = [];
  const add = (severity: Finding['severity'], code: string, message: string, componentId?: string) => findings.push({ severity, code, message, ...(componentId ? { componentId } : {}) });
  const policy = v.policy.parse(configuration.validationPolicy);
  const design = v.electricalDesign.parse(configuration.electricalDesign);
  const survey = record(configuration.surveySnapshot);
  const surveyData = record(survey.snapshot);
  const snapshotElectrical = record(surveyData.electricalAssessment);
  const specs = new Map<string, RecordValue>();
  const byCategory = (category: string) => lines.filter(line => line.category === category);
  for (const line of lines) {
    const current = liveComponents.find(component => component.id === line.componentId);
    if (!current?.isActive) add('BLOCKER', 'INACTIVE_COMPONENT', 'A BOM component is inactive or missing from the live catalog', line.componentId);
    if (current && current.version !== line.componentVersion) add('BLOCKER', 'CATALOG_CHANGED', 'Refresh this draft BOM explicitly from the catalog before approval', line.componentId);
    if (line.currency !== (lines[0]?.currency ?? line.currency)) add('BLOCKER', 'MIXED_CURRENCY', 'A BOM cannot combine currencies', line.componentId);
    if (line.quantity.lte(0) || (['PCS', 'SET', 'PAIR'].includes(line.unit) && !line.quantity.isInteger())) add('BLOCKER', 'INVALID_QUANTITY', 'Positive whole counts are required for discrete units', line.componentId);
    const snapshot = record(line.componentSnapshot);
    try { specs.set(line.componentId, record(v.parseSpecifications(line.category, snapshot.specifications))); }
    catch { specs.set(line.componentId, {}); add('BLOCKER', 'SPECIFICATIONS_UNVERIFIED', 'Snapshot specifications cannot be verified', line.componentId); }
    if (['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER'].includes(line.category) && !snapshot.specificationSource) add('BLOCKER', 'SPECIFICATION_SOURCE_MISSING', 'Record the manufacturer specification reference', line.componentId);
    if (!new Decimal(line.quantity).mul(line.unitCostSnapshot).toDecimalPlaces(2).eq(line.lineTotal)) add('BLOCKER', 'COST_SNAPSHOT_MISMATCH', 'Stored line cost does not match its quantity and price snapshot', line.componentId);
  }
  const requiredNumeric = (line: BOMLine, key: string): D | null => {
    const value = numeric(specs.get(line.componentId) ?? {}, key);
    if (value === null) add('BLOCKER', 'COMPATIBILITY_UNVERIFIED', `Manufacturer ${key} is unavailable`, line.componentId);
    return value;
  };
  const panels = byCategory('SOLAR_PANEL'), inverters = byCategory('INVERTER'), batteries = byCategory('BATTERY'), controllers = byCategory('CHARGE_CONTROLLER');
  if (!panels.length) add('BLOCKER', 'PANELS_REQUIRED', 'Select a positive panel count');
  if (!inverters.length) add('BLOCKER', 'INVERTER_REQUIRED', 'Select an inverter');
  for (const category of policy.requiredCategories) if (!byCategory(category).length) add('BLOCKER', 'REQUIRED_CATEGORY_MISSING', `Selected design requires ${category}`);
  const template = record(configuration.templateSnapshot);
  if ((typeof template.minimumCapacityKw === 'string' && configuration.targetCapacityKw.lt(template.minimumCapacityKw)) || (typeof template.maximumCapacityKw === 'string' && configuration.targetCapacityKw.gt(template.maximumCapacityKw))) add('BLOCKER', 'TEMPLATE_CAPACITY_RANGE', 'Target capacity is outside the selected immutable template revision range');
  const templateLines = Array.isArray(template.components) ? template.components : [];
  for (const item of templateLines) {
    const required = record(item);
    if (required.required === true) {
      const line = lines.find(row => row.componentId === required.componentId);
      if (!line || line.unit !== required.unit || line.quantity.lt(String(required.defaultQuantity))) add('BLOCKER', 'REQUIRED_TEMPLATE_COMPONENT_MISSING', 'Retain each required template component and its minimum default quantity', String(required.componentId));
    }
  }
  const dcCapacity = total(panels.map(line => { const watts = requiredNumeric(line, 'ratedPowerW'); return watts ? new Decimal(watts).mul(line.quantity).div(1000) : new Decimal(0); }));
  const acCapacity = total(inverters.map(line => { const kw = requiredNumeric(line, 'ratedAcPowerKw'); return kw ? new Decimal(kw).mul(line.quantity) : new Decimal(0); }));
  const dcComplete = panels.length > 0 && panels.every(line => numeric(specs.get(line.componentId) ?? {}, 'ratedPowerW') !== null);
  const acComplete = inverters.length > 0 && inverters.every(line => numeric(specs.get(line.componentId) ?? {}, 'ratedAcPowerKw') !== null);
  const ratio = acCapacity.gt(0) ? dcCapacity.div(acCapacity) : null;
  if (!ratio || ratio.lt(policy.minDcAcRatio) || ratio.gt(policy.maxDcAcRatio)) add('BLOCKER', 'DC_AC_RATIO', 'DC/AC sizing ratio is outside the explicitly selected policy range');
  const deviation = (actual: D, expected: D) => actual.minus(expected).abs().div(expected).mul(100);
  if (deviation(dcCapacity, configuration.targetCapacityKw).gt(policy.capacityTolerancePercent)) add('BLOCKER', 'TARGET_CAPACITY_DEVIATION', 'Installed panel DC capacity is outside the target-capacity tolerance');
  const recommended = typeof survey.recommendedCapacityKw === 'string' ? new Decimal(survey.recommendedCapacityKw) : null;
  const requested = typeof surveyData.requestedCapacityKw === 'string' ? new Decimal(surveyData.requestedCapacityKw) : null;
  if (!recommended || recommended.lte(0)) add('BLOCKER', 'SURVEY_CAPACITY_UNVERIFIED', 'Approved survey recommended capacity is unavailable');
  else if (deviation(dcCapacity, recommended).gt(policy.capacityTolerancePercent)) add('BLOCKER', 'SURVEY_CAPACITY_DEVIATION', 'Panel DC capacity differs from the approved survey recommendation beyond policy tolerance');
  if (requested?.gt(0) && deviation(dcCapacity, requested).gt(policy.capacityTolerancePercent)) add('WARNING', 'CUSTOMER_REQUEST_DEVIATION', 'Proposed DC capacity differs from the original request; review the survey recommendation with sales');
  if (survey.recommendedSystemType !== configuration.systemType) add('BLOCKER', 'SURVEY_SYSTEM_TYPE_MISMATCH', 'Use the system type recommended by this approved survey');
  for (const line of inverters) {
    const spec = specs.get(line.componentId) ?? {};
    if (!Array.isArray(spec.supportedSystemTypes)) add('BLOCKER', 'COMPATIBILITY_UNVERIFIED', 'Inverter supported system types are unavailable', line.componentId);
    else if (!spec.supportedSystemTypes.includes(configuration.systemType)) add('BLOCKER', 'INVERTER_SYSTEM_TYPE', 'Inverter does not support the chosen system type', line.componentId);
    if (!spec.phase) add('BLOCKER', 'COMPATIBILITY_UNVERIFIED', 'Inverter output phase is unavailable', line.componentId);
    else if (spec.phase !== configuration.outputPhase) add('BLOCKER', 'INVERTER_PHASE', 'Inverter output phase does not match the design', line.componentId);
  }
  if (configuration.systemType === 'ON_GRID') {
    if (snapshotElectrical.supplyPhase === 'UNKNOWN' || !snapshotElectrical.supplyPhase) add('BLOCKER', 'GRID_PHASE_UNVERIFIED', 'Obtain a reviewed grid phase before approving an on-grid design');
    else if (snapshotElectrical.supplyPhase !== configuration.outputPhase) add('BLOCKER', 'GRID_PHASE_MISMATCH', 'Design phase differs from the approved survey grid observations');
  }
  const assignedPanels = new Map<string, D>();
  const usedInputs = new Set<string>();
  const usedDevices = new Set<string>();
  const expectedDeviceCategory = policy.pvInputMode === 'INVERTER' ? 'INVERTER' : 'CHARGE_CONTROLLER';
  if (policy.pvInputMode === 'EXTERNAL_CONTROLLER' && !controllers.length) add('BLOCKER', 'CHARGE_CONTROLLER_REQUIRED', 'This design requires an external controller');
  if (policy.pvInputMode === 'INVERTER' && controllers.length) add('BLOCKER', 'UNUSED_CONTROLLER', 'External controllers are not part of the chosen PV input topology');
  for (const array of design.arrays) {
    const panel = panels.find(row => row.componentId === array.panelComponentId);
    const device = lines.find(row => row.componentId === array.deviceComponentId && row.category === expectedDeviceCategory);
    if (!panel || !device) { add('BLOCKER', 'INVALID_ARRAY_COMPONENT', 'Array must reference panel and receiving-device lines in this BOM'); continue; }
    const key = `${device.componentId}:${array.deviceUnit}:${array.mpptInput}`;
    if (usedInputs.has(key)) add('BLOCKER', 'DUPLICATE_MPPT_INPUT', 'One homogeneous array allocation is allowed per device unit/MPPT input');
    usedInputs.add(key); usedDevices.add(`${device.componentId}:${array.deviceUnit}`);
    const deviceSpec = specs.get(device.componentId) ?? {};
    if (new Decimal(array.deviceUnit).gt(device.quantity)) add('BLOCKER', 'INVALID_DEVICE_UNIT', 'Array points to a device unit outside the BOM quantity', device.componentId);
    if (typeof deviceSpec.mpptInputs !== 'number') add('BLOCKER', 'COMPATIBILITY_UNVERIFIED', 'Manufacturer MPPT input count is unavailable', device.componentId);
    else if (array.mpptInput > deviceSpec.mpptInputs) add('BLOCKER', 'INVALID_MPPT_INPUT', 'Array exceeds the device MPPT input count', device.componentId);
    const voc = requiredNumeric(panel, 'vocV'), vmp = requiredNumeric(panel, 'vmpV'), imp = requiredNumeric(panel, 'impA'), isc = requiredNumeric(panel, 'iscA');
    if ((voc && new Decimal(array.coldVocPerPanelV).lt(voc)) || (vmp && (new Decimal(array.hotVmpPerPanelV).gt(vmp) || new Decimal(array.maximumVmpPerPanelV).lt(vmp))) || (imp && new Decimal(array.operatingCurrentPerStringA).lt(imp)) || (isc && new Decimal(array.shortCircuitCurrentPerStringA).lt(isc)) || new Decimal(array.maximumVmpPerPanelV).gt(array.coldVocPerPanelV)) add('BLOCKER', 'OPTIMISTIC_ARRAY_ASSUMPTION', 'Entered worst-case values cannot be less conservative than module nameplate ratings');
    const maxVoltage = requiredNumeric(device, 'maxDcVoltageV'), minMppt = requiredNumeric(device, 'minMpptVoltageV'), maxMppt = requiredNumeric(device, 'maxMpptVoltageV');
    const maxInput = requiredNumeric(device, 'maxInputCurrentPerMpptA'), maxIsc = requiredNumeric(device, 'maxIscPerMpptA');
    const coldVoltage = new Decimal(array.coldVocPerPanelV).mul(array.seriesPanels);
    if (maxVoltage && coldVoltage.gt(new Decimal(maxVoltage).mul(new Decimal(1).minus(new Decimal(policy.voltageHeadroomPercent).div(100))))) add('BLOCKER', 'DC_VOLTAGE_LIMIT', 'Cold array Voc exceeds the manufacturer limit after the configured headroom', device.componentId);
    if ((minMppt && new Decimal(array.hotVmpPerPanelV).mul(array.seriesPanels).lt(minMppt)) || (maxMppt && new Decimal(array.maximumVmpPerPanelV).mul(array.seriesPanels).gt(maxMppt))) add('BLOCKER', 'MPPT_VOLTAGE_RANGE', 'Array operating voltage is outside the manufacturer MPPT range', device.componentId);
    if ((maxInput && new Decimal(array.operatingCurrentPerStringA).mul(array.parallelStrings).gt(maxInput)) || (maxIsc && new Decimal(array.shortCircuitCurrentPerStringA).mul(array.parallelStrings).gt(maxIsc))) add('BLOCKER', 'PV_CURRENT_LIMIT', 'Parallel-string current exceeds a manufacturer MPPT limit', device.componentId);
    assignedPanels.set(panel.componentId, (assignedPanels.get(panel.componentId) ?? new Decimal(0)).plus(new Decimal(array.seriesPanels).mul(array.parallelStrings)));
  }
  for (const panel of panels) if (!(assignedPanels.get(panel.componentId) ?? new Decimal(0)).eq(panel.quantity)) add('BLOCKER', 'PANEL_ALLOCATION_MISMATCH', 'Allocate every selected panel exactly once in the electrical design', panel.componentId);
  for (const device of lines.filter(row => row.category === expectedDeviceCategory)) {
    const count = new Decimal(device.quantity);
    const allocatedUnits = [...usedDevices].filter(key => key.startsWith(`${device.componentId}:`)).length;
    if (!count.eq(allocatedUnits)) add('BLOCKER', 'DEVICE_ALLOCATION_MISMATCH', 'Every PV-receiving device unit needs an array allocation', device.componentId);
    for (const unit of new Set(design.arrays.filter(array => array.deviceComponentId === device.componentId).map(array => array.deviceUnit))) {
      const allocatedPowerW = total(design.arrays.filter(array => array.deviceComponentId === device.componentId && array.deviceUnit === unit).map(array => { const panelSpec = specs.get(array.panelComponentId) ?? {}; const watts = numeric(panelSpec, 'ratedPowerW'); return watts ? watts.mul(array.seriesPanels).mul(array.parallelStrings) : new Decimal(0); }));
      const maxPower = requiredNumeric(device, 'maxPvPowerW');
      if (maxPower && allocatedPowerW.gt(maxPower)) add('BLOCKER', device.category === 'INVERTER' ? 'INVERTER_PV_POWER_LIMIT' : 'CONTROLLER_PV_POWER_LIMIT', `PV power exceeds receiving device unit ${unit} manufacturer rating`, device.componentId);
      if (device.category === 'INVERTER') {
        const ratedAc = numeric(specs.get(device.componentId) ?? {}, 'ratedAcPowerKw');
        if (ratedAc && (allocatedPowerW.div(1000).div(ratedAc).lt(policy.minDcAcRatio) || allocatedPowerW.div(1000).div(ratedAc).gt(policy.maxDcAcRatio))) add('BLOCKER', 'DEVICE_DC_AC_RATIO', `PV allocation of inverter unit ${unit} is outside the configured sizing ratio`, device.componentId);
      }
    }
  }
  let energy: D | null = null;
  const bank = design.batteryBank;
  if ((policy.batteryRequired || policy.pvInputMode === 'EXTERNAL_CONTROLLER') && (!bank || !batteries.length)) add('BLOCKER', 'BATTERY_REQUIRED', 'The selected design requires a battery bank');
  if (batteries.length && !bank) add('BLOCKER', 'BATTERY_BANK_UNVERIFIED', 'Describe the selected battery series/parallel topology');
  if (bank) {
    const battery = batteries.find(row => row.componentId === bank.componentId);
    if (!battery || batteries.length !== 1) add('BLOCKER', 'MIXED_BATTERY_BANK_UNSUPPORTED', 'Use one homogeneous battery SKU/bank; mixed banks require a separately supported design');
    else {
      if (!new Decimal(bank.seriesUnits).mul(bank.parallelStrings).eq(battery.quantity)) add('BLOCKER', 'BATTERY_QUANTITY_MISMATCH', 'Bank topology does not equal BOM battery count');
      const voltage = requiredNumeric(battery, 'nominalVoltageV');
      const spec = specs.get(battery.componentId) ?? {};
      const kwh = numeric(spec, 'nominalEnergyKwh'), ah = numeric(spec, 'capacityAh');
      if (kwh) energy = new Decimal(kwh).mul(battery.quantity);
      else if (voltage && ah) energy = new Decimal(voltage).mul(ah).mul(battery.quantity).div(1000);
      else add('BLOCKER', 'BATTERY_ENERGY_UNVERIFIED', 'Provide nominal kWh or nominal voltage and Ah', battery.componentId);
      if (typeof spec.chemistry !== 'string') add('BLOCKER', 'BATTERY_CHEMISTRY_UNVERIFIED', 'Battery chemistry is unavailable', battery.componentId);
      const minimumVoltage = requiredNumeric(battery, 'minimumOperatingVoltageV'), maximumVoltage = requiredNumeric(battery, 'maximumChargeVoltageV');
      const bankMinimum = minimumVoltage ? new Decimal(minimumVoltage).mul(bank.seriesUnits) : null;
      const bankMaximum = maximumVoltage ? new Decimal(maximumVoltage).mul(bank.seriesUnits) : null;
      const chargeLimit = requiredNumeric(battery, 'maxChargeCurrentA'), dischargeLimit = requiredNumeric(battery, 'maxDischargeCurrentA');
      let totalCharge = new Decimal(0), requiredDischarge = new Decimal(0);
      for (const device of [...inverters, ...controllers]) {
        const deviceSpec = specs.get(device.componentId) ?? {};
        const min = requiredNumeric(device, 'batteryVoltageMinV'), max = requiredNumeric(device, 'batteryVoltageMaxV');
        if ((bankMinimum && min && bankMinimum.lt(min)) || (bankMaximum && max && bankMaximum.gt(max))) add('BLOCKER', 'BATTERY_VOLTAGE_MISMATCH', 'The full declared bank operating/charge voltage envelope exceeds device absolute battery-input limits', device.componentId);
        if (!Array.isArray(deviceSpec.supportedBatteryChemistries)) add('BLOCKER', 'COMPATIBILITY_UNVERIFIED', 'Device supported battery chemistries are unavailable', device.componentId);
        else if (!deviceSpec.supportedBatteryChemistries.includes(spec.chemistry)) add('BLOCKER', 'BATTERY_CHEMISTRY_MISMATCH', 'Device does not list the selected chemistry', device.componentId);
        const charging = device.category === (policy.pvInputMode === 'INVERTER' ? 'INVERTER' : 'CHARGE_CONTROLLER');
        if (charging) {
          if (device.category === 'INVERTER' && deviceSpec.integratedChargeController !== true) add('BLOCKER', 'INTEGRATED_CONTROLLER_UNVERIFIED', 'Battery charging through the inverter requires documented integrated charging support', device.componentId);
          const charge = requiredNumeric(device, 'maxChargeCurrentA');
          if (charge) totalCharge = totalCharge.plus(new Decimal(charge).mul(device.quantity));
        }
        if (device.category === 'INVERTER') {
          if (policy.pvInputMode === 'EXTERNAL_CONTROLLER' && deviceSpec.externalControllerSupported !== true) add('BLOCKER', 'EXTERNAL_CONTROLLER_UNVERIFIED', 'Document external-controller compatibility for this inverter', device.componentId);
          const efficiency = requiredNumeric(device, 'efficiencyPercent'), ac = requiredNumeric(device, 'ratedAcPowerKw');
          if (efficiency && ac && bankMinimum) requiredDischarge = requiredDischarge.plus(new Decimal(ac).mul(device.quantity).mul(1000).div(new Decimal(efficiency).div(100)).div(bankMinimum));
        }
      }
      if (chargeLimit && totalCharge.gt(new Decimal(chargeLimit).mul(bank.parallelStrings))) add('BLOCKER', 'BATTERY_CHARGE_CURRENT', 'Charging-device limits exceed bank maximum charge current');
      if (dischargeLimit && requiredDischarge.gt(new Decimal(dischargeLimit).mul(bank.parallelStrings))) add('BLOCKER', 'BATTERY_DISCHARGE_CURRENT', 'Estimated full-load DC current exceeds bank discharge capability');
    }
  } else if (configuration.systemType === 'OFF_GRID' && !policy.batteryRequired) for (const inverter of inverters) if (specs.get(inverter.componentId)?.batterylessSupported !== true) add('BLOCKER', 'BATTERYLESS_OPERATION_UNVERIFIED', 'Batteryless off-grid operation requires manufacturer support', inverter.componentId);
  if (survey.suitability === 'CONDITIONALLY_SUITABLE' || survey.additionalWorkRequired) add('CONDITION', 'SURVEY_CONDITIONS', 'Retain and acknowledge the immutable M02 conditions and unresolved specialist work');
  if (configuration.conditionalWorkRequirements) add('CONDITION', 'DESIGN_CONDITIONS', 'Additional configuration work requirements must remain attached to this proposal');
  add('WARNING', 'PRELIMINARY_DESIGN_ONLY', 'String-temperature/current assumptions are designer supplied; protection, cable sizing, structural certification and regulatory approval require independent professional verification');
  const categoryCosts = [...new Set(lines.map(line => line.category))].sort().map(category => ({ category, total: total(byCategory(category).map(line => new Decimal(line.lineTotal))).toFixed(2) }));
  const materialCost = total(lines.map(line => new Decimal(line.lineTotal)));
  return { findings, blockingErrors: findings.filter(finding => finding.severity === 'BLOCKER').length, warnings: findings.filter(finding => finding.severity === 'WARNING').length, conditionalRequirements: findings.filter(finding => finding.severity === 'CONDITION').length,
    calculations: { totalPanelDcCapacityKw: dcComplete ? output(dcCapacity) : null, totalInverterAcCapacityKw: acComplete ? output(acCapacity) : null, dcAcRatio: dcComplete && acComplete ? output(ratio) : null, batteryNominalEnergyKwh: output(energy), totalEstimatedMaterialCost: materialCost.toFixed(2), categoryCosts, differenceFromTargetKw: dcComplete ? output(dcCapacity.minus(configuration.targetCapacityKw)) : null, differenceFromRecommendedKw: dcComplete && recommended ? output(dcCapacity.minus(recommended)) : null, differenceFromRequestedKw: dcComplete && requested ? output(dcCapacity.minus(requested)) : null },
    policy, scope: 'PRELIMINARY_COMPONENT_COMPATIBILITY_NOT_CERTIFICATION' as const,
  };
}
