/**
 * Sidebar.tsx
 * ─────────────────────────────────────────────────────────────
 * Application sidebar with role-filtered navigation.
 *
 * WHAT IT DOES:
 *  - Reads the logged-in user's role from AuthContext
 *  - Filters NAV_ITEMS to only show modules the user can access
 *  - Highlights the current active route
 *  - Supports collapsible mode on smaller screens
 *
 * PERMISSION FILTERING:
 *  The sidebar calls hasPermission(item.module) for each nav item.
 *  Items where the user has 'none' permission are simply not rendered.
 *  This is a UX improvement only – ProtectedRoute enforces access.
 */

import {
  DollarSign,
  HardHat,
  HeadphonesIcon,
  LayoutDashboard,
  Map,
  MapPin,
  Menu,
  Package,
  Shield,
  Sun,
  UserCog,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';

// Map icon name strings to actual Lucide components
// This keeps navigation.ts free of React imports
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Map,
  Users,
  MapPin,
  Sun,
  Package,
  Wrench,
  HardHat,
  Shield,
  HeadphonesIcon,
  DollarSign,
  UserCog,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { hasPermission } = useAuth();

  // Filter navigation items to only those the user can access
  const accessibleItems = NAV_ITEMS.filter((item) =>
    hasPermission(item.module)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-navy-900 bg-[#0f172a] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        aria-label="Sidebar navigation"
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">SolarMS</p>
              <p className="text-slate-400 text-xs">Management System</p>
            </div>
          </div>
          {/* Close button – mobile only */}
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {accessibleItems.map((item) => {
              const Icon = ICON_MAP[item.iconName] ?? Menu;
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       transition-colors duration-150 focus:outline-none focus:ring-2
                       focus:ring-green-500 focus:ring-inset
                       ${
                         isActive
                           ? 'bg-green-600 text-white'
                           : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                       }`
                    }
                    aria-current={undefined}
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-slate-500 text-xs text-center">
            Solar Installation MS · v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}

