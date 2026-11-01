import { Prisma, InstallationStatus, SystemType } from '@prisma/client';
import { z } from 'zod';
import type { Principal } from '../auth/auth.js';
import { installationAtomic, scope } from './common.js';
import * as v from './validation.js';

export type StatusCategory = 'PLANNED' | 'IN_PROGRESS' | 'COMMISSIONED' | 'ON_HOLD_REWORK';
export type StatusColor = 'blue' | 'orange' | 'green' | 'red';

export function getStatusCategory(status: InstallationStatus): StatusCategory {
  switch (status) {
    case 'COMMISSIONED':
      return 'COMMISSIONED';
    case 'PLANNED':
    case 'SITE_READY':
      return 'PLANNED';
    case 'IN_PROGRESS':
    case 'WORK_COMPLETED':
    case 'TESTING':
    case 'COMMISSIONING_REVIEW':
      return 'IN_PROGRESS';
    case 'ON_HOLD':
    case 'REWORK_REQUIRED':
    case 'CANCELED':
      return 'ON_HOLD_REWORK';
    default:
      return 'PLANNED';
  }
}

export function getStatusColor(category: StatusCategory): StatusColor {
  switch (category) {
    case 'COMMISSIONED':
      return 'green';
    case 'IN_PROGRESS':
      return 'orange';
    case 'ON_HOLD_REWORK':
      return 'red';
    case 'PLANNED':
      return 'blue';
  }
}

export interface MappedInstallationItem {
  id: string;
  reference: string;
  name: string;
  status: InstallationStatus;
  statusCategory: StatusCategory;
  statusColor: StatusColor;
  customerName: string;
  customerId: string;
  capacityKw: number;
  systemType: SystemType;
  plannedStartAt: string;
  plannedEndAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  commissionedAt: string | null;
  assignedTechnicians: Array<{ id: string; name: string; role: string }>;
  warranty: { reference: string; status: string; policyName: string } | null;
}

export interface MappedSiteGroup {
  siteId: string;
  siteName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  customerId: string;
  customerName: string;
  primaryStatus: StatusCategory;
  primaryStatusColor: StatusColor;
  installationCount: number;
  hasCommissioned: boolean;
  hasActive: boolean;
  installations: MappedInstallationItem[];
}

export interface UnmappedSiteGroup {
  siteId: string;
  siteName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  customerId: string;
  customerName: string;
  installationCount: number;
  version: number;
  installations: Array<{
    id: string;
    reference: string;
    name: string;
    status: InstallationStatus;
    statusCategory: StatusCategory;
    capacityKw: number;
    systemType: SystemType;
  }>;
}

export interface InstallationMapPayload {
  sites: MappedSiteGroup[];
  unmappedSites: UnmappedSiteGroup[];
  metrics: {
    totalMappedSites: number;
    commissionedSites: number;
    activeInstallationSites: number;
    sitesMissingCoordinates: number;
    totalInstallations: number;
    statusCounts: Record<StatusCategory, number>;
  };
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
}

export function getInstallationMap(user: Principal, q: z.infer<typeof v.mapQuery>): Promise<InstallationMapPayload> {
  return installationAtomic(async tx => {
    const jobScope = scope(user);

    let statusFilter: InstallationStatus[] | undefined = undefined;
    if (q.status) {
      statusFilter = [q.status];
    } else if (q.statusCategory) {
      switch (q.statusCategory) {
        case 'PLANNED':
          statusFilter = [InstallationStatus.PLANNED, InstallationStatus.SITE_READY];
          break;
        case 'IN_PROGRESS':
          statusFilter = [
            InstallationStatus.IN_PROGRESS,
            InstallationStatus.WORK_COMPLETED,
            InstallationStatus.TESTING,
            InstallationStatus.COMMISSIONING_REVIEW,
          ];
          break;
        case 'COMMISSIONED':
          statusFilter = [InstallationStatus.COMMISSIONED];
          break;
        case 'ON_HOLD_REWORK':
          statusFilter = [
            InstallationStatus.ON_HOLD,
            InstallationStatus.REWORK_REQUIRED,
            InstallationStatus.CANCELED,
          ];
          break;
      }
    }

    const where: Prisma.InstallationJobWhereInput = {
      AND: [
        jobScope,
        statusFilter ? { status: { in: statusFilter } } : {},
        q.systemType ? { configuration: { systemType: q.systemType } } : {},
        (q.minCapacity !== undefined || q.maxCapacity !== undefined) ? {
          configuration: {
            targetCapacityKw: {
              ...(q.minCapacity !== undefined ? { gte: q.minCapacity } : {}),
              ...(q.maxCapacity !== undefined ? { lte: q.maxCapacity } : {}),
            }
          }
        } : {},
        (q.fromDate !== undefined || q.toDate !== undefined) ? {
          OR: [
            {
              plannedStartAt: {
                ...(q.fromDate ? { gte: new Date(q.fromDate) } : {}),
                ...(q.toDate ? { lte: new Date(q.toDate) } : {})
              }
            },
            {
              commissionedAt: {
                ...(q.fromDate ? { gte: new Date(q.fromDate) } : {}),
                ...(q.toDate ? { lte: new Date(q.toDate) } : {})
              }
            }
          ]
        } : {},
        q.q ? {
          OR: [
            { name: { contains: q.q, mode: 'insensitive' } },
            { reference: { contains: q.q, mode: 'insensitive' } },
            { customer: { name: { contains: q.q, mode: 'insensitive' } } },
            { site: { name: { contains: q.q, mode: 'insensitive' } } },
            { site: { city: { contains: q.q, mode: 'insensitive' } } },
          ]
        } : {},
      ]
    };

    const limit = Math.min(q.limit || 250, 500);

    const jobs = await tx.installationJob.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, type: true, companyName: true } },
        site: {
          select: {
            id: true,
            name: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            latitude: true,
            longitude: true,
            landmark: true,
            version: true,
          }
        },
        configuration: {
          select: {
            id: true,
            reference: true,
            name: true,
            systemType: true,
            targetCapacityKw: true,
            calculatedDcCapacityKw: true,
            inverterAcCapacityKw: true,
            batteryNominalEnergyKwh: true,
          }
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        },
        warrantyRegistrations: {
          select: {
            id: true,
            reference: true,
            status: true,
            policy: { select: { name: true } }
          },
          take: 1,
        }
      },
      orderBy: [{ plannedStartAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const mappedSiteMap = new Map<string, MappedSiteGroup>();
    const unmappedSiteMap = new Map<string, UnmappedSiteGroup>();

    const statusCounts: Record<StatusCategory, number> = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMMISSIONED: 0,
      ON_HOLD_REWORK: 0,
    };

    let totalInstallations = 0;

    for (const job of jobs) {
      totalInstallations++;
      const cat = getStatusCategory(job.status);
      statusCounts[cat]++;

      const hasCoords = job.site.latitude !== null && job.site.longitude !== null;

      if (hasCoords) {
        const lat = Number(job.site.latitude);
        const lng = Number(job.site.longitude);

        // Check map bounds filter if provided
        if (q.minLat !== undefined && lat < q.minLat) continue;
        if (q.maxLat !== undefined && lat > q.maxLat) continue;
        if (q.minLng !== undefined && lng < q.minLng) continue;
        if (q.maxLng !== undefined && lng > q.maxLng) continue;

        let siteGroup = mappedSiteMap.get(job.siteId);
        if (!siteGroup) {
          siteGroup = {
            siteId: job.site.id,
            siteName: job.site.name,
            addressLine1: job.site.addressLine1,
            addressLine2: job.site.addressLine2,
            city: job.site.city,
            state: job.site.state,
            postalCode: job.site.postalCode,
            country: job.site.country,
            landmark: job.site.landmark,
            latitude: lat,
            longitude: lng,
            customerId: job.customerId,
            customerName: job.customer.name,
            primaryStatus: cat,
            primaryStatusColor: getStatusColor(cat),
            installationCount: 0,
            hasCommissioned: false,
            hasActive: false,
            installations: [],
          };
          mappedSiteMap.set(job.siteId, siteGroup);
        }

        const installationItem: MappedInstallationItem = {
          id: job.id,
          reference: job.reference,
          name: job.name,
          status: job.status,
          statusCategory: cat,
          statusColor: getStatusColor(cat),
          customerName: job.customer.name,
          customerId: job.customerId,
          capacityKw: Number(job.configuration.targetCapacityKw),
          systemType: job.configuration.systemType,
          plannedStartAt: job.plannedStartAt.toISOString(),
          plannedEndAt: job.plannedEndAt.toISOString(),
          actualStartAt: job.actualStartAt ? job.actualStartAt.toISOString() : null,
          actualEndAt: job.actualEndAt ? job.actualEndAt.toISOString() : null,
          commissionedAt: job.commissionedAt ? job.commissionedAt.toISOString() : null,
          assignedTechnicians: job.assignments.map(a => ({
            id: a.user.id,
            name: a.user.name,
            role: a.user.role,
          })),
          warranty: job.warrantyRegistrations[0] ? {
            reference: job.warrantyRegistrations[0].reference,
            status: job.warrantyRegistrations[0].status,
            policyName: job.warrantyRegistrations[0].policy.name,
          } : null,
        };

        siteGroup.installations.push(installationItem);
        siteGroup.installationCount = siteGroup.installations.length;

        if (cat === 'COMMISSIONED') {
          siteGroup.hasCommissioned = true;
        }
        if (cat === 'IN_PROGRESS' || job.status === 'SITE_READY') {
          siteGroup.hasActive = true;
        }
      } else {
        // Site missing coordinates
        let unmapped = unmappedSiteMap.get(job.siteId);
        if (!unmapped) {
          unmapped = {
            siteId: job.site.id,
            siteName: job.site.name,
            addressLine1: job.site.addressLine1,
            addressLine2: job.site.addressLine2,
            city: job.site.city,
            state: job.site.state,
            postalCode: job.site.postalCode,
            country: job.site.country,
            customerId: job.customerId,
            customerName: job.customer.name,
            version: job.site.version,
            installationCount: 0,
            installations: [],
          };
          unmappedSiteMap.set(job.siteId, unmapped);
        }

        unmapped.installations.push({
          id: job.id,
          reference: job.reference,
          name: job.name,
          status: job.status,
          statusCategory: cat,
          capacityKw: Number(job.configuration.targetCapacityKw),
          systemType: job.configuration.systemType,
        });
        unmapped.installationCount = unmapped.installations.length;
      }
    }

    // Determine representative primaryStatus for each mapped site
    for (const siteGroup of mappedSiteMap.values()) {
      const allCommissioned = siteGroup.installations.every(i => i.statusCategory === 'COMMISSIONED');
      const anyRework = siteGroup.installations.some(i => i.statusCategory === 'ON_HOLD_REWORK');
      const anyInProgress = siteGroup.installations.some(i => i.statusCategory === 'IN_PROGRESS');

      if (allCommissioned && siteGroup.installations.length > 0) {
        siteGroup.primaryStatus = 'COMMISSIONED';
      } else if (anyRework) {
        siteGroup.primaryStatus = 'ON_HOLD_REWORK';
      } else if (anyInProgress) {
        siteGroup.primaryStatus = 'IN_PROGRESS';
      } else {
        siteGroup.primaryStatus = 'PLANNED';
      }
      siteGroup.primaryStatusColor = getStatusColor(siteGroup.primaryStatus);
    }

    const sites = Array.from(mappedSiteMap.values());
    const unmappedSites = Array.from(unmappedSiteMap.values());

    // Distinct site metrics
    const totalMappedSites = sites.length;
    const commissionedSites = sites.filter(s => s.hasCommissioned).length;
    const activeInstallationSites = sites.filter(s => s.hasActive).length;
    const sitesMissingCoordinates = unmappedSites.length;

    // Calculate bounding box for auto-fitting
    let bounds: InstallationMapPayload['bounds'] = null;
    const firstSite = sites[0];
    if (firstSite) {
      let minLat = firstSite.latitude;
      let maxLat = firstSite.latitude;
      let minLng = firstSite.longitude;
      let maxLng = firstSite.longitude;

      for (const s of sites) {
        if (s.latitude < minLat) minLat = s.latitude;
        if (s.latitude > maxLat) maxLat = s.latitude;
        if (s.longitude < minLng) minLng = s.longitude;
        if (s.longitude > maxLng) maxLng = s.longitude;
      }

      bounds = { minLat, maxLat, minLng, maxLng };
    }

    return {
      sites,
      unmappedSites,
      metrics: {
        totalMappedSites,
        commissionedSites,
        activeInstallationSites,
        sitesMissingCoordinates,
        totalInstallations,
        statusCounts,
      },
      bounds,
    };
  });
}
