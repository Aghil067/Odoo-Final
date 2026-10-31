/**
 * src/features/crm/pages/CustomerDetailsPage.tsx
 * Customer profile view showing overview, related enquiries, follow-ups, timeline, and edit actions.
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  PlusCircle,
  Layers,
  Building,
  User,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { customerService } from '../services/customerService';
import { enquiryService } from '../services/enquiryService';
import { followUpService } from '../services/followUpService';
import {CustomerSites} from '../components/CustomerSites';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { FollowUpForm } from '../components/FollowUpForm';
import type { Customer, CustomerActivity } from '../types/customer.types';
import type { EnquirySummary } from '../types/enquiry.types';
import type { FollowUp, FollowUpFormData } from '../types/followUp.types';
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLOURS,
  CUSTOMER_SOURCE_LABELS,
} from '../types/customer.types';
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLOURS,
} from '../types/enquiry.types';
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_TYPE_COLOURS,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_STATUS_COLOURS,
} from '../types/followUp.types';

export function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [enquiries, setEnquiries] = useState<EnquirySummary[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'followups' | 'notes'>('overview');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [c, enqList, fuList, actList] = await Promise.all([
          customerService.getById(id),
          enquiryService.getByCustomerId(id),
          followUpService.getByCustomerId(id),
          customerService.getActivity(id),
        ]);
        setCustomer(c);
        setEnquiries(enqList);
        setFollowUps(fuList);
        setActivities(actList);
      } catch (err) {
        console.error('Failed to load customer profile', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleCreateFollowUp = async (formData: FollowUpFormData) => {
    if (!customer) return;
    try {
      const created = await followUpService.create({ ...formData, customerId: customer.id });
      setFollowUps((prev) => [created, ...prev]);
      setShowFollowUpForm(false);
    } catch (err) {
      console.error('Error creating follow up', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading customer profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Customer Not Found</h2>
        <p className="text-slate-500 mb-4">The customer you are looking for does not exist or has been removed.</p>
        <Button variant="primary" onClick={() => navigate('/crm/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <CustomerSites customerId={customer.id}/>
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate('/crm/customers')} className="p-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{customer.fullName}</h1>
              <Badge label={CUSTOMER_STATUS_LABELS[customer.status]} className={CUSTOMER_STATUS_COLOURS[customer.status]} />
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>{customer.customerId}</span>
              <span>•</span>
              <span className="capitalize">{customer.customerType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard module="customers" require="full">
            <Link to={`/crm/enquiries/new?customerId=${customer.id}`}>
              <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New Enquiry
              </Button>
            </Link>
            <Link to={`/crm/customers/${customer.id}/edit`}>
              <Button size="sm" variant="primary" leftIcon={<Edit className="w-4 h-4" />}>
                Edit Customer
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'enquiries'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Enquiries ({enquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'followups'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Follow-ups ({followUps.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 px-4 border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Notes & History
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-4">
            <CardHeader title="Contact Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="font-medium">{customer.phone}</span>
                </div>
              </div>

              {customer.alternatePhone && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs text-slate-400 block">Alternate Phone</span>
                    <span className="font-medium">{customer.alternatePhone}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Email Address</span>
                  <span className="font-medium">{customer.email || '—'}</span>
                </div>
              </div>

              {customer.contactPerson && (
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs text-slate-400 block">Contact Person</span>
                    <span className="font-medium">{customer.contactPerson}</span>
                  </div>
                </div>
              )}

              {customer.gstNumber && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Building className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs text-slate-400 block">GST Number</span>
                    <span className="font-medium font-mono text-xs">{customer.gstNumber}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-700">
                <Layers className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Lead Source</span>
                  <span className="font-medium">
                    {customer.source ? CUSTOMER_SOURCE_LABELS[customer.source] : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-800 pt-3 border-t border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" /> Address Details
            </h4>
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 space-y-1">
              <div>{customer.addressLine1 || 'No street address specified'}</div>
              {customer.addressLine2 && <div>{customer.addressLine2}</div>}
              <div>
                {[customer.city, customer.state, customer.pinCode].filter(Boolean).join(', ')}
              </div>
              <div>{customer.country}</div>
            </div>
          </Card>

          {/* Quick Stats / Sites sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Solar Sites & Installations" />
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-slate-800">{customer.numberOfSites}</div>
                <div className="text-xs text-slate-400 mt-1">Sites Registered</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-700">
                Detailed site survey maps and installation plans will link here once Module M02 & M05 are active.
              </div>
            </Card>

            <Card>
              <CardHeader title="Recent Activity" />
              <ActivityTimeline activities={activities.slice(0, 3)} />
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Enquiries */}
      {activeTab === 'enquiries' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="Customer Enquiries" subtitle="All solar installation requirements logged for this customer" />
            <PermissionGuard module="customers" require="full">
              <Link to={`/crm/enquiries/new?customerId=${customer.id}`}>
                <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Enquiry
                </Button>
              </Link>
            </PermissionGuard>
          </div>

          {enquiries.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No enquiries found for this customer.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enquiries.map((enq) => (
                <div key={enq.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link to={`/crm/enquiries/${enq.id}`} className="font-semibold text-slate-800 hover:text-green-600">
                      {enq.enquiryId} - {enq.capacityOption.toUpperCase()} {enq.systemType.replace('_', ' ')}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Location: {enq.installationLocation} • Assigned to: {enq.assignedToName}
                    </div>
                  </div>
                  <Badge label={ENQUIRY_STATUS_LABELS[enq.status]} className={ENQUIRY_STATUS_COLOURS[enq.status]} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Follow-ups */}
      {activeTab === 'followups' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="Scheduled Follow-ups" subtitle="Calls, meetings and inspections scheduled for this customer" />
            <PermissionGuard module="customers" require="full">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Calendar className="w-4 h-4" />}
                onClick={() => setShowFollowUpForm(!showFollowUpForm)}
              >
                {showFollowUpForm ? 'Close Form' : 'Schedule Follow-up'}
              </Button>
            </PermissionGuard>
          </div>

          {showFollowUpForm && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Schedule Next Contact</h4>
              <FollowUpForm
                customerId={customer.id}
                onSubmit={handleCreateFollowUp}
                onCancel={() => setShowFollowUpForm(false)}
              />
            </div>
          )}

          {followUps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No follow-ups recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followUps.map((fu) => (
                <div key={fu.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{fu.followUpId}</span>
                      <Badge label={FOLLOW_UP_TYPE_LABELS[fu.type]} className={FOLLOW_UP_TYPE_COLOURS[fu.type]} />
                      <Badge label={FOLLOW_UP_STATUS_LABELS[fu.status]} className={FOLLOW_UP_STATUS_COLOURS[fu.status]} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Date: {fu.followUpDate} at {fu.followUpTime} • Notes: {fu.notes || 'None'}
                    </div>
                    {fu.outcomeNote && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1 mt-1 inline-block">
                        Outcome: {fu.outcomeNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Notes & Timeline */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="General Notes" />
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes || 'No notes documented.'}</p>
          </Card>

          <Card>
            <CardHeader title="Customer Activity Log" />
            <ActivityTimeline activities={activities} />
          </Card>
        </div>
      )}
    </div>
  );
}
