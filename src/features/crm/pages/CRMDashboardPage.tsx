/**
 * src/features/crm/pages/CRMDashboardPage.tsx
 * CRM Dashboard overview with KPI stats, pipeline status, recent activities, and quick actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  PlusCircle,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { customerService } from '../services/customerService';
import { enquiryService } from '../services/enquiryService';
import { followUpService } from '../services/followUpService';
import type { CustomerSummary } from '../types/customer.types';
import type { EnquirySummary } from '../types/enquiry.types';
import type { FollowUp } from '../types/followUp.types';
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLOURS,
  PIPELINE_STAGES,
} from '../types/enquiry.types';
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_TYPE_COLOURS,
} from '../types/followUp.types';

export function CRMDashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEnquiries: 0,
    newEnquiries: 0,
    qualifiedLeads: 0,
    wonEnquiries: 0,
    pendingFollowUps: 0,
    overdueFollowUps: 0,
  });

  const [pipelineData, setPipelineData] = useState<Record<string, number>>({});
  const [recentCustomers, setRecentCustomers] = useState<CustomerSummary[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<EnquirySummary[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [custRes, enqStats, fuStats, recentCust, recentEnq, dueFu] = await Promise.all([
          customerService.list({ pageSize: 1 }),
          enquiryService.getDashboardStats(),
          followUpService.getDashboardStats(),
          customerService.list({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          enquiryService.list({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          followUpService.list({ pageSize: 5, dateFilter: 'upcoming' }),
        ]);

        setStats({
          totalCustomers: custRes.total,
          totalEnquiries: enqStats.total,
          newEnquiries: enqStats.newCount,
          qualifiedLeads: enqStats.qualified,
          wonEnquiries: enqStats.won,
          pendingFollowUps: fuStats.pending,
          overdueFollowUps: fuStats.overdue,
        });

        setPipelineData(enqStats.byStatus);
        setRecentCustomers(recentCust.data);
        setRecentEnquiries(recentEnq.data);
        setUpcomingFollowUps(dueFu.data);
      } catch (err) {
        console.error('Error loading CRM Dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer & CRM Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of SunPower Solutions sales pipeline, active enquiries, and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard module="customers" require="full">
            <Link to="/crm/customers/new">
              <Button size="sm" variant="outline" leftIcon={<UserPlus className="w-4 h-4" />}>
                Add Customer
              </Button>
            </Link>
          </PermissionGuard>
          <PermissionGuard module="customers" require="full">
            <Link to="/crm/enquiries/new">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create Enquiry
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Demo Notice:</strong> All metrics, figures, and lead conversion rates represent development test data for SunPower Solutions.
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card padding={false} className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Customers</span>
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.totalCustomers}</div>
          <span className="text-[11px] text-slate-400">Registered records</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Enquiries</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.totalEnquiries}</div>
          <span className="text-[11px] text-slate-400">All-time leads</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">New Enquiries</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.newEnquiries}</div>
          <span className="text-[11px] text-slate-400">Awaiting contact</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Qualified Leads</span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.qualifiedLeads}</div>
          <span className="text-[11px] text-slate-400">High solar potential</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Follow-ups Due</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.pendingFollowUps}</div>
          <span className="text-[11px] text-amber-600">
            {stats.overdueFollowUps > 0 ? `${stats.overdueFollowUps} overdue` : 'On track'}
          </span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Won / Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.wonEnquiries}</div>
          <span className="text-[11px] text-slate-400">Ready for survey/install</span>
        </Card>
      </div>

      {/* Sales Pipeline Funnel / Distribution */}
      <Card>
        <CardHeader
          title="Sales Pipeline Distribution"
          subtitle="Real-time volume of active solar enquiries across lifecycle stages"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {PIPELINE_STAGES.map((stg) => {
            const count = pipelineData[stg] ?? 0;
            return (
              <div
                key={stg}
                className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg p-3 text-center flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-slate-600 truncate">{ENQUIRY_STATUS_LABELS[stg]}</span>
                <span className="text-xl font-bold text-slate-800 my-1">{isLoading ? '—' : count}</span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-full rounded-full transition-all"
                    style={{
                      width: `${stats.totalEnquiries > 0 ? Math.min((count / stats.totalEnquiries) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grid: Recent Enquiries, Follow-ups, and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enquiries */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Enquiries"
            action={
              <Link to="/crm/enquiries" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {recentEnquiries.map((enq) => (
              <div key={enq.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <Link to={`/crm/enquiries/${enq.id}`} className="font-medium text-slate-800 hover:text-green-600">
                    {enq.customerName}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {enq.enquiryId} • {enq.capacityOption.toUpperCase()} • {enq.installationLocation}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={ENQUIRY_STATUS_LABELS[enq.status]} className={ENQUIRY_STATUS_COLOURS[enq.status]} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader
            title="Upcoming Follow-ups"
            action={
              <Link to="/crm/follow-ups" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {upcomingFollowUps.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No upcoming tasks scheduled</div>
            ) : (
              upcomingFollowUps.map((fu) => (
                <div key={fu.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">{fu.customerName}</span>
                    <Badge label={FOLLOW_UP_TYPE_LABELS[fu.type]} className={FOLLOW_UP_TYPE_COLOURS[fu.type]} />
                  </div>
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>
                      {fu.followUpDate} at {fu.followUpTime}
                    </span>
                    <span className="text-slate-400 truncate max-w-[120px]">{fu.notes || 'No agenda note'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recently Added Customers */}
      <Card>
        <CardHeader
          title="Recently Added Customers"
          subtitle="Latest client profiles onboarded onto SunPower Solutions"
          action={
            <Link to="/crm/customers" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
              View all customers <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-y border-slate-100">
              <tr>
                <th className="py-2 px-3">Customer ID</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">City</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{c.customerId}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    <Link to={`/crm/customers/${c.id}`} className="hover:text-green-600">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3">{c.phone}</td>
                  <td className="py-2.5 px-3">{c.city || '—'}</td>
                  <td className="py-2.5 px-3 capitalize">{c.customerType}</td>
                  <td className="py-2.5 px-3">
                    <Badge
                      label={c.status}
                      className={c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

