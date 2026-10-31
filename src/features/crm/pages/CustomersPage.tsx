/**
 * src/features/crm/pages/CustomersPage.tsx
 * Customer management list with search, filtering, and role-based actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search, Eye, Edit } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { customerService } from '../services/customerService';
import type { CustomerSummary, CustomerType, CustomerStatus } from '../types/customer.types';
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_COLOURS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLOURS,
} from '../types/customer.types';

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    customerService.getCities().then(setCities).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true);
        const res = await customerService.list({
          search,
          customerType,
          status,
          city,
          page,
          pageSize,
        });
        setCustomers(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, [search, customerType, status, city, page]);

  const columns: Column<CustomerSummary>[] = [
    {
      key: 'customerId',
      header: 'Customer ID',
      className: 'font-mono text-xs text-slate-500 w-28',
    },
    {
      key: 'fullName',
      header: 'Customer Name',
      render: (item) => (
        <div>
          <Link to={`/crm/customers/${item.id}`} className="font-semibold text-slate-800 hover:text-green-600 block">
            {item.fullName}
          </Link>
          {item.email && <span className="text-xs text-slate-400 block">{item.email}</span>}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      className: 'whitespace-nowrap',
    },
    {
      key: 'customerType',
      header: 'Type',
      render: (item) => (
        <Badge
          label={CUSTOMER_TYPE_LABELS[item.customerType]}
          className={CUSTOMER_TYPE_COLOURS[item.customerType]}
        />
      ),
    },
    {
      key: 'city',
      header: 'City',
      render: (item) => item.city || '—',
    },
    {
      key: 'numberOfSites',
      header: 'Sites',
      render: (item) => (
        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
          {item.numberOfSites}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          label={CUSTOMER_STATUS_LABELS[item.status]}
          className={CUSTOMER_STATUS_COLOURS[item.status]}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/crm/customers/${item.id}`} title="View Details">
            <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-slate-800">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <PermissionGuard module="customers" require="full">
            <Link to={`/crm/customers/${item.id}/edit`} title="Edit Customer">
              <Button size="sm" variant="ghost" className="p-1.5 text-slate-500 hover:text-green-600">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">Manage all registered solar installation customers and prospects.</p>
        </div>
        <PermissionGuard module="customers" require="full">
          <Link to="/crm/customers/new">
            <Button size="sm" variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}>
              Add Customer
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <Input
            placeholder="Search by name, phone or email..."
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
            { value: '', label: 'All Customer Types' },
            ...Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={customerType}
          onChange={(e) => {
            setCustomerType(e.target.value as CustomerType | '');
            setPage(1);
          }}
        />
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            ...Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CustomerStatus | '');
            setPage(1);
          }}
        />
        <Select
          options={[{ value: '', label: 'All Cities' }, ...cities.map((c) => ({ value: c, label: c }))]}
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No customers matched your filter criteria."
      />
    </div>
  );
}
