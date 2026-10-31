/**
 * src/features/crm/pages/FollowUpsPage.tsx
 * Manage customer and enquiry follow-ups with overdue, today, and upcoming filters.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { followUpService } from '../services/followUpService';
import type {
  FollowUp,
} from '../types/followUp.types';
import {
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_TYPE_COLOURS,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_STATUS_COLOURS,
} from '../types/followUp.types';

export function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Complete action modal/inline state
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFollowUps() {
      try {
        setIsLoading(true);
        const res = await followUpService.list({
          dateFilter,
          page,
          pageSize,
        });
        setFollowUps(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load follow-ups', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFollowUps();
  }, [dateFilter, page]);

  const handleMarkComplete = async (id: string) => {
    if (!outcomeNote.trim()) return;
    try {
      setIsSubmitting(true);
      await followUpService.complete(id, { outcomeNote });
      setCompletingId(null);
      setOutcomeNote('');
      // Refresh list
      const res = await followUpService.list({ dateFilter, page, pageSize });
      setFollowUps(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to complete follow-up', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await followUpService.cancel(id);
      const res = await followUpService.list({ dateFilter, page, pageSize });
      setFollowUps(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to cancel follow-up', err);
    }
  };

  const isItemOverdue = (item: FollowUp) => {
    const today = new Date().toISOString().split('T')[0];
    return item.status === 'pending' && item.followUpDate < today;
  };

  const columns: Column<FollowUp>[] = [
    {
      key: 'followUpId',
      header: 'ID',
      className: 'font-mono text-xs text-slate-500 w-24',
    },
    {
      key: 'customerName',
      header: 'Customer & Enquiry',
      render: (item) => (
        <div>
          <Link to={`/crm/customers/${item.customerId}`} className="font-semibold text-slate-800 hover:text-green-600 block">
            {item.customerName || 'Customer Record'}
          </Link>
          {item.enquiryRef && (
            <Link to={`/crm/enquiries/${item.enquiryId}`} className="text-xs text-green-600 hover:underline">
              {item.enquiryRef}
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <Badge label={FOLLOW_UP_TYPE_LABELS[item.type]} className={FOLLOW_UP_TYPE_COLOURS[item.type]} />
      ),
    },
    {
      key: 'followUpDate',
      header: 'Scheduled Date/Time',
      render: (item) => (
        <div className="text-xs">
          <div className={`font-semibold ${isItemOverdue(item) ? 'text-red-600 flex items-center gap-1' : 'text-slate-800'}`}>
            {isItemOverdue(item) && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            {item.followUpDate}
          </div>
          <span className="text-slate-400">{item.followUpTime}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          label={FOLLOW_UP_STATUS_LABELS[item.status]}
          className={FOLLOW_UP_STATUS_COLOURS[item.status]}
        />
      ),
    },
    {
      key: 'notes',
      header: 'Notes / Agenda',
      render: (item) => (
        <div className="text-xs max-w-xs">
          <p className="text-slate-600 truncate">{item.notes || '—'}</p>
          {item.outcomeNote && (
            <span className="text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 mt-0.5 inline-block text-[11px]">
              Outcome: {item.outcomeNote}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => {
        if (item.status !== 'pending') {
          return <span className="text-xs text-slate-400 italic">Closed</span>;
        }

        return (
          <PermissionGuard module="customers" require="full">
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 px-2 text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => {
                  setCompletingId(item.id);
                  setOutcomeNote('');
                }}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Complete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-slate-400 hover:text-red-600"
                onClick={() => handleCancel(item.id)}
              >
                Cancel
              </Button>
            </div>
          </PermissionGuard>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Follow-ups</h1>
          <p className="text-sm text-slate-500">Track client meetings, calls, site visits, and outcome notes.</p>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setDateFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            dateFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => {
            setDateFilter('today');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            dateFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Due Today
        </button>
        <button
          onClick={() => {
            setDateFilter('upcoming');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            dateFilter === 'upcoming' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Upcoming
        </button>
        <button
          onClick={() => {
            setDateFilter('overdue');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            dateFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-red-600 hover:bg-red-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Overdue
        </button>
      </div>

      {/* Outcome Note Prompt Dialog */}
      {completingId && (
        <Card className="border-green-300 bg-green-50/50">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Record Follow-up Outcome Note</h3>
          <Textarea
            placeholder="Summarize the client discussion, decision, agreed date, or next steps..."
            value={outcomeNote}
            onChange={(e) => setOutcomeNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => setCompletingId(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleMarkComplete(completingId)}
              isLoading={isSubmitting}
              disabled={!outcomeNote.trim()}
            >
              Save & Mark Completed
            </Button>
          </div>
        </Card>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={followUps}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No follow-up records found."
      />
    </div>
  );
}
