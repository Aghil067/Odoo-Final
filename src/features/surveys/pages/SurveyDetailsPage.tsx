/**
 * SurveyDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete Survey dossier showing overview, roof technical findings,
 * electrical measurements, feasibility verdict, photo gallery, and approval controls.
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Edit,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuth } from '../../auth/hooks/useAuth';
import { surveyService } from '../services/surveyService';
import type { Survey } from '../types/survey.types';
import {
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_COLOURS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLOURS,
  FEASIBILITY_STATUS_LABELS,
  FEASIBILITY_STATUS_COLOURS,
  PHOTO_CATEGORY_LABELS,
} from '../types/survey.types';

export function SurveyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Approval Action modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'reinspection'>('approve');
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await surveyService.getById(id);
        setSurvey(data);
      } catch (err) {
        console.error('Failed to load survey details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleExecuteApproval = async () => {
    if (!id || !user) return;
    try {
      setActionLoading(true);
      let updated: Survey;
      if (modalAction === 'approve') {
        updated = await surveyService.approve(id, user.id, user.name);
      } else if (modalAction === 'reject') {
        updated = await surveyService.reject(id, user.id, user.name, commentText);
      } else {
        updated = await surveyService.requestReinspection(id, user.id, user.name, commentText);
      }
      setSurvey(updated);
      setShowApprovalModal(false);
      setCommentText('');
    } catch (err) {
      console.error('Approval action failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-sm text-slate-500">Loading survey dossier...</div>;
  }

  if (!survey) {
    return (
      <div className="p-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Survey Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/surveys')}>
          Back to Surveys
        </Button>
      </div>
    );
  }

  const canEdit =
    user?.role === 'admin' ||
    (user?.role === 'surveyor' &&
      survey.status !== 'approved' &&
      survey.status !== 'rejected' &&
      survey.status !== 'cancelled');

  const canApprove =
    user?.role === 'admin' && survey.status === 'submitted';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate('/surveys')} className="p-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{survey.surveyId}</h1>
              <Badge
                label={SURVEY_STATUS_LABELS[survey.status]}
                className={SURVEY_STATUS_COLOURS[survey.status]}
              />
              <Badge
                label={APPROVAL_STATUS_LABELS[survey.approval.approvalStatus]}
                className={APPROVAL_STATUS_COLOURS[survey.approval.approvalStatus]}
              />
            </div>
            <p className="text-xs text-slate-400">
              Site: {survey.siteName} • Customer:{' '}
              <Link to={`/crm/customers/${survey.customerId}`} className="text-green-600 hover:underline">
                {survey.customerName}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link to={`/surveys/${survey.id}/edit`}>
              <Button size="sm" variant="outline" leftIcon={<Edit className="w-4 h-4" />}>
                Record / Edit Findings
              </Button>
            </Link>
          )}

          {canApprove && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                onClick={() => {
                  setModalAction('approve');
                  setShowApprovalModal(true);
                }}
              >
                Approve Survey
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setModalAction('reject');
                  setShowApprovalModal(true);
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Dialog */}
      {showApprovalModal && (
        <Card className="bg-slate-50 border-green-300">
          <h3 className="text-base font-bold text-slate-800 mb-2">
            {modalAction === 'approve'
              ? 'Approve Site Survey'
              : modalAction === 'reject'
              ? 'Reject Site Survey'
              : 'Request Reinspection'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {modalAction === 'approve'
              ? 'Approving this survey authorizes the sales team to proceed with quotation drafting and module layout.'
              : 'Please enter remarks explaining your decision to the assigned surveyor.'}
          </p>

          {modalAction !== 'approve' && (
            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {modalAction === 'reject' ? 'Rejection Reason (Required)' : 'Reinspection Instructions (Required)'}
              </label>
              <textarea
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                placeholder="Details..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={modalAction === 'approve' ? 'primary' : 'danger'}
              onClick={handleExecuteApproval}
              isLoading={actionLoading}
              disabled={modalAction !== 'approve' && !commentText.trim()}
            >
              Confirm {modalAction === 'approve' ? 'Approval' : modalAction === 'reject' ? 'Rejection' : 'Request'}
            </Button>
          </div>
        </Card>
      )}

      {/* Decision Notice Banners */}
      {survey.status === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">Site Survey Approved & Certified</h4>
              <p className="text-xs text-emerald-700">
                Approved by {survey.approval.approverName || 'Administrator'} on{' '}
                {new Date(survey.approval.approvalDate || survey.updatedAt).toLocaleDateString()}. This site is cleared for Solar Quotation generation.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Ready for Quote
          </span>
        </div>
      )}

      {survey.status === 'rejected' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Survey Rejected</h4>
            <p className="text-xs text-red-700">
              Reason: {survey.approval.rejectionReason || 'Site does not meet solar engineering safety standards.'}
            </p>
          </div>
        </div>
      )}

      {survey.status === 'reinspection_required' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">Reinspection Required</h4>
            <p className="text-xs text-amber-700">
              Instructions: {survey.approval.reinspectionInstructions || 'Re-evaluate rooftop shading.'}
            </p>
          </div>
        </div>
      )}

      {/* Technical Grid: Roof & Electrical */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Roof Information */}
          <Card>
            <CardHeader title="Roof & Structural Findings" />
            {survey.roofInfo ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Roof Type</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {survey.roofInfo.roofType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Roof Condition</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {survey.roofInfo.roofCondition}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Available Area</span>
                  <span className="font-semibold text-slate-800">
                    {survey.roofInfo.availableAreaSqFt} sq. ft.
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dimensions</span>
                  <span className="font-medium text-slate-700">
                    {survey.roofInfo.roofLengthFt || '—'} ft × {survey.roofInfo.roofWidthFt || '—'} ft
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Floors</span>
                  <span className="font-medium text-slate-700">
                    {survey.roofInfo.numberOfFloors} floors
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Azimuth / Orientation</span>
                  <span className="font-medium text-slate-700">
                    {survey.roofInfo.roofOrientation}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Slope</span>
                  <span className="font-medium text-slate-700 capitalize">
                    {survey.roofInfo.roofSlope.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shading Condition</span>
                  <span className="font-medium text-slate-700 capitalize">
                    {survey.roofInfo.shadingCondition.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Safe Stair Access</span>
                  <span className="font-medium text-slate-700">
                    {survey.roofInfo.roofAccessAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Nearby Obstacles & Concerns</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded">
                    {survey.roofInfo.nearbyObstacles || survey.roofInfo.structuralConcerns || 'None reported'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                On-site inspection findings have not yet been recorded.
              </div>
            )}
          </Card>

          {/* Section: Electrical Information */}
          <Card>
            <CardHeader title="Electrical Infrastructure Findings" />
            {survey.electricalInfo ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Connection Type</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {survey.electricalInfo.connectionType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sanctioned Load</span>
                  <span className="font-semibold text-slate-800">
                    {survey.electricalInfo.sanctionedLoadKw ? `${survey.electricalInfo.sanctionedLoadKw} kW` : 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Main DB Condition</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {survey.electricalInfo.mainDistributionBoardCondition.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Earthing Available</span>
                  <span className="font-medium text-slate-700">
                    {survey.electricalInfo.earthingAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Existing Inverter</span>
                  <span className="font-medium text-slate-700">
                    {survey.electricalInfo.existingInverter ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pre-existing Solar</span>
                  <span className="font-medium text-slate-700">
                    {survey.electricalInfo.existingSolarInstallation ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Electrical Observations & Cable Route</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded">
                    {survey.electricalInfo.electricalObservations || 'No specific electrical remarks'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Electrical details pending physical visit.
              </div>
            )}
          </Card>

          {/* Section: Photo Gallery */}
          <Card>
            <CardHeader
              title={`Site Photographs (${survey.photos.length})`}
              subtitle="Rooftop panoramic views, meter panels, and obstacles"
            />
            {survey.photos.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No inspection photographs uploaded for this survey.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {survey.photos.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col"
                  >
                    <div className="h-32 bg-slate-200 overflow-hidden">
                      <img src={p.url} alt={p.description || p.category} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 text-[11px]">
                      <span className="font-semibold text-slate-700 block truncate">
                        {PHOTO_CATEGORY_LABELS[p.category]}
                      </span>
                      <span className="text-slate-400 truncate block">{p.description || p.fileName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Feasibility, Site, and Attributions */}
        <div className="space-y-6">
          {/* Feasibility Verdict */}
          <Card>
            <CardHeader title="Feasibility Assessment" />
            {survey.feasibility ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Overall Verdict</span>
                  <Badge
                    label={FEASIBILITY_STATUS_LABELS[survey.feasibility.feasibilityStatus]}
                    className={FEASIBILITY_STATUS_COLOURS[survey.feasibility.feasibilityStatus]}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block">Recommended Capacity</span>
                  <span className="text-xl font-bold text-slate-800">
                    {survey.feasibility.recommendedCapacityKw} kWp
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Estimated Usable Roof Area</span>
                  <span className="font-semibold text-slate-700">
                    {survey.feasibility.estimatedUsableAreaSqFt} sq. ft.
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Surveyor Remarks</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded italic">
                    "{survey.feasibility.surveyorObservations || 'No remarks provided.'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Feasibility evaluation pending inspection.
              </div>
            )}
          </Card>

          {/* Property & Customer Card */}
          <Card>
            <CardHeader title="Property & Schedule" />
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Customer</span>
                <Link to={`/crm/customers/${survey.customerId}`} className="font-bold text-slate-800 hover:text-green-600">
                  {survey.customerName}
                </Link>
                <span className="block text-slate-400">{survey.customerPhone}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Installation Site</span>
                <span className="font-medium text-slate-700">{survey.siteName}</span>
                <span className="block text-slate-400">{survey.siteLocation}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Assigned Surveyor</span>
                <span className="font-semibold text-slate-800">{survey.assignedSurveyorName}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Scheduled Date & Time</span>
                <span className="font-semibold text-slate-800">
                  {survey.scheduledDate} at {survey.preferredTime}
                </span>
              </div>

              {survey.customerConfirmation?.confirmed && (
                <div className="pt-2 border-t border-slate-100 text-emerald-700">
                  <span className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Site Acknowledged
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Signed by {survey.customerConfirmation.representativeName}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
