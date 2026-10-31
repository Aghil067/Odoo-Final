/**
 * navigation.ts
 * ─────────────────────────────────────────────────────────────
 * Updated navigation configuration for Module M01 & M02.
 */

import type { ModuleKey } from '../features/auth/types/auth.types';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  module: ModuleKey;
  iconName: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    module: 'dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    path: '/crm',
    module: 'customers',
    iconName: 'Users',
  },
  {
    id: 'site_survey',
    label: 'Site Survey',
    path: '/surveys/dashboard',
    module: 'site_survey',
    iconName: 'MapPin',
  },
  {
    id: 'solar_configuration',
    label: 'Solar Configuration',
    path: '/solar-config',
    module: 'solar_configuration',
    iconName: 'Sun',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    module: 'inventory',
    iconName: 'Package',
  },
  {
    id: 'installations',
    label: 'Installations',
    path: '/installations',
    module: 'installations',
    iconName: 'Wrench',
  },
  {
    id: 'technicians',
    label: 'Technicians',
    path: '/technicians',
    module: 'technicians',
    iconName: 'HardHat',
  },
  {
    id: 'warranty',
    label: 'Warranty',
    path: '/warranty',
    module: 'warranty',
    iconName: 'Shield',
  },
  {
    id: 'service_management',
    label: 'Service Management',
    path: '/service',
    module: 'service_management',
    iconName: 'HeadphonesIcon',
  },
  {
    id: 'finance',
    label: 'Finance',
    path: '/finance',
    module: 'finance',
    iconName: 'DollarSign',
  },
  {
    id: 'user_management',
    label: 'User Management',
    path: '/users',
    module: 'user_management',
    iconName: 'UserCog',
  },
];
