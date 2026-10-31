/**
 * configurationService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for Solar System Configurations and BOM Generation.
 */

import type {
  SolarConfiguration,
  CreateConfigurationData,
  BillOfMaterials,
  BOMLine,
  ConfigurationStatus,
} from '../types/configuration.types';
import { MOCK_CONFIGURATIONS } from '../data/mockConfigurationData';
import { templateService } from './templateService';

function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _configurationsStore: SolarConfiguration[] = [...MOCK_CONFIGURATIONS];
let _nextConfigId = _configurationsStore.length + 1;

export const configurationService = {
  async list(filters: { search?: string; status?: ConfigurationStatus | '' } = {}): Promise<{
    data: SolarConfiguration[];
    total: number;
  }> {
    await delay();
    let results = [..._configurationsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.configurationName.toLowerCase().includes(q) ||
          c.configurationId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<SolarConfiguration | null> {
    await delay(150);
    return _configurationsStore.find((c) => c.id === id) ?? null;
  },

  async create(data: CreateConfigurationData): Promise<SolarConfiguration> {
    await delay(500);
    const id = `cfg-${String(_nextConfigId).padStart(3, '0')}`;
    const configurationId = `CFG-${String(_nextConfigId).padStart(4, '0')}`;
    _nextConfigId++;

    const now = new Date().toISOString();

    // Calculate line totals
    const components = data.components.map((c) => ({
      ...c,
      estimatedLineTotal: c.estimatedUnitCost ? c.estimatedUnitCost * c.quantity : undefined,
    }));

    const totalQuantity = components.reduce((acc, curr) => acc + curr.quantity, 0);
    const estimatedTotalCost = components.reduce(
      (acc, curr) => acc + (curr.estimatedLineTotal || 0),
      0
    );

    const config: SolarConfiguration = {
      ...data,
      id,
      configurationId,
      components,
      totalComponentCount: components.length,
      totalQuantity,
      estimatedTotalCost,
      status: data.status ?? 'ready_for_quotation',
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          description: `Configuration created from survey ${data.surveyRef}`,
          performedBy: 'Current User',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    _configurationsStore = [config, ..._configurationsStore];
    return config;
  },

  async generateBOM(configurationId: string): Promise<BillOfMaterials> {
    await delay(200);
    const config = _configurationsStore.find((c) => c.id === configurationId);
    if (!config) throw new Error('Configuration not found');

    const lines: BOMLine[] = config.components.map((c, index) => ({
      itemNumber: index + 1,
      componentId: c.componentId,
      componentName: c.name,
      category: c.category,
      modelNumber: c.modelNumber,
      specification: c.specification,
      requiredQuantity: c.quantity,
      unit: c.unit,
      estimatedUnitCost: c.estimatedUnitCost,
      estimatedLineTotal: c.estimatedLineTotal,
      remarks: c.remarks,
    }));

    const totalEstimatedCost = lines.reduce((acc, curr) => acc + (curr.estimatedLineTotal || 0), 0);

    return {
      bomId: `BOM-${config.configurationId.replace('CFG-', '')}`,
      configurationId: config.id,
      configurationName: config.configurationName,
      customerName: config.customerName,
      siteLocation: config.siteLocation,
      systemType: config.systemType,
      ratedCapacity: config.ratedCapacity,
      lines,
      totalItems: lines.length,
      totalQuantity: config.totalQuantity,
      totalEstimatedCost,
      generatedAt: new Date().toISOString(),
    };
  },

  async updateStatus(id: string, status: ConfigurationStatus): Promise<SolarConfiguration> {
    await delay(300);
    const idx = _configurationsStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Configuration not found');

    const updated: SolarConfiguration = {
      ..._configurationsStore[idx],
      status,
      updatedAt: new Date().toISOString(),
      activities: [
        ..._configurationsStore[idx].activities,
        {
          id: `act-${Date.now()}`,
          type: 'status_changed',
          description: `Status changed to ${status.replace('_', ' ')}`,
          performedBy: 'Current User',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    _configurationsStore = [
      ..._configurationsStore.slice(0, idx),
      updated,
      ..._configurationsStore.slice(idx + 1),
    ];
    return updated;
  },

  async getDashboardStats() {
    await delay(200);
    const configs = _configurationsStore;
    const templatesRes = await templateService.list();

    return {
      totalTemplates: templatesRes.total,
      activeTemplates: templatesRes.data.filter((t) => t.status === 'active').length,
      totalConfigurations: configs.length,
      draftConfigurations: configs.filter((c) => c.status === 'draft').length,
      readyForQuotation: configs.filter((c) => c.status === 'ready_for_quotation').length,
      byType: {
        on_grid: configs.filter((c) => c.systemType === 'on_grid').length,
        off_grid: configs.filter((c) => c.systemType === 'off_grid').length,
      },
    };
  },
};

