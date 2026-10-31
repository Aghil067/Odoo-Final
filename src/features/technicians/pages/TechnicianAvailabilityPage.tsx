/**
 * TechnicianAvailabilityPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master availability management page: weekly schedule forecast,
 * leave tracking, and live technician dispatch states.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, HardHat, Users } from 'lucide-react';
import type { TechnicianAvailabilitySummary } from '../types/availability.types';
import type { AvailabilityStatus } from '../types/technician.types';
import { availabilityService } from '../services/availabilityService';
import { AvailabilityTable } from '../components/AvailabilityTable';
import { Button } from '../../../components/ui/Button';

export function TechnicianAvailabilityPage() {
  const [summaries, setSummaries] = useState<TechnicianAvailabilitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await availabilityService.getAvailabilityOverview();
      setSummaries(data);
    } catch (err) {
      console.error('Failed to load technician availability overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (techId: string, status: AvailabilityStatus) => {
    await availabilityService.updateStatus(techId, status);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            <span>Technician Availability & Schedule Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time availability monitoring, 7-day schedule forecasting, and conflict-free dispatch planning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/technicians">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<HardHat className="w-4 h-4" />}
            >
              Technicians Directory
            </Button>
          </Link>
          <Link to="/technicians/teams">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Users className="w-4 h-4" />}
            >
              Crews & Teams
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Availability Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading availability forecast...
        </div>
      ) : (
        <AvailabilityTable
          summaries={summaries}
          onUpdateStatus={handleUpdateStatus}
          canManage={true}
        />
      )}
    </div>
  );
}
