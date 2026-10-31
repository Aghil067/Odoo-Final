/**
 * SurveyDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Overview dashboard for M02: Site Survey Management.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { surveyService } from '../services/surveyService';
import type { Survey } from '../types/survey.types';
import {
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_COLOURS,
  FEASIBILITY_STATUS_LABELS,
  FEASIBILITY_STATUS_COLOURS,
} from '../types/survey.types';

export function SurveyDashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    inProgress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    reinspection: 0,
  });

  const [recentSurveys, setRecentSurveys] = useState<Survey[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [dashboardStats, recentRes, pendingApprovalRes] = await Promise.all([
          surveyService.getDashboardStats(),
          surveyService.list({ pageSize: 5 }),
          surveyService.list({ status: 'submitted', pageSize: 5 }),
        ]);

        setStats(dashboardStats);
        setRecentSurveys(recentRes.data);
        setAwaitingApproval(pendingApprovalRes.data);
      } catch (err) {
        console.error('Failed to load survey dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Site Survey Dashboard</h1>
          <p className="text-sm text-slate-500">
            Physical rooftop inspections, structural evaluations, and engineering approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard module="site_survey" require="full">
            <Link to="/surveys/approvals">
              <Button size="sm" variant="outline" leftIcon={<ShieldCheck className="w-4 h-4" />}>
                Review Approvals ({stats.submitted})
              </Button>
            </Link>
          </PermissionGuard>

          <PermissionGuard module="site_survey" require="assigned_only">
            <Link to="/surveys/new">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create Survey Request
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Demo Data Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Demo Notice:</strong> All technical survey findings and feasibility ratings reflect development test data.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding={false} className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Surveys</span>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.total}</div>
          <span className="text-[11px] text-slate-400">All properties</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Scheduled</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.scheduled}</div>
          <span className="text-[11px] text-slate-400">Awaiting visit</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.inProgress}</div>
          <span className="text-[11px] text-slate-400">Inspecting on site</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">For Approval</span>
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.submitted}</div>
          <span className="text-[11px] text-violet-600 font-semibold">Requires review</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stats.approved}</div>
          <span className="text-[11px] text-green-600">Ready for quotation</span>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Rejected / Re-insp.</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {isLoading ? '—' : stats.rejected + stats.reinspection}
          </div>
          <span className="text-[11px] text-red-600">{stats.rejected} rejected</span>
        </Card>
      </div>

      {/* Grid: Awaiting Approval & Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surveys Awaiting Approval */}
        <Card>
          <CardHeader
            title="Surveys Submitted for Approval"
            subtitle="Inspections completed by surveyors requiring engineering sign-off"
            action={
              <Link
                to="/surveys/approvals"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                View Approvals <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {awaitingApproval.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No surveys currently awaiting approval.
              </div>
            ) : (
              awaitingApproval.map((srv) => (
                <div key={srv.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <Link
                      to={`/surveys/${srv.id}`}
                      className="font-semibold text-slate-800 hover:text-green-600 block"
                    >
                      {srv.surveyId} - {srv.customerName}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {srv.siteLocation} • Surveyor: {srv.assignedSurveyorName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {srv.feasibility && (
                      <Badge
                        label={FEASIBILITY_STATUS_LABELS[srv.feasibility.feasibilityStatus]}
                        className={FEASIBILITY_STATUS_COLOURS[srv.feasibility.feasibilityStatus]}
                      />
                    )}
                    <Link to={`/surveys/${srv.id}`}>
                      <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Site Inspections */}
        <Card>
          <CardHeader
            title="Recent Inspections"
            subtitle="Latest properties evaluated across regions"
            action={
              <Link
                to="/surveys"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                View all surveys <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {recentSurveys.map((srv) => (
              <div key={srv.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <Link
                    to={`/surveys/${srv.id}`}
                    className="font-medium text-slate-800 hover:text-green-600"
                  >
                    {srv.customerName} ({srv.surveyId})
                  </Link>
                  <div className="text-xs text-slate-400">
                    Date: {srv.scheduledDate} • {srv.siteName}
                  </div>
                </div>
                <Badge
                  label={SURVEY_STATUS_LABELS[srv.status]}
                  className={SURVEY_STATUS_COLOURS[srv.status]}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
