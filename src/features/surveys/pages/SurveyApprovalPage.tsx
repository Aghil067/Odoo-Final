/**
 * SurveyApprovalPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Dedicated dashboard for Admins and Management to review surveys
 * submitted by field surveyors, verify feasibility ratings, and grant clearance.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle2 } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import { useAuth } from '../../auth/hooks/useAuth';
import { surveyService } from '../services/surveyService';
import type { Survey } from '../types/survey.types';
import {
  FEASIBILITY_STATUS_LABELS,
  FEASIBILITY_STATUS_COLOURS,
} from '../types/survey.types';
import { CAPACITY_LABELS } from '../../crm/types/enquiry.types';

export function SurveyApprovalPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Inline decision state
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'reinspection'>('approve');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        // Load surveys with status = submitted
        const res = await surveyService.list({ status: 'submitted' });
        setSurveys(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load surveys awaiting approval', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDecisionConfirm = async () => {
    if (!selectedSurvey || !user) return;
    try {
      setIsSubmitting(true);
      if (decisionType === 'approve') {
        await surveyService.approve(selectedSurvey.id, user.id, user.name);
      } else if (decisionType === 'reject') {
        await surveyService.reject(selectedSurvey.id, user.id, user.name, reason);
      } else {
        await surveyService.requestReinspection(selectedSurvey.id, user.id, user.name, reason);
      }

      // Refresh list
      const res = await surveyService.list({ status: 'submitted' });
      setSurveys(res.data);
      setTotal(res.total);
      setSelectedSurvey(null);
      setReason('');
    } catch (err) {
      console.error('Decision failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Survey>[] = [
    {
      key: 'surveyId',
      header: 'Survey ID',
      className: 'font-mono text-xs text-slate-500 w-28',
    },
    {
      key: 'customerName',
      header: 'Customer & Property',
      render: (item) => (
        <div>
          <Link to={`/surveys/${item.id}`} className="font-semibold text-slate-800 hover:text-green-600 block">
            {item.customerName}
          </Link>
          <span className="text-xs text-slate-400 block truncate max-w-xs">{item.siteLocation}</span>
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
      key: 'feasibility',
      header: 'Feasibility Verdict',
      render: (item) => (
        item.feasibility ? (
          <Badge
            label={FEASIBILITY_STATUS_LABELS[item.feasibility.feasibilityStatus]}
            className={FEASIBILITY_STATUS_COLOURS[item.feasibility.feasibilityStatus]}
          />
        ) : (
          <span className="text-xs text-slate-400">Not recorded</span>
        )
      ),
    },
    {
      key: 'requestedCapacity',
      header: 'Capacity',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">
            Req: {CAPACITY_LABELS[item.requestedCapacity] || item.requestedCapacity}
          </span>
          <span className="text-green-700">
            Rec: {item.feasibility?.recommendedCapacityKw ? `${item.feasibility.recommendedCapacityKw} kW` : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Submitted Date',
      render: (item) => (
        <span className="text-xs text-slate-500">{new Date(item.updatedAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Approval Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/surveys/${item.id}`} title="Review Details">
            <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-slate-800">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-green-700 border-green-300 hover:bg-green-50 py-1 px-2.5"
            onClick={() => {
              setSelectedSurvey(item);
              setDecisionType('approve');
              setReason('');
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-red-600 hover:bg-red-50 py-1 px-2"
            onClick={() => {
              setSelectedSurvey(item);
              setDecisionType('reject');
              setReason('');
            }}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-amber-600 hover:bg-amber-50 py-1 px-2"
            onClick={() => {
              setSelectedSurvey(item);
              setDecisionType('reinspection');
              setReason('');
            }}
          >
            Reinspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Survey Approval Center</h1>
          <p className="text-sm text-slate-500">
            Verify field measurements, roof integrity, and sign off on site feasibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-violet-100 text-violet-800 px-3 py-1 rounded-full">
            {total} Pending Approval
          </span>
        </div>
      </div>

      {/* Decision Dialog Drawer */}
      {selectedSurvey && (
        <Card className="border-green-300 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {decisionType === 'approve'
              ? `Confirm Approval for ${selectedSurvey.surveyId}`
              : decisionType === 'reject'
              ? `Reject Survey ${selectedSurvey.surveyId}`
              : `Request Reinspection for ${selectedSurvey.surveyId}`}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Customer: {selectedSurvey.customerName} ({selectedSurvey.siteName})
          </p>

          {decisionType !== 'approve' && (
            <div className="mb-3">
              <Textarea
                label={decisionType === 'reject' ? 'Rejection Reason' : 'Reinspection Instructions'}
                required
                placeholder="Explain the required modifications, safety considerations, or reasons..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedSurvey(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={decisionType === 'approve' ? 'primary' : 'danger'}
              onClick={handleDecisionConfirm}
              isLoading={isSubmitting}
              disabled={decisionType !== 'approve' && !reason.trim()}
            >
              Confirm {decisionType === 'approve' ? 'Approval' : decisionType === 'reject' ? 'Rejection' : 'Request'}
            </Button>
          </div>
        </Card>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={surveys}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No surveys are currently awaiting approval."
      />
    </div>
  );
}
