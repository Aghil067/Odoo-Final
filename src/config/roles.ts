/**
 * roles.ts
 * ─────────────────────────────────────────────────────────────
 * Central definition of all user roles.
 *
 * WHY THIS FILE EXISTS:
 * Never hard-code role strings inside components.  Import from here
 * so a typo causes a compile error, not a silent permission bug.
 *
 * To add a new role:
 *  1. Add it to the UserRole union in auth.types.ts
 *  2. Add its display metadata here
 *  3. Add its permissions in permissions.ts
 *  4. Add a mock user in mockAuthService.ts
 */

import type { UserRole } from '../features/auth/types/auth.types';

/** Human-readable metadata for each role. */
export interface RoleMeta {
  /** Display name shown in the UI */
  label: string;
  /** Short description of this role's responsibilities */
  description: string;
  /** Tailwind colour classes used for the role badge */
  badgeColour: string;
}

/** All role display information keyed by role value. */
export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    label: 'Administrator',
    description: 'Full system access across all modules.',
    badgeColour: 'bg-red-100 text-red-800',
  },
  sales_executive: {
    label: 'Sales Executive',
    description: 'Manages customer relationships and sales pipeline.',
    badgeColour: 'bg-blue-100 text-blue-800',
  },
  surveyor: {
    label: 'Surveyor',
    description: 'Conducts and manages site surveys.',
    badgeColour: 'bg-yellow-100 text-yellow-800',
  },
  inventory_manager: {
    label: 'Inventory Manager',
    description: 'Manages stock, warehouse and inventory records.',
    badgeColour: 'bg-orange-100 text-orange-800',
  },
  installation_manager: {
    label: 'Installation Manager',
    description: 'Plans and oversees solar installations.',
    badgeColour: 'bg-indigo-100 text-indigo-800',
  },
  technician: {
    label: 'Technician',
    description: 'Executes assigned installation and service tasks.',
    badgeColour: 'bg-teal-100 text-teal-800',
  },
  finance_officer: {
    label: 'Finance Officer',
    description: 'Manages billing, invoices and financial reporting.',
    badgeColour: 'bg-purple-100 text-purple-800',
  },
  service_manager: {
    label: 'Service Manager',
    description: 'Manages warranty claims and service requests.',
    badgeColour: 'bg-green-100 text-green-800',
  },
};

/** Ordered list of all roles (useful for dropdowns and tables). */
export const ALL_ROLES: UserRole[] = Object.keys(ROLE_META) as UserRole[];
