import { getData } from '../../../services/apiClient';
import type { InstallationMapPayload, MapFilters } from '../types/map.types';

export const installationMapService = {
  async getMap(filters: MapFilters = {}): Promise<InstallationMapPayload> {
    const params = new URLSearchParams();
    if (filters.statusCategory) params.set('statusCategory', filters.statusCategory);
    if (filters.systemType) params.set('systemType', filters.systemType);
    if (filters.minCapacity !== undefined && filters.minCapacity !== '') {
      params.set('minCapacity', String(filters.minCapacity));
    }
    if (filters.maxCapacity !== undefined && filters.maxCapacity !== '') {
      params.set('maxCapacity', String(filters.maxCapacity));
    }
    if (filters.q && filters.q.trim()) {
      params.set('q', filters.q.trim());
    }

    const qs = params.toString();
    return getData<InstallationMapPayload>(`/installations/map${qs ? `?${qs}` : ''}`);
  }
};

