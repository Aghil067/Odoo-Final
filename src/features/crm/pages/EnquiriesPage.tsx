/**
 * src/features/crm/pages/EnquiriesPage.tsx
 * List all solar sales enquiries with search, filters, pipeline badges, and detail views.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Eye } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {Card} from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { enquiryService } from '../services/enquiryService';
import type {
  EnquirySummary,
  EnquiryStatus,
  SystemType,
} from '../types/enquiry.types';
import {
  ENQUIRY_STATUS_LABELS,
  CRM_ENQUIRY_STATUSES,
  ENQUIRY_STATUS_COLOURS,
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLOURS,
} from '../types/enquiry.types';

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquirySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error,setError]=useState(''),[retry,setRetry]=useState(0);

  // Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnquiryStatus | ''>('');
  const [systemType, setSystemType] = useState<SystemType | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function loadEnquiries() {
      try {
        setIsLoading(true);setError('');
        const res = await enquiryService.list({
          search,
          status,
          systemType,
          page,
          pageSize,
        });
        setEnquiries(res.data);
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof Error?err.message:'The requested records are unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEnquiries();
  }, [search, status, systemType, page,retry]);

  const columns: Column<EnquirySummary>[] = [
    {
      key: 'enquiryId',
      header: 'Enquiry ID',
      className: 'font-mono text-xs text-slate-500 w-28',
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (item) => (
        <div>
          <Link to={`/crm/enquiries/${item.id}`} className="font-semibold text-slate-800 hover:text-green-600 block">
            {item.customerName}
          </Link>
          <span className="text-xs text-slate-400 block">{item.customerPhone}</span>
        </div>
      ),
    },
    {
      key: 'systemType',
      header: 'Solar Specs',
      render: (item) => (
        <div className="text-xs">
          <span className="font-medium text-slate-700 block">
            {CAPACITY_LABELS[item.capacityOption] || item.capacityOption}
          </span>
          <span className="text-slate-400">{SYSTEM_TYPE_LABELS[item.systemType]}</span>
        </div>
      ),
    },
    {
      key: 'installationLocation',
      header: 'Location',
      className: 'text-xs text-slate-600 max-w-xs truncate',
    },
    {
      key: 'assignedToName',
      header: 'Sales Rep',
      render: (item) => <span className="text-xs font-medium text-slate-700">{item.assignedToName}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <Badge label={PRIORITY_LABELS[item.priority]} className={PRIORITY_COLOURS[item.priority]} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          label={ENQUIRY_STATUS_LABELS[item.status]}
          className={ENQUIRY_STATUS_COLOURS[item.status]}
        />
      ),
    },
    {
      key: 'nextFollowUpDate',
      header: 'Follow-up Due',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.nextFollowUpDate ? item.nextFollowUpDate : 'None scheduled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <Link to={`/crm/enquiries/${item.id}`} title="View Details">
          <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-slate-800">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enquiries</h1>
          <p className="text-sm text-slate-500">Track and manage prospective solar installation leads.</p>
        </div>
        <PermissionGuard module="customers" require="full">
          <Link to="/crm/enquiries/new">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Enquiry
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <Input
            placeholder="Search by ID, customer name, or phone..."
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
            { value: '', label: 'All Statuses' },
            ...Object.entries(ENQUIRY_STATUS_LABELS).filter(([k])=>CRM_ENQUIRY_STATUSES.includes(k as EnquiryStatus)).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EnquiryStatus | '');
            setPage(1);
          }}
        />
        <Select
          options={[
            { value: '', label: 'All System Types' },
            ...Object.entries(SYSTEM_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={systemType}
          onChange={(e) => {
            setSystemType(e.target.value as SystemType | '');
            setPage(1);
          }}
        />
      </div>

      {/* Main Table */}
      {error?<Card><p role="alert" className="text-red-700">{error}</p><Button onClick={()=>setRetry(v=>v+1)}>Retry Records</Button></Card>:<DataTable
        columns={columns}
        data={enquiries}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No solar enquiries matched your criteria."
      />}
    </div>
  );
}

