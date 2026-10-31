/**
 * InstallationDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Installation Dossier for Module M05: Installation Management.
 * Provides deep links into M01 Customer, M02 Survey, M03 Configuration,
 * and M04 Warehouse Stock Issues & Serial numbers.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  User,
  MapPin,
  ClipboardCheck,
  Sun,
  Layers,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Truck,
  FileCheck2,
} from 'lucide-react';
import type { Installation, InstallationStatus } from '../types/installation.types';
import type { InstallationExecutionData } from '../types/execution.types';
import { installationService } from '../services/installationService';
import { installationExecutionService } from '../services/installationExecutionService';
import { materialReadinessService } from '../services/materialReadinessService';
import { InstallationProgress } from '../components/InstallationProgress';
import { MaterialReadinessPanel } from '../components/MaterialReadinessPanel';
import { MaterialIssuePanel } from '../components/MaterialIssuePanel';
import { InstallationTimeline } from '../components/InstallationTimeline';
import { ExecutionChecklist } from '../components/ExecutionChecklist';
import { InstallationPhotoUpload } from '../components/InstallationPhotoUpload';
import { TimeTrackingForm } from '../components/TimeTrackingForm';
import { Button } from '../../../components/ui/Button';

type DossierTab =
  | 'overview'
  | 'materials'
  | 'execution'
  | 'photos'
  | 'time'
  | 'completion'
  | 'timeline';

export function InstallationDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [installation, setInstallation] = useState<Installation | null>(null);
  const [execution, setExecution] = useState<InstallationExecutionData | null>(null);
  const [activeTab, setActiveTab] = useState<DossierTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [inst, exec] = await Promise.all([
          installationService.getById(id),
          installationExecutionService.getExecution(id),
        ]);
        setInstallation(inst);
        setExecution(exec);
      } catch (err) {
        console.error('Failed to load installation dossier', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading installation dossier...
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 space-y-3">
        <p>Installation work order not found.</p>
        <Link to="/installations">
          <Button size="sm" variant="outline">
            Return to Work Orders
          </Button>
        </Link>
      </div>
    );
  }

  // Status transition handler
  const handleStatusChange = async (newStatus: InstallationStatus, notes?: string) => {
    const updated = await installationService.updateStatus(
      installation.id,
      newStatus,
      notes,
      'Kavita Menon'
    );
    setInstallation(updated);
  };

  // Re-check materials with M04 inventory
  const handleRefreshReadiness = async () => {
    const report = await materialReadinessService.evaluateReadiness(
      installation.id,
      installation.materials
    );
    const updated = await installationService.update(installation.id, {
      overallMaterialReadiness: report.overallStatus,
      materials: report.items,
    });
    setInstallation(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/installations"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {installation.installationId}
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                {installation.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong>{installation.customerName}</strong> • Site: {installation.siteCity}, {installation.siteState}
            </p>
          </div>
        </div>

        {/* Quick Execution & Completion Actions */}
        <div className="flex items-center gap-2">
          <Link to={`/installations/${installation.id}/execution`}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              Field Execution Screen
            </Button>
          </Link>

          <Link to={`/installations/${installation.id}/completion`}>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Sign-off & Commissioning
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Workflow Progress Tracker */}
      <InstallationProgress
        currentStatus={installation.status}
        canManage={true}
        onStatusChange={handleStatusChange}
      />

      {/* Tab Navigation Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Overview & System Linkages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'materials'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>BOM & Material Issues ({installation.materials.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'execution'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Checklist & Issues ({execution?.checklists.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Photos ({execution?.photos.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('time')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'time'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Crew Time Logs ({execution?.timeRecords.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completion')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'completion'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Handover & Sign-off</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-green-600 text-green-700 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Activity Log ({installation.activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Customer, Survey, Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Site Integration Card (M01) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Customer & Installation Site (M01 CRM)
                  </h3>
                </div>
                <Link
                  to={`/crm/customers/${installation.customerId}`}
                  className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Customer Record</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Customer Name:</span>
                  <div className="font-semibold text-slate-800 text-sm">{installation.customerName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <div className="font-semibold text-slate-800 font-mono">{installation.customerPhone}</div>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <div className="font-semibold text-slate-800">{installation.customerEmail || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Site Contact Person:</span>
                  <div className="font-semibold text-slate-800">
                    {installation.siteContact.contactPerson} ({installation.siteContact.contactNumber})
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Installation Site Address:</span>
                  <div className="font-medium text-slate-800 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{installation.siteAddress}, {installation.siteCity}, {installation.siteState} {installation.sitePincode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Survey Card (M02) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Approved Technical Feasibility Survey (M02)
                  </h3>
                </div>
                <Link
                  to={`/surveys/${installation.surveyId}`}
                  className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Survey Report</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Survey Ref:</span>
                  <div className="font-mono font-bold text-slate-800">{installation.surveyRef}</div>
                </div>
                <div>
                  <span className="text-slate-400">Survey Date:</span>
                  <div className="font-semibold text-slate-800">{installation.surveyDate || '2026-10-18'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Surveyor:</span>
                  <div className="font-semibold text-slate-800">{installation.surveyorName || 'Vikram Singh'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Roof Area:</span>
                  <div className="font-semibold text-slate-800">{installation.availableRoofAreaSqFt || 600} sq.ft</div>
                </div>
              </div>
            </div>

            {/* Solar Configuration & BOM Card (M03) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Solar System Configuration & BOM (M03)
                  </h3>
                </div>
                <Link
                  to={`/configurations/${installation.configurationId}`}
                  className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Configuration BOM</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Config ID:</span>
                  <div className="font-mono font-bold text-slate-800">{installation.configurationRef}</div>
                </div>
                <div>
                  <span className="text-slate-400">System Capacity:</span>
                  <div className="font-bold text-emerald-700">{installation.systemCapacity}</div>
                </div>
                <div>
                  <span className="text-slate-400">System Type:</span>
                  <div className="font-semibold text-slate-800 capitalize">{installation.systemType.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-slate-400">Template:</span>
                  <div className="font-semibold text-slate-800 truncate">{installation.templateName || 'Residential Standard'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Schedule & Crew Assignment */}
          <div className="space-y-6">
            {/* Schedule & Team Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Schedule & Team
                  </h3>
                </div>
                <Link
                  to="/installations/schedule"
                  className="text-xs text-green-700 hover:underline font-semibold"
                >
                  Calendar
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Planned Start Date:</span>
                  <div className="font-semibold text-slate-800">{installation.schedule.plannedStartDate}</div>
                </div>
                <div>
                  <span className="text-slate-400">Planned End Date:</span>
                  <div className="font-semibold text-slate-800">{installation.schedule.plannedEndDate}</div>
                </div>
                {installation.schedule.actualStartDate && (
                  <div>
                    <span className="text-slate-400">Actual Execution Started:</span>
                    <div className="font-semibold text-emerald-700">{installation.schedule.actualStartDate}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Assigned Installation Crew:</span>
                  <div className="font-semibold text-slate-800">{installation.schedule.assignedTeam || 'Unassigned (M06)'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Installation Manager:</span>
                  <div className="font-semibold text-slate-800">{installation.schedule.installationManager}</div>
                </div>
              </div>

              {/* Assigned Technicians list */}
              {installation.schedule.assignedTechnicians && installation.schedule.assignedTechnicians.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Crew Members:
                  </span>
                  <div className="space-y-1">
                    {installation.schedule.assignedTechnicians.map((tech) => (
                      <div key={tech.id} className="text-xs flex justify-between bg-slate-50 p-1.5 rounded">
                        <span className="font-medium text-slate-800">{tech.name}</span>
                        <span className="text-slate-400 text-[11px]">{tech.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Inventory & Dispatches</span>
              </div>
              <p className="text-slate-500">
                Materials are dispatched from warehouse locations via official M04 Stock Issue vouchers.
              </p>
              <Link
                to="/inventory/issues"
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <span>View M04 Stock Issues</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOM & MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <MaterialReadinessPanel
            materials={installation.materials}
            overallStatus={installation.overallMaterialReadiness}
            installationId={installation.id}
            onRefreshReadiness={handleRefreshReadiness}
          />
          <MaterialIssuePanel
            issueReferences={installation.materialIssueReferences}
            installationId={installation.id}
          />
        </div>
      )}

      {/* TAB 3: EXECUTION & CHECKLIST */}
      {activeTab === 'execution' && execution && (
        <div className="space-y-6">
          <ExecutionChecklist
            items={execution.checklists}
            onUpdateItem={async (itemId, status, remarks) => {
              const updated = await installationExecutionService.updateChecklistItem(
                installation.id,
                itemId,
                status,
                remarks,
                'Kavita Menon'
              );
              setExecution((prev) => (prev ? { ...prev, checklists: updated } : null));
            }}
          />
        </div>
      )}

      {/* TAB 4: PHOTOGRAPHS */}
      {activeTab === 'photos' && execution && (
        <InstallationPhotoUpload
          photos={execution.photos}
          onAddPhoto={async (photo) => {
            const added = await installationExecutionService.addPhoto(installation.id, photo);
            setExecution((prev) => (prev ? { ...prev, photos: [added, ...prev.photos] } : null));
          }}
          onDeletePhoto={async (photoId) => {
            await installationExecutionService.deletePhoto(installation.id, photoId);
            setExecution((prev) => (prev ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) } : null));
          }}
        />
      )}

      {/* TAB 5: TIME TRACKING */}
      {activeTab === 'time' && execution && (
        <TimeTrackingForm
          records={execution.timeRecords}
          onAddTimeRecord={async (rec) => {
            const added = await installationExecutionService.addTimeRecord(installation.id, rec);
            setExecution((prev) => (prev ? { ...prev, timeRecords: [added, ...prev.timeRecords] } : null));
          }}
        />
      )}

      {/* TAB 6: COMPLETION & SIGN-OFF */}
      {activeTab === 'completion' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link to={`/installations/${installation.id}/completion`}>
              <Button size="sm" variant="primary">
                Open Full Sign-off Screen
              </Button>
            </Link>
          </div>
          {execution?.completion ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                Submitted Completion Dossier
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>Testing: <strong className="text-emerald-700 uppercase">{execution.completion.testingResult}</strong></div>
                <div>Actual Date: <strong>{execution.completion.actualCompletionDate}</strong></div>
                <div>Customer Name: <strong>{execution.completion.customerName}</strong></div>
                <div>Customer Confirmed: <strong>{execution.completion.customerConfirmation ? 'Yes' : 'No'}</strong></div>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <strong>Remarks:</strong> {execution.completion.workCompletionRemarks}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No completion dossier has been submitted yet for this installation.
            </div>
          )}
        </div>
      )}

      {/* TAB 7: TIMELINE */}
      {activeTab === 'timeline' && (
        <InstallationTimeline activities={installation.activities} />
      )}
    </div>
  );
}

