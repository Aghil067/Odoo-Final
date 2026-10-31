/**
 * InstallationExecutionPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Mobile and tablet friendly on-site execution interface for technicians and managers.
 * Integrates:
 *   - Site and customer dossier
 *   - Step-by-step checklist milestones
 *   - Time tracking
 *   - Categorized photo uploads
 *   - On-site issue and obstacle reporting
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  MapPin,
  Phone,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { Installation } from '../types/installation.types';
import type {
  InstallationExecutionData,
  ChecklistItemStatus,
  InstallationPhoto,
  InstallationIssue,
  IssueSeverity,
} from '../types/execution.types';
import { installationService } from '../services/installationService';
import { installationExecutionService } from '../services/installationExecutionService';
import { ExecutionChecklist } from '../components/ExecutionChecklist';
import { TimeTrackingForm } from '../components/TimeTrackingForm';
import { InstallationPhotoUpload } from '../components/InstallationPhotoUpload';
import { Button } from '../../../components/ui/Button';

export function InstallationExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [installation, setInstallation] = useState<Installation | null>(null);
  const [execution, setExecution] = useState<InstallationExecutionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab inside execution screen: checklist | time | photos | issues
  const [activeTab, setActiveTab] = useState<'checklist' | 'time' | 'photos' | 'issues'>('checklist');

  // Issue modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('medium');
  const [issueAction, setIssueAction] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

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
        console.error('Failed to load execution data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Loading on-site execution workspace...
      </div>
    );
  }

  if (!installation || !execution) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 space-y-3">
        <p>Installation work order not found.</p>
        <Link to="/installations">
          <Button size="sm" variant="outline">
            Return to Work Orders
          </Button>
        </Link>
      </div>
    );
  }

  // Checklist update handler
  const handleUpdateChecklistItem = async (
    itemId: string,
    status: ChecklistItemStatus,
    remarks?: string
  ) => {
    const updatedList = await installationExecutionService.updateChecklistItem(
      installation.id,
      itemId,
      status,
      remarks,
      'Ramesh Patel'
    );
    setExecution((prev) => (prev ? { ...prev, checklists: updatedList } : null));

    // If installation was scheduled, transition to in_progress automatically
    if (installation.status === 'scheduled') {
      const refreshedInst = await installationService.updateStatus(
        installation.id,
        'in_progress',
        'Field work checklist initiated by technician',
        'Ramesh Patel'
      );
      setInstallation(refreshedInst);
    }
  };

  // Add time record handler
  const handleAddTimeRecord = async (rec: Parameters<typeof installationExecutionService.addTimeRecord>[1]) => {
    const newRecord = await installationExecutionService.addTimeRecord(installation.id, rec);
    setExecution((prev) =>
      prev ? { ...prev, timeRecords: [newRecord, ...prev.timeRecords] } : null
    );
  };

  // Add photo handler
  const handleAddPhoto = async (photoData: Omit<InstallationPhoto, 'id' | 'uploadedAt'>) => {
    const newPhoto = await installationExecutionService.addPhoto(installation.id, photoData);
    setExecution((prev) =>
      prev ? { ...prev, photos: [newPhoto, ...prev.photos] } : null
    );
  };

  // Delete photo handler
  const handleDeletePhoto = async (photoId: string) => {
    await installationExecutionService.deletePhoto(installation.id, photoId);
    setExecution((prev) =>
      prev ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) } : null
    );
  };

  // Report Issue handler
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDesc.trim()) return;

    try {
      setIsSubmittingIssue(true);
      const newIssue = await installationExecutionService.addIssue(installation.id, {
        title: issueTitle,
        description: issueDesc,
        severity: issueSeverity,
        actionTaken: issueAction.trim() || undefined,
        reportedBy: 'Ramesh Patel',
      });
      setExecution((prev) =>
        prev ? { ...prev, issues: [newIssue, ...prev.issues] } : null
      );
      setShowIssueModal(false);
      setIssueTitle('');
      setIssueDesc('');
      setIssueAction('');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Resolve Issue handler
  const handleResolveIssue = async (issue: InstallationIssue) => {
    const action = prompt('Enter resolution action taken:', 'Resolved on site');
    if (!action) return;

    const resolved = await installationExecutionService.resolveIssue(
      installation.id,
      issue.id,
      action,
      'Ramesh Patel'
    );
    setExecution((prev) =>
      prev
        ? {
            ...prev,
            issues: prev.issues.map((i) => (i.id === issue.id ? resolved : i)),
          }
        : null
    );
  };

  const completedChecklistCount = execution.checklists.filter((i) => i.status === 'completed').length;
  const isReadyForHandover = completedChecklistCount >= 8;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top back & Quick Nav */}
      <div className="flex items-center justify-between">
        <Link
          to={`/installations/${installation.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Field Screen to Dossier</span>
        </Link>

        {isReadyForHandover && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/installations/${installation.id}/completion`)}
            rightIcon={<FileCheck2 className="w-4 h-4" />}
          >
            Go to Customer Sign-off
          </Button>
        )}
      </div>

      {/* SECTION A: Field Site Dossier Card */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {installation.installationId}
              </span>
              <h2 className="text-base font-bold text-white">
                {installation.customerName}
              </h2>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{installation.siteAddress}, {installation.siteCity}</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {installation.systemCapacity} • {installation.systemType.replace('_', ' ').toUpperCase()}
            </span>
            <div className="text-[11px] text-slate-400 mt-1">
              Team: <strong>{installation.schedule.assignedTeam || 'Alpha Crew'}</strong>
            </div>
          </div>
        </div>

        {/* Contact info and special instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Contact: <strong>{installation.siteContact.contactPerson}</strong> (
              <a
                href={`tel:${installation.siteContact.contactNumber}`}
                className="text-emerald-400 underline font-mono"
              >
                {installation.siteContact.contactNumber}
              </a>
              )
            </span>
          </div>

          {installation.specialInstructions && (
            <div className="text-amber-200/90 text-[11px] bg-amber-950/40 p-2 rounded border border-amber-900/60">
              <strong>Instructions:</strong> {installation.specialInstructions}
            </div>
          )}
        </div>
      </div>

      {/* Field Navigation Tabs (Touch Friendly) */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'checklist'
              ? 'bg-green-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Checklist ({completedChecklistCount}/{execution.checklists.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('time')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'time'
              ? 'bg-green-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Work Time ({execution.timeRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'photos'
              ? 'bg-green-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Photos ({execution.photos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'issues'
              ? 'bg-green-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Issues ({execution.issues.length})</span>
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'checklist' && (
        <ExecutionChecklist
          items={execution.checklists}
          onUpdateItem={handleUpdateChecklistItem}
        />
      )}

      {activeTab === 'time' && (
        <TimeTrackingForm
          records={execution.timeRecords}
          onAddTimeRecord={handleAddTimeRecord}
        />
      )}

      {activeTab === 'photos' && (
        <InstallationPhotoUpload
          photos={execution.photos}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {activeTab === 'issues' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                On-site Issues & Obstacles
              </h3>
              <p className="text-xs text-slate-500">
                Log unforeseen site obstructions, shading, or electrical challenges encountered
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowIssueModal(true)}
            >
              Log Issue
            </Button>
          </div>

          {execution.issues.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-slate-700">No issues reported</p>
              <p>Everything is progressing smoothly on site.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {execution.issues.map((iss) => (
                <div
                  key={iss.id}
                  className={`border rounded-lg p-3.5 text-xs space-y-2 ${
                    iss.status === 'resolved'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            iss.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : iss.severity === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iss.severity}
                        </span>
                        <h4 className="font-semibold text-slate-900">
                          {iss.title}
                        </h4>
                      </div>
                      <p className="text-slate-600 mt-1">{iss.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          iss.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {iss.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {iss.actionTaken && (
                    <div className="bg-white/80 p-2 rounded border border-slate-200 text-slate-700">
                      <strong>Action Taken:</strong> {iss.actionTaken}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>
                      Reported by {iss.reportedBy} on {new Date(iss.reportedAt).toLocaleDateString()}
                    </span>
                    {iss.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleResolveIssue(iss)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Report On-site Observation or Issue
            </h3>

            <form onSubmit={handleCreateIssue} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  required
                  placeholder="e.g. Tree branch casting shade on Panel 4"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Severity Level *
                </label>
                <select
                  value={issueSeverity}
                  onChange={(e) => setIssueSeverity(e.target.value as IssueSeverity)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="low">Low (Minor remark)</option>
                  <option value="medium">Medium (Requires adjustment)</option>
                  <option value="high">High (Delay hazard)</option>
                  <option value="critical">Critical (Safety hazard / pause work)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  required
                  placeholder="Explain what was observed and how it impacts installation..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Immediate Action Taken (Optional)
                </label>
                <input
                  type="text"
                  value={issueAction}
                  onChange={(e) => setIssueAction(e.target.value)}
                  placeholder="e.g. Trimmed branch with customer approval"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowIssueModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={isSubmittingIssue}
                  isLoading={isSubmittingIssue}
                >
                  Save Issue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

