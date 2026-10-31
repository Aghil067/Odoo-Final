/**
 * permissions.ts
 * ─────────────────────────────────────────────────────────────
 * The single source of truth for the frontend permission matrix.
 *
 * HOW TO READ THIS FILE:
 *  PERMISSIONS[module][role] → PermissionLevel
 *
 * HOW TO UPDATE:
 *  Change the value in the matrix below.  The rest of the app
 *  (sidebar, ProtectedRoute, PermissionGuard) reads from here
 *  automatically – no other files need to change.
 *
 * IMPORTANT SECURITY NOTE:
 *  This file controls the UI only.  The backend must enforce
 *  these same rules on every API endpoint and database operation.
 *  A user who can see a page is NOT authorised to perform any
 *  action unless the backend confirms it.
 */

import type { ModuleKey, PermissionLevel, UserRole } from '../features/auth/types/auth.types';

/**
 * Full permission matrix.
 * Rows = modules, Columns = roles.
 *
 * PermissionLevel values:
 *  'full'          → view + create + edit + delete
 *  'view'          → read-only
 *  'assigned_only' → limited to records assigned to the logged-in user
 *  'none'          → no access
 */
export const PERMISSIONS: Record<ModuleKey, Record<UserRole, PermissionLevel>> = {
  dashboard: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'view',
    inventory_manager:    'view',
    installation_manager: 'view',
    technician:           'view',
    finance_officer:      'view',
    service_manager:      'view',
  },

  customers: {
    admin:                'full',
    sales_executive:      'full',
    surveyor:             'view',
    inventory_manager:    'none',
    installation_manager: 'view',
    technician:           'none',
    finance_officer:      'none',
    service_manager:      'none',
  },

  site_survey: {
    admin:                'full',
    sales_executive:      'full',
    surveyor:             'full',
    inventory_manager:    'none',
    installation_manager: 'view',
    technician:           'assigned_only',
    finance_officer:      'none',
    service_manager:      'none',
  },

  solar_configuration: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'view',
    inventory_manager:    'none',
    installation_manager: 'full',
    technician:           'assigned_only',
    finance_officer:      'none',
    service_manager:      'none',
  },

  inventory: {
    admin:                'full',
    sales_executive:      'assigned_only',
    surveyor:             'none',
    inventory_manager:    'full',
    installation_manager: 'view',
    technician:           'assigned_only',
    finance_officer:      'view',
    service_manager:      'none',
  },

  installations: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'view',
    inventory_manager:    'view',
    installation_manager: 'full',
    technician:           'assigned_only',
    finance_officer:      'none',
    service_manager:      'view',
  },

  technicians: {
    admin:                'full',
    sales_executive:      'none',
    surveyor:             'view',
    inventory_manager:    'none',
    installation_manager: 'full',
    technician:           'assigned_only', // own profile and own assignments
    finance_officer:      'view',
    service_manager:      'view',
  },

  warranty: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'none',
    inventory_manager:    'view',
    installation_manager: 'view',
    technician:           'view',
    finance_officer:      'none',
    service_manager:      'full',
  },

  service_management: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'none',
    inventory_manager:    'view',
    installation_manager: 'view',
    technician:           'assigned_only',
    finance_officer:      'none',
    service_manager:      'full',
  },

  finance: {
    admin:                'full',
    sales_executive:      'view',
    surveyor:             'none',
    inventory_manager:    'none',
    installation_manager: 'view',
    technician:           'none',
    finance_officer:      'full',
    service_manager:      'view',
  },

  user_management: {
    admin:                'full',
    sales_executive:      'none',
    surveyor:             'none',
    inventory_manager:    'none',
    installation_manager: 'none',
    technician:           'none',
    finance_officer:      'none',
    service_manager:      'none',
  },
};

// ─── Helper functions ───────────────────────────────────────────

/**
 * Returns the permission level a role has for a given module.
 * Use this in guards; never read PERMISSIONS directly in components.
 */
export function getPermission(module: ModuleKey, role: UserRole): PermissionLevel {
  return PERMISSIONS[module][role];
}

/**
 * Returns true if the role has at least 'view' access to the module
 * (i.e. anything other than 'none').
 */
export function canAccess(module: ModuleKey, role: UserRole): boolean {
  return getPermission(module, role) !== 'none';
}

/**
 * Returns true if the role has 'full' access to the module.
 */
export function hasFull(module: ModuleKey, role: UserRole): boolean {
  return getPermission(module, role) === 'full';
}

/**
 * Returns true if the role's access is limited to assigned records.
 * The backend must enforce this; the frontend only uses it to filter UI hints.
 */
export function isAssignedOnly(module: ModuleKey, role: UserRole): boolean {
  return getPermission(module, role) === 'assigned_only';
}

