import type { SolarConfigurationStatus } from '@prisma/client';
import { ApiError } from '../../lib/http.js';
import { solarWhere, requireDepartment } from './access.service.js';
import { type Context, range, metric, page, paging } from './common.js';
export async function solar(c: Context, mode: 'summary' | 'capacity' | 'components') {
    requireDepartment(c, 'solar');
    const w = { AND: [solarWhere(c), { createdAt: range(c), status: c.q.status as SolarConfigurationStatus | undefined }] };
    if (mode === 'summary')
        return { byStatus: await c.tx.solarConfiguration.groupBy({ by: ['status'], where: w, _count: { _all: true }, orderBy: { status: 'asc' } }), bySystemType: await c.tx.solarConfiguration.groupBy({ by: ['systemType'], where: w, _count: { _all: true }, orderBy: { systemType: 'asc' } }), source: 'SolarConfiguration', definition: 'Current states of configurations created in interval; each revision is a configuration', approvedDesigns: metric(await c.tx.solarConfiguration.count({ where: { AND: [w, { status: 'APPROVED', nextRevision: null }] } }), 'SolarConfiguration', 'Latest non-superseded APPROVED configurations in creation cohort') };
    const approved = { AND: [w, { status: 'APPROVED' as const, nextRevision: null }] };
    if (mode === 'capacity')
        return { designed: await c.tx.solarConfiguration.aggregate({ where: approved, _sum: { targetCapacityKw: true, calculatedDcCapacityKw: true, inverterAcCapacityKw: true }, _count: { _all: true } }), bySystemType: await c.tx.solarConfiguration.groupBy({ by: ['systemType'], where: approved, _sum: { targetCapacityKw: true, calculatedDcCapacityKw: true }, _count: { _all: true }, orderBy: { systemType: 'asc' } }), source: 'SolarConfiguration', definition: 'Latest currently approved design revisions created in interval; kW, never commissioned capacity or energy production', measuredGenerationKwh: null };
    const where = { bom: { status: 'APPROVED' as const, configuration: approved }, ...(c.q.currency ? { currency: c.q.currency } : {}) };
    const data = await c.tx.bOMLine.groupBy({ by: ['componentId', 'category', 'unit', 'currency'], where, _sum: { quantity: true, lineTotal: true }, _count: { _all: true }, orderBy: [{ _count: { componentId: 'desc' } }, { componentId: 'asc' }, { unit: 'asc' }, { currency: 'asc' }, { category: 'asc' }], ...paging(c.q) });
    const total = await c.tx.bOMLine.groupBy({ by: ['componentId', 'category', 'unit', 'currency'], where, orderBy: [{ componentId: 'asc' }, { category: 'asc' }, { unit: 'asc' }, { currency: 'asc' }], take: 10001 });
    if (total.length > 10000)
        throw new ApiError(422, 'ANALYTICS_SCOPE_LIMIT', 'Narrow BOM component scope');
    return { ...page(data, total.length, c.q), estimatedBomCosts: await c.tx.billOfMaterials.groupBy({ by: ['currency'], where: { status: 'APPROVED', configuration: approved, ...(c.q.currency ? { currency: c.q.currency } : {}) }, _sum: { totalEstimatedMaterialCost: true }, orderBy: { currency: 'asc' } }), source: 'BOMLine,BillOfMaterials', definition: 'Latest approved design BOM quantities separated by component/unit/currency; frequency counts BOM occurrences; engineering estimates are not sale price or recognized expense' };
}
