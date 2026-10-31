/**
 * SurveysPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive data table for all site surveys with search, filters, and actions.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Eye, Edit } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { useAuth } from '../../auth/hooks/useAuth';
import { surveyService } from '../services/surveyService';
import type { Survey, SurveyStatus } from '../types/survey.types';
import {
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_COLOURS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLOURS,
} from '../types/survey.types';
import { SYSTEM_TYPE_LABELS, CAPACITY_LABELS } from '../../crm/types/enquiry.types';

export function SurveysPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SurveyStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        // If logged-in user is a surveyor, default filter to their assigned surveys
        const surveyorFilter = user?.role === 'surveyor' ? user.id : undefined;

        const res = await surveyService.list({
          search,
          status,
          surveyorId: surveyorFilter,
          page,
          pageSize,
        });
        setSurveys(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load surveys', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [search, status, page, user]);

  const columns: Column<Survey>[] = [
    {
      key: 'surveyId',
      header: 'Survey ID',
      className: 'font-mono text-xs text-slate-500 w-28',
    },
    {
      key: 'customerName',
      header: 'Customer & Site',
      render: (item) => (
        <div>
          <Link
            to={`/surveys/${item.id}`}
            className="font-semibold text-slate-800 hover:text-green-600 block"
          >
            {item.customerName}
          </Link>
          <span className="text-xs text-slate-400 block truncate max-w-xs">{item.siteLocation}</span>
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Visit Schedule',
      render: (item) => (
        <div className="text-xs">
          <span className="font-medium text-slate-700 block">{item.scheduledDate}</span>
          <span className="text-slate-400">{item.preferredTime}</span>
        </div>
      ),
    },
    {
      key: 'assignedSurveyorName',
      header: 'Surveyor',
      render: (item) => (
        <span className="text-xs font-medium text-slate-700">{item.assignedSurveyorName}</span>
      ),
    },
    {
      key: 'systemType',
      header: 'Solar Specs',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">
            {CAPACITY_LABELS[item.requestedCapacity] || item.requestedCapacity}
          </span>
          <span className="text-slate-400">{SYSTEM_TYPE_LABELS[item.systemType]}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Survey Status',
      render: (item) => (
        <Badge
          label={SURVEY_STATUS_LABELS[item.status]}
          className={SURVEY_STATUS_COLOURS[item.status]}
        />
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (item) => (
        <Badge
          label={APPROVAL_STATUS_LABELS[item.approval.approvalStatus]}
          className={APPROVAL_STATUS_COLOURS[item.approval.approvalStatus]}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => {
        const canEdit =
          user?.role === 'admin' ||
          (user?.role === 'surveyor' &&
            item.status !== 'approved' &&
            item.status !== 'rejected' &&
            item.status !== 'cancelled');

        return (
          <div className="flex items-center justify-end gap-1">
            <Link to={`/surveys/${item.id}`} title="View Details">
              <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-slate-800">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            {canEdit && (
              <Link to={`/surveys/${item.id}/edit`} title="Record Findings">
                <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-green-600">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Site Surveys</h1>
          <p className="text-sm text-slate-500">
            {user?.role === 'surveyor'
              ? 'Inspections and feasibility assessments assigned to you.'
              : 'Physical site assessments, shadow calculations, and rooftop records.'}
          </p>
        </div>

        <PermissionGuard module="site_survey" require="assigned_only">
          <Link to="/surveys/new">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Survey Request
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by ID, customer name, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All Survey Statuses' },
            ...Object.entries(SURVEY_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SurveyStatus | '');
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={surveys}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No site surveys match your search criteria."
      />
    </div>
  );
}

