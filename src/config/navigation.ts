/**
 * navigation.ts
 * ─────────────────────────────────────────────────────────────
 * Defines the sidebar navigation items and associates each with
 * a required module key from the permission matrix.
 *
 * The sidebar renders ONLY the items where canAccess(item.module, role)
 * returns true for the logged-in user's role.
 *
 * To add a new module:
 *  1. Add the ModuleKey in auth.types.ts
 *  2. Add permissions in permissions.ts
 *  3. Add the nav item below
 *  4. Add the route in router.tsx
 */

import type { ModuleKey } from '../features/auth/types/auth.types';

/** A single sidebar navigation entry. */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label in the sidebar */
  label: string;
  /** React Router path */
  path: string;
  /** Permission module this item is gated on */
  module: ModuleKey;
  /** Lucide icon name (imported dynamically in Sidebar.tsx) */
  iconName: string;
}

/**
 * Ordered list of all navigation items.
 * Order here = order in the sidebar.
 */
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
    path: '/customers',
    module: 'customers',
    iconName: 'Users',
  },
  {
    id: 'site_survey',
    label: 'Site Survey',
    path: '/site-survey',
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

