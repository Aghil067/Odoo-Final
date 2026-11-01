export type InstallationStatus =
  | 'PLANNED'
  | 'SITE_READY'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'WORK_COMPLETED'
  | 'TESTING'
  | 'COMMISSIONING_REVIEW'
  | 'COMMISSIONED'
  | 'REWORK_REQUIRED'
  | 'CANCELED';

export type StatusCategory = 'PLANNED' | 'IN_PROGRESS' | 'COMMISSIONED' | 'ON_HOLD_REWORK';
export type StatusColor = 'blue' | 'orange' | 'green' | 'red';
export type SystemType = 'ON_GRID' | 'OFF_GRID' | 'UNDECIDED';

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

export interface MapFilters {
  statusCategory?: StatusCategory | '';
  systemType?: SystemType | '';
  minCapacity?: number | '';
  maxCapacity?: number | '';
  q?: string;
}

