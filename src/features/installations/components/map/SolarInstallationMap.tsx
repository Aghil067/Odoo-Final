import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

import type { MappedSiteGroup, StatusColor } from '../../types/map.types';

// Palette mapping
const COLOR_CONFIG: Record<StatusColor, { bg: string; border: string; glow: string }> = {
  green: { bg: '#10b981', border: '#047857', glow: 'rgba(16, 185, 129, 0.4)' },
  orange: { bg: '#f97316', border: '#c2410c', glow: 'rgba(249, 115, 22, 0.4)' },
  blue: { bg: '#3b82f6', border: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.4)' },
  red: { bg: '#ef4444', border: '#b91c1c', glow: 'rgba(239, 68, 68, 0.4)' },
};

function createPinIcon(site: MappedSiteGroup): L.DivIcon {
  const color = COLOR_CONFIG[site.primaryStatusColor] || COLOR_CONFIG.blue;
  const count = site.installationCount;
  const isMulti = count > 1;

  // Custom SVG map marker with shadow, gradient pin head, solar icon / badge
  const svg = `
    <div class="relative group cursor-pointer" style="filter: drop-shadow(0 4px 6px ${color.glow});">
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-xs"
           style="background: linear-gradient(135deg, ${color.bg}, ${color.border}); border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
        ${isMulti ? `
          <span class="font-extrabold text-[12px] tracking-tight">${count}</span>
        ` : `
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        `}
      </div>
      <!-- Pin Pointer Tip -->
      <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto -mt-0.5"
           style="border-t-color: ${color.border};"></div>
      ${isMulti ? `
        <span class="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs">
          ${count}
        </span>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'solar-site-marker-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });
}

function MapController({
  sites,
  bounds,
  onSelectSite,
  triggerFit,
}: {
  sites: MappedSiteGroup[];
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
  onSelectSite: (site: MappedSiteGroup) => void;
  triggerFit: number;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize or update MarkerClusterGroup
  useEffect(() => {
    if (!map) return;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current.clearLayers();
    }

    const clusterGroup = (L as unknown as {
      markerClusterGroup: (opts?: unknown) => L.MarkerClusterGroup;
    }).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: { getChildCount: () => number }) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm border-2 border-amber-400 shadow-lg">
                  <span>${count}</span>
                 </div>`,
          className: 'solar-cluster-icon',
          iconSize: [40, 40],
        });
      },
    });

    for (const site of sites) {
      const marker = L.marker([site.latitude, site.longitude], {
        icon: createPinIcon(site),
        title: site.siteName,
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      // Quick popup on hover / click
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${escapeHtml(site.siteName)}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${escapeHtml(site.city)}, ${escapeHtml(site.state)}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span style="font-weight: 600; color: ${COLOR_CONFIG[site.primaryStatusColor]?.bg || '#3b82f6'};">
              ● ${site.primaryStatus.replace('_', ' ')}
            </span>
            <span style="color: #475569;">${site.installationCount} ${site.installationCount === 1 ? 'job' : 'jobs'}</span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -38] });

      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, sites, onSelectSite]);

  // Fit bounds when bounds change or fit requested
  useEffect(() => {
    if (!map || !bounds) return;

    if (
      Number.isFinite(bounds.minLat) &&
      Number.isFinite(bounds.maxLat) &&
      Number.isFinite(bounds.minLng) &&
      Number.isFinite(bounds.maxLng)
    ) {
      if (bounds.minLat === bounds.maxLat && bounds.minLng === bounds.maxLng) {
        map.setView([bounds.minLat, bounds.minLng], 14);
      } else {
        map.fitBounds(
          [
            [bounds.minLat, bounds.minLng],
            [bounds.maxLat, bounds.maxLng],
          ],
          { padding: [50, 50], maxZoom: 15 }
        );
      }
    }
  }, [map, bounds, triggerFit]);

  return null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface SolarInstallationMapProps {
  sites: MappedSiteGroup[];
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
  onSelectSite: (site: MappedSiteGroup) => void;
  triggerFit: number;
}

export function SolarInstallationMap({
  sites,
  bounds,
  onSelectSite,
  triggerFit,
}: SolarInstallationMapProps) {
  // Default center: Hyderabad (17.3850, 78.4867) where active installations are located
  const defaultCenter: [number, number] = sites.length > 0
    ? [sites[0].latitude, sites[0].longitude]
    : [17.44, 78.38];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <MapContainer
        center={defaultCenter}
        zoom={sites.length > 0 ? 12 : 6}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapController
          sites={sites}
          bounds={bounds}
          onSelectSite={onSelectSite}
          triggerFit={triggerFit}
        />
      </MapContainer>
    </div>
  );
}
