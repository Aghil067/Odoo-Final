/**
 * InstallationSchedulePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master scheduling and calendar view page for installation deployments.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, LayoutDashboard, Plus } from 'lucide-react';
import type { Installation } from '../types/installation.types';
import { installationService } from '../services/installationService';
import { InstallationCalendar } from '../components/InstallationCalendar';
import { Button } from '../../../components/ui/Button';

export function InstallationSchedulePage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await installationService.list();
        setInstallations(data);
      } catch (err) {
        console.error('Failed to load installations for schedule', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReschedule = async (
    installationId: string,
    newStartDate: string,
    newEndDate: string,
    team?: string
  ) => {
    await installationService.updateSchedule(installationId, {
      plannedStartDate: newStartDate,
      plannedEndDate: newEndDate,
      assignedTeam: team,
    });
    const refreshed = await installationService.list();
    setInstallations(refreshed);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            <span>Installation Scheduling & Dispatch</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual calendar management, crew assignment, and conflict-free timeline planning
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
          <Link to="/installations/new">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Installation
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Component */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading calendar and schedule events...
        </div>
      ) : (
        <InstallationCalendar
          installations={installations}
          onReschedule={handleReschedule}
          canReschedule={true}
        />
      )}
    </div>
  );
}

