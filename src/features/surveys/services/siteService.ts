/**
 * siteService.ts
 * ─────────────────────────────────────────────────────────────
 * Service for Customer Installation Sites.
 */

import type { Site, SiteFormData } from '../types/site.types';
import { MOCK_SITES } from '../data/mockSurveyData';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _sitesStore: Site[] = [...MOCK_SITES];
let _nextSiteId = _sitesStore.length + 1;

export const siteService = {
  async getByCustomerId(customerId: string): Promise<Site[]> {
    await delay();
    return _sitesStore.filter((s) => s.customerId === customerId);
  },

  async getById(id: string): Promise<Site | null> {
    await delay(150);
    return _sitesStore.find((s) => s.id === id) ?? null;
  },

  async create(data: SiteFormData): Promise<Site> {
    await delay(400);
    const id = `site-${String(_nextSiteId).padStart(3, '0')}`;
    _nextSiteId++;
    const now = new Date().toISOString();
    const site: Site = {
      ...data,
      id,
      country: data.country ?? 'India',
      createdAt: now,
      updatedAt: now,
    };
    _sitesStore = [..._sitesStore, site];
    return site;
  },
};

