/**
 * Topbar.tsx
 * ─────────────────────────────────────────────────────────────
 * Top navigation bar displayed on all authenticated pages.
 *
 * DISPLAYS:
 *  - Hamburger menu button (mobile)
 *  - Current page title (from React Router location)
 *  - User name, role badge, avatar initials
 *  - Logout button
 */

import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';
import { ROLE_META } from '../../config/roles';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface TopbarProps {
  onMenuOpen: () => void;
}

/** Derive a page title from the current pathname using nav config. */
function usePageTitle(): string {
  const { pathname } = useLocation();
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.path));
  return match?.label ?? 'Solar Installation MS';
}

/** Generate initials from a display name (e.g. "Sara Surveyor" → "SS"). */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Topbar({ onMenuOpen }: TopbarProps) {
  const { user, logout } = useAuth();
  const pageTitle = usePageTitle();

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left side: hamburger + page title */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
      </div>

      {/* Right side: user info + logout */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span
          className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleMeta.badgeColour}`}
        >
          {roleMeta.label}
        </span>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-green-500"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center
                         text-white text-xs font-bold ring-2 ring-green-500"
              aria-hidden="true"
            >
              {getInitials(user.name)}
            </div>
          )}
          <span className="hidden md:block text-sm font-medium text-slate-700">
            {user.name}
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600
                     hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

