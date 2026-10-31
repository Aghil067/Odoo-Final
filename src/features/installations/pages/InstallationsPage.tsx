/**
 * InstallationsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master listing page for all Solar Installation Work Orders.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Calendar, LayoutDashboard } from 'lucide-react';
import type { Installation } from '../types/installation.types';
import { installationService } from '../services/installationService';
import { InstallationTable } from '../components/InstallationTable';
import { Button } from '../../../components/ui/Button';

export function InstallationsPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await installationService.list();
        setInstallations(data);
      } catch (err) {
        console.error('Failed to load installations', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-green-600" />
            <span>Installation Work Orders</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, schedule, and execute rooftop solar installations across residential and commercial sites
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/installations/dashboard">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </Link>
          <Link to="/installations/schedule">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Component */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading installation work orders...
        </div>
      ) : (
        <InstallationTable installations={installations} />
      )}
    </div>
  );
}

