/**
 * PermissionGuard.tsx
 * ─────────────────────────────────────────────────────────────
 * Inline guard component that conditionally renders children
 * based on module permission.
 *
 * Use this INSIDE a page/component when you need to show or hide
 * a specific UI element (e.g. a Delete button, an edit form).
 * For whole-page access control, use ProtectedRoute instead.
 *
 * USAGE EXAMPLES:
 *
 *   // Show only if user has any access to 'finance'
 *   <PermissionGuard module="finance">
 *     <FinanceSummary />
 *   </PermissionGuard>
 *
 *   // Show only if user has 'full' permission on 'customers'
 *   <PermissionGuard module="customers" require="full">
 *     <DeleteCustomerButton />
 *   </PermissionGuard>
 *
 *   // Show a fallback if access is denied
 *   <PermissionGuard module="inventory" fallback={<ReadOnlyBadge />}>
 *     <EditInventoryButton />
 *   </PermissionGuard>
 *
 * SECURITY NOTE:
 *  This component hides UI elements but is not a security boundary.
 *  The backend must check permissions on every API call.
 */

import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { ModuleKey, PermissionLevel } from '../../features/auth/types/auth.types';

interface PermissionGuardProps {
  /** The module whose permission level is checked. */
  module: ModuleKey;
  /**
   * Minimum required permission level.
   * Defaults to any level that is not 'none' (i.e. can access).
   */
  require?: PermissionLevel;
  /** Content shown when access is granted. */
  children: ReactNode;
  /** Optional content shown when access is denied (defaults to null). */
  fallback?: ReactNode;
}

/** Ordered permission levels from lowest to highest. */
const LEVEL_ORDER: PermissionLevel[] = ['none', 'assigned_only', 'view', 'full'];

function meetsRequirement(actual: PermissionLevel, required: PermissionLevel): boolean {
  // 'assigned_only' is a special case – it grants scoped access, not a step
  // between 'view' and 'full', so we check for it explicitly.
  if (required === 'assigned_only') {
    return actual === 'assigned_only' || actual === 'full';
  }
  return LEVEL_ORDER.indexOf(actual) >= LEVEL_ORDER.indexOf(required);
}

export function PermissionGuard({
  module,
  require = 'view',
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { getModulePermission } = useAuth();
  const actual = getModulePermission(module);

  // 'none' always fails, regardless of 'require'
  if (actual === 'none') return <>{fallback}</>;

  if (!meetsRequirement(actual, require)) return <>{fallback}</>;

  return <>{children}</>;
}

