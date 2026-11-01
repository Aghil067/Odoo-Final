import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  ExternalLink,
  Calendar,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Edit2
} from 'lucide-react';
import type { MappedSiteGroup, MappedInstallationItem, StatusCategory } from '../../types/map.types';
import { Button } from '../../../../components/ui/Button';

interface SiteDetailPanelProps {
  site: MappedSiteGroup | null;
  onClose: () => void;
  onEditCoordinates?: (site: MappedSiteGroup) => void;
}

function getStatusBadge(category: StatusCategory, statusText: string) {
  switch (category) {
    case 'COMMISSIONED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {statusText}
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          {statusText}
        </span>
      );
    case 'ON_HOLD_REWORK':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          {statusText}
        </span>
      );
    case 'PLANNED':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Calendar className="w-3.5 h-3.5" />
          {statusText}
        </span>
      );
  }
}

export function SiteDetailPanel({
  site,
  onClose,
  onEditCoordinates,
}: SiteDetailPanelProps) {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setSelectedIdx(0);
  }, [site?.siteId]);

  if (!site) return null;

  const currentJob: MappedInstallationItem | undefined = site.installations[selectedIdx] || site.installations[0];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="font-semibold text-base leading-tight truncate">
              {site.siteName}
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 pl-6">
            Customer: <span className="font-medium text-white">{site.customerName}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Site address & coords banner */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="truncate mr-2">
          <span>{site.addressLine1}</span>
          {site.addressLine2 && <span>, {site.addressLine2}</span>}
          <span>, {site.city}, {site.state} {site.postalCode}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
            {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
          </span>
          {onEditCoordinates && (
            <button
              type="button"
              onClick={() => onEditCoordinates(site)}
              className="text-amber-600 hover:text-amber-800 p-0.5 rounded"
              title="Edit Coordinates"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* If multiple installations, show tabs */}
      {site.installations.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50/70 border-b border-amber-200/60 overflow-x-auto">
          <Layers className="w-4 h-4 text-amber-600 shrink-0 mr-1" />
          <span className="text-xs font-medium text-amber-900 shrink-0">
            {site.installations.length} Installations at Site:
          </span>
          <div className="flex gap-1">
            {site.installations.map((job, idx) => (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                  selectedIdx === idx
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200'
                }`}
              >
                #{idx + 1} ({job.capacityKw} kW)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Installation Content */}
      {currentJob ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status & Title */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentJob.reference}
              </span>
              {getStatusBadge(currentJob.statusCategory, currentJob.status)}
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {currentJob.name}
            </h4>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Solar Capacity
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {currentJob.capacityKw} <span className="text-xs font-normal text-slate-600">kW</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Configuration
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {currentJob.systemType.replace('_', '-')}
              </p>
            </div>
          </div>

          {/* Dates Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Timeline Dates</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Planned Start</span>
                <span className="font-medium text-slate-800">
                  {new Date(currentJob.plannedStartAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Planned End</span>
                <span className="font-medium text-slate-800">
                  {new Date(currentJob.plannedEndAt).toLocaleDateString()}
                </span>
              </div>
              {currentJob.actualStartAt && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Actual Work Start</span>
                  <span className="font-medium text-slate-800">
                    {new Date(currentJob.actualStartAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {currentJob.commissionedAt ? (
                <div>
                  <span className="text-emerald-600 block text-[10px] uppercase font-bold">Commissioned Date</span>
                  <span className="font-bold text-emerald-800">
                    {new Date(currentJob.commissionedAt).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Commissioning</span>
                  <span className="text-slate-500 italic">Not yet commissioned</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Technicians */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Assigned Workforce</span>
            </div>

            {currentJob.assignedTechnicians.length > 0 ? (
              <div className="space-y-1.5">
                {currentJob.assignedTechnicians.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-0.5">
                    <span className="font-medium text-slate-800">{t.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
                      {t.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No technician assigned</p>
            )}
          </div>

          {/* Warranty Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Warranty Coverage</span>
            </div>

            {currentJob.warranty ? (
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {currentJob.warranty.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Policy:</span>
                  <span className="font-medium text-slate-900">{currentJob.warranty.policyName}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                  <span>Ref:</span>
                  <span>{currentJob.warranty.reference}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">No warranty registered for this job</p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-slate-500">
          No installation records available.
        </div>
      )}

      {/* Footer Navigation Action */}
      {currentJob && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate(`/installations/${currentJob.id}`)}
          >
            <span>View Installation Details</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
