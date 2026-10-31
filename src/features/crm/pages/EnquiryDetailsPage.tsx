/**
 * src/features/crm/pages/EnquiryDetailsPage.tsx
 * Comprehensive detail view for an Enquiry with stage pipeline, status change actions, follow-up scheduling, and customer reference.
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Zap,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { enquiryService } from '../services/enquiryService';
import { followUpService } from '../services/followUpService';
import { EnquiryPipeline } from '../components/EnquiryPipeline';
import { FollowUpForm } from '../components/FollowUpForm';
import type { Enquiry, EnquiryStatus } from '../types/enquiry.types';
import type { FollowUp, FollowUpFormData } from '../types/followUp.types';
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLOURS,
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
  PROPERTY_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLOURS,
} from '../types/enquiry.types';
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_TYPE_COLOURS,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_STATUS_COLOURS,
} from '../types/followUp.types';

export function EnquiryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change State
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EnquiryStatus>('new');
  const [lostReason, setLostReason] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Follow-up scheduling modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [enqData, fuList] = await Promise.all([
          enquiryService.getById(id),
          followUpService.list({ search: id }),
        ]);
        setEnquiry(enqData);
        if (enqData) setSelectedStatus(enqData.status);
        setFollowUps(fuList.data);
      } catch (err) {
        console.error('Failed to load enquiry details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePipelineStatusClick = async (newStatus: EnquiryStatus) => {
    if (!id || !enquiry) return;
    try {
      const updated = await enquiryService.updateStatus(id, { status: newStatus,version:enquiry?.version });
      setEnquiry(updated);
      setSelectedStatus(newStatus);
    } catch (err) {
      console.error('Failed to update pipeline stage', err);
    }
  };

  const handleStatusSubmit = async () => {
    if (!id || !enquiry) return;
    try {
      setStatusUpdateLoading(true);
      const updated = await enquiryService.updateStatus(id, {
        version:enquiry?.version,
        status: selectedStatus,
        lostReason: selectedStatus === 'lost' ? lostReason : undefined,
      });
      setEnquiry(updated);
      setIsChangingStatus(false);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleScheduleFollowUp = async (formData: FollowUpFormData) => {
    if (!enquiry) return;
    try {
      const created = await followUpService.create({
        ...formData,
        customerId: enquiry.customerId,
        enquiryId: enquiry.id,
      });
      setFollowUps((prev) => [created, ...prev]);
      setShowFollowUpModal(false);
    } catch (err) {
      console.error('Failed to schedule follow-up', err);
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-sm text-slate-500">Loading solar enquiry details...</div>;
  }

  if (!enquiry) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Enquiry Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/crm/enquiries')}>
          Back to Enquiries
        </Button>
      </div>
    );
  }

  const allStatuses = Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate('/crm/enquiries')} className="p-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{enquiry.enquiryId}</h1>
              <Badge label={ENQUIRY_STATUS_LABELS[enquiry.status]} className={ENQUIRY_STATUS_COLOURS[enquiry.status]} />
              <Badge label={PRIORITY_LABELS[enquiry.priority]} className={PRIORITY_COLOURS[enquiry.priority]} />
            </div>
            <p className="text-xs text-slate-400">
              Created on {new Date(enquiry.createdAt).toLocaleDateString()} • Assigned to {enquiry.assignedToName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard module="customers" require="full">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Clock className="w-4 h-4" />}
              onClick={() => setIsChangingStatus(!isChangingStatus)}
            >
              Update Status
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => setShowFollowUpModal(!showFollowUpModal)}
            >
              Schedule Follow-up
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Interactive Pipeline Stage Progress Indicator */}
      <Card>
        <CardHeader
          title="Sales Pipeline Progression"
          subtitle="Click on any stage to quickly advance the enquiry or update workflow status"
        />
        <EnquiryPipeline currentStatus={enquiry.status} onStatusChange={handlePipelineStatusClick} />
      </Card>

      {/* Won or Lost Banner Notices */}
      {enquiry.status === 'won' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Enquiry Converted Successfully!</h4>
            <p className="text-xs text-emerald-700">
              This lead has confirmed the rooftop installation agreement. Site survey and technician installation scheduling can now proceed in future modules.
            </p>
          </div>
        </div>
      )}

      {enquiry.status === 'lost' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Enquiry Marked as Lost</h4>
            <p className="text-xs text-red-700">
              Reason: {enquiry.lostReason || 'No specific lost reason documented.'}
            </p>
          </div>
        </div>
      )}

      {/* Status Update Card */}
      {isChangingStatus && (
        <Card className="bg-slate-50 border-green-300">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Change Enquiry Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <Select
              label="Select New Status"
              options={allStatuses}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as EnquiryStatus)}
            />

            {selectedStatus === 'lost' && (
              <Textarea
                label="Reason for Lost Enquiry"
                placeholder="Competitor price, budget issue, roof unsuitable..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsChangingStatus(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleStatusSubmit} isLoading={statusUpdateLoading}>
              Confirm Status
            </Button>
          </div>
        </Card>
      )}

      {/* Follow-up Scheduling Section */}
      {showFollowUpModal && (
        <Card className="bg-slate-50 border-green-300">
          <CardHeader title="Schedule Sales Follow-up" />
          <FollowUpForm
            customerId={enquiry.customerId}
            enquiryId={enquiry.id}
            onSubmit={handleScheduleFollowUp}
            onCancel={() => setShowFollowUpModal(false)}
          />
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Solar Specs & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Solar Technical Requirements" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">System Type</span>
                  <span className="font-semibold text-slate-800">{SYSTEM_TYPE_LABELS[enquiry.systemType]}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Required Capacity</span>
                  <span className="font-semibold text-slate-800">
                    {enquiry.capacityOption === 'custom'
                      ? enquiry.customCapacity
                      : CAPACITY_LABELS[enquiry.capacityOption]}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Property Type</span>
                <span className="font-medium text-slate-800">{(enquiry.propertyType?PROPERTY_TYPE_LABELS[enquiry.propertyType]:'Not recorded')}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Avg Monthly Bill</span>
                <span className="font-medium text-slate-800">
                  {enquiry.monthlyElectricityBill ? `₹${enquiry.monthlyElectricityBill.toLocaleString()}` : 'Not provided'}
                </span>
              </div>

              <div className="sm:col-span-2 flex items-start gap-3 pt-2 border-t border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Installation Address / Roof Site</span>
                  <span className="font-medium text-slate-800">{enquiry.installationLocation}</span>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">Customer Requirements & Site Notes</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                  {enquiry.requirements || 'No specific notes recorded for this enquiry.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Follow-ups linked to this enquiry */}
          <Card>
            <CardHeader
              title="Enquiry Follow-ups"
              subtitle="Task history and upcoming appointments for this solar lead"
            />
            {followUps.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No follow-ups logged for this enquiry.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {followUps.map((fu) => (
                  <div key={fu.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{fu.followUpId}</span>
                        <Badge label={FOLLOW_UP_TYPE_LABELS[fu.type]} className={FOLLOW_UP_TYPE_COLOURS[fu.type]} />
                        <Badge label={FOLLOW_UP_STATUS_LABELS[fu.status]} className={FOLLOW_UP_STATUS_COLOURS[fu.status]} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {fu.followUpDate} at {fu.followUpTime} • {fu.notes}
                      </div>
                      {fu.outcomeNote && (
                        <div className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 mt-1 inline-block">
                          Outcome: {fu.outcomeNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Customer Card & Meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Customer Profile" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <Link
                  to={`/crm/customers/${enquiry.customerId}`}
                  className="font-bold text-slate-800 hover:text-green-600"
                >
                  {enquiry.customerName}
                </Link>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{enquiry.customerPhone}</span>
              </div>

              {enquiry.customerEmail && (
                <div className="text-xs text-slate-500 truncate">
                  Email: {enquiry.customerEmail}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <Link to={`/crm/customers/${enquiry.customerId}`}>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    View Full Customer Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Sales Attribution" />
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Lead Source</span>
                <span className="font-semibold text-slate-700">{LEAD_SOURCE_LABELS[enquiry.leadSource]}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Representative</span>
                <span className="font-semibold text-slate-700">{enquiry.assignedToName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Enquiry Date</span>
                <span className="font-semibold text-slate-700">{new Date(enquiry.enquiryDate).toLocaleDateString()}</span>
              </div>
              {enquiry.nextFollowUpDate && (
                <div>
                  <span className="text-slate-400 block">Next Follow-up Due</span>
                  <span className="font-semibold text-amber-600">{enquiry.nextFollowUpDate}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
