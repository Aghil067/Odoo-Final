/**
 * AppLayout.tsx
 * ─────────────────────────────────────────────────────────────
 * The main application shell rendered after successful login.
 *
 * STRUCTURE:
 *  ┌─────────────────────────────────────────┐
 *  │  Sidebar  │  Topbar                     │
 *  │  (nav)    ├─────────────────────────────│
 *  │           │  <Outlet /> (page content)  │
 *  └─────────────────────────────────────────┘
 *
 * The <Outlet /> is filled by React Router with the current page.
 * All authenticated routes should be children of this layout route.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  // Controls sidebar visibility on mobile screens
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area: topbar + page content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          id="main-content"
          aria-label="Main content"
        >
          <div className="p-4 lg:p-6 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

