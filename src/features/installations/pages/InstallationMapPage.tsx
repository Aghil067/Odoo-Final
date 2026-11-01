import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  CheckCircle2,
  Clock,
  MapPinOff,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { installationMapService } from '../services/installationMapService';
import type {
  InstallationMapPayload,
  MapFilters,
  MappedSiteGroup,
  StatusCategory
} from '../types/map.types';
import { SolarInstallationMap } from '../components/map/SolarInstallationMap';
import { MapLegend } from '../components/map/MapLegend';
import { MapFilterBar } from '../components/map/MapFilterBar';
import { SiteDetailPanel } from '../components/map/SiteDetailPanel';
import { UnmappedSitesModal } from '../components/map/UnmappedSitesModal';
import { Button } from '../../../components/ui/Button';

export function InstallationMapPage() {
  const { user, getModulePermission } = useAuth();
  const canEditSites = getModulePermission('customers') === 'full' || user?.role === 'admin' || user?.role === 'installation_manager';

  const [data, setData] = useState<InstallationMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>({});
  const [selectedSite, setSelectedSite] = useState<MappedSiteGroup | null>(null);
  const [unmappedOpen, setUnmappedOpen] = useState(false);
  const [triggerFit, setTriggerFit] = useState(0);

  const fetchMapData = useCallback(async (currentFilters: MapFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await installationMapService.getMap(currentFilters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load installation map data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData(filters);
  }, [filters, fetchMapData]);

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleFitBounds = () => {
    setTriggerFit(prev => prev + 1);
  };

  const handleFilterByLegend = (category: StatusCategory | '') => {
    setFilters(prev => ({
      ...prev,
      statusCategory: category,
    }));
  };

  const metrics = data?.metrics || {
    totalMappedSites: 0,
    commissionedSites: 0,
    activeInstallationSites: 0,
    sitesMissingCoordinates: 0,
    totalInstallations: 0,
    statusCounts: { PLANNED: 0, IN_PROGRESS: 0, COMMISSIONED: 0, ON_HOLD_REWORK: 0 },
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumbs & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link to="/installations" className="hover:text-amber-600 transition">Installations</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-medium">Installation Map</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-500" />
            Solar Installation Map
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic view of SunPower Solutions solar installations across customer sites
          </p>
        </div>

        <div className="flex items-center gap-2">
          {metrics.sitesMissingCoordinates > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnmappedOpen(true)}
              className="flex items-center gap-1.5 text-xs text-amber-800 border-amber-300 bg-amber-50/60 hover:bg-amber-100"
            >
              <MapPinOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Location Not Set ({metrics.sitesMissingCoordinates})</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchMapData(filters)}
            disabled={loading}
            className="flex items-center gap-1 text-xs"
            title="Refresh map data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => window.open('/installations', '_self')}
            className="flex items-center gap-1 text-xs"
          >
            <span>Installation List</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Real Metrics Cards (Distinct Site level) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Mapped Sites */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Mapped Sites
            </span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalMappedSites}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalInstallations} total project {metrics.totalInstallations === 1 ? 'job' : 'jobs'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Commissioned Sites */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Commissioned Sites
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {metrics.commissionedSites}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verified operational solar sites
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Locations */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Installation Sites
            </span>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {metrics.activeInstallationSites}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              In progress, testing or ready
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Missing Coordinates */}
        <div
          onClick={() => metrics.sitesMissingCoordinates > 0 && setUnmappedOpen(true)}
          className={`bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between transition ${
            metrics.sitesMissingCoordinates > 0 ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/30' : ''
          }`}
          title={metrics.sitesMissingCoordinates > 0 ? 'Click to view unmapped sites' : 'All sites have coordinates'}
        >
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sites Missing Coords
            </span>
            <p className={`text-2xl font-black mt-0.5 ${metrics.sitesMissingCoordinates > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metrics.sitesMissingCoordinates}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics.sitesMissingCoordinates > 0 ? 'Click to view / set coords' : 'All sites verified'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            metrics.sitesMissingCoordinates > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <MapPinOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <MapFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        onFitBounds={handleFitBounds}
        totalMapped={data?.sites.length || 0}
      />

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white/95">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to Load Map Data</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
            <Button variant="primary" onClick={() => fetchMapData(filters)}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <SolarInstallationMap
              sites={data?.sites || []}
              bounds={data?.bounds || null}
              onSelectSite={site => setSelectedSite(site)}
              triggerFit={triggerFit}
            />

            {/* Floating Status Legend */}
            <div className="absolute bottom-4 left-4 z-[999]">
              <MapLegend
                counts={metrics.statusCounts}
                activeFilter={filters.statusCategory}
                onSelectFilter={handleFilterByLegend}
              />
            </div>

            {/* Slide-over Site Detail Panel */}
            {selectedSite && (
              <SiteDetailPanel
                site={selectedSite}
                onClose={() => setSelectedSite(null)}
                onEditCoordinates={() => setUnmappedOpen(true)}
              />
            )}

            {/* Empty state overlay if 0 sites match active filters */}
            {!loading && data?.sites.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none bg-white/80 backdrop-blur-xs">
                <div className="pointer-events-auto bg-white p-6 rounded-2xl shadow-lg border border-slate-200 max-w-sm">
                  <MapPin className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-900 text-base">No Mapped Installations</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    {metrics.sitesMissingCoordinates > 0
                      ? `${metrics.sitesMissingCoordinates} sites are missing coordinates, or no mapped sites match your current filters.`
                      : 'No mapped sites match the selected criteria.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {metrics.sitesMissingCoordinates > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUnmappedOpen(true)}
                      >
                        Set Missing Coords
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleResetFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="absolute top-4 right-4 z-[999] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Loading PostgreSQL sites...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Unmapped Sites Modal */}
      <UnmappedSitesModal
        unmappedSites={data?.unmappedSites || []}
        isOpen={unmappedOpen}
        onClose={() => setUnmappedOpen(false)}
        onLocationSaved={() => {
          fetchMapData(filters);
        }}
        canEdit={canEditSites}
      />
    </div>
  );
}
