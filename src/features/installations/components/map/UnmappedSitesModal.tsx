import React, { useState } from 'react';
import { X, MapPinOff, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import type { UnmappedSiteGroup } from '../../types/map.types';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { siteService } from '../../../surveys/services/siteService';

interface UnmappedSitesModalProps {
  unmappedSites: UnmappedSiteGroup[];
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: () => void;
  canEdit: boolean;
}

export function UnmappedSitesModal({
  unmappedSites,
  isOpen,
  onClose,
  onLocationSaved,
  canEdit,
}: UnmappedSitesModalProps) {
  const [editingSite, setEditingSite] = useState<UnmappedSiteGroup | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  function startEdit(site: UnmappedSiteGroup) {
    setEditingSite(site);
    setLatInput('');
    setLngInput('');
    setError('');
    setSuccessMsg('');
  }

  async function handleSaveCoordinates(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSite) return;

    setError('');
    setSuccessMsg('');

    const lat = parseFloat(latInput.trim());
    const lng = parseFloat(lngInput.trim());

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setSaving(true);
    try {
      await siteService.update(editingSite.siteId, editingSite.version, {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      });

      setSuccessMsg(`Coordinates set for ${editingSite.siteName}! Updating map...`);
      setTimeout(() => {
        setEditingSite(null);
        onLocationSaved();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coordinates');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <MapPinOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Sites Missing Coordinates ({unmappedSites.length})
              </h3>
              <p className="text-xs text-slate-500">
                These installation sites are not yet mapped. Add verified coordinates to display them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list or edit form */}
        <div className="p-5 overflow-y-auto flex-1">
          {editingSite ? (
            <form onSubmit={handleSaveCoordinates} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <p className="font-semibold text-slate-900">{editingSite.siteName}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {editingSite.addressLine1}, {editingSite.city}, {editingSite.state} {editingSite.postalCode}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Customer: <span className="font-medium">{editingSite.customerName}</span>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude (-90 to 90)"
                  placeholder="e.g. 17.4947"
                  value={latInput}
                  onChange={e => setLatInput(e.target.value)}
                  required
                />
                <Input
                  label="Longitude (-180 to 180)"
                  placeholder="e.g. 78.3578"
                  value={lngInput}
                  onChange={e => setLngInput(e.target.value)}
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: Coordinates must be verified site coordinates. Do not guess or submit random coordinates.
              </p>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingSite(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                >
                  Save Coordinates
                </Button>
              </div>
            </form>
          ) : (
            <>
              {unmappedSites.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-800">All installation sites have coordinates!</p>
                  <p className="text-xs text-slate-400 mt-1">No unmapped installations found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {unmappedSites.map(site => (
                    <div key={site.siteId} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm">{site.siteName}</p>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                            {site.installationCount} {site.installationCount === 1 ? 'job' : 'jobs'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {site.addressLine1}, {site.city}, {site.state} {site.postalCode}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Customer: <span className="text-slate-600 font-medium">{site.customerName}</span>
                        </p>
                      </div>

                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(site)}
                          className="shrink-0 flex items-center gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Set Coordinates</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

