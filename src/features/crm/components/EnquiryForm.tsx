/**
 * src/features/crm/components/EnquiryForm.tsx
 * Create and edit Enquiry with existing or inline customer options.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { customerService } from '../services/customerService';
import type { CustomerSummary } from '../types/customer.types';
import type {
  Enquiry,
  EnquiryFormData,
  SystemType,
  CapacityOption,
  PropertyType,
  LeadSource,
  EnquiryPriority,
  EnquiryStatus,
} from '../types/enquiry.types';
import {
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
  PROPERTY_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  PRIORITY_LABELS,
  ENQUIRY_STATUS_LABELS,
} from '../types/enquiry.types';

interface EnquiryFormProps {
  initialData?: Enquiry;
  onSubmit: (data: EnquiryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EnquiryForm({ initialData, onSubmit, isLoading }: EnquiryFormProps) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialData?.customerId ?? '');

  const [formData, setFormData] = useState<EnquiryFormData>({
    customerId: initialData?.customerId ?? '',
    customerName: initialData?.customerName ?? '',
    customerPhone: initialData?.customerPhone ?? '',
    customerEmail: initialData?.customerEmail ?? '',
    systemType: initialData?.systemType ?? 'on_grid',
    capacityOption: initialData?.capacityOption ?? '3kw',
    customCapacity: initialData?.customCapacity ?? '',
    propertyType: initialData?.propertyType ?? 'residential',
    installationLocation: initialData?.installationLocation ?? '',
    monthlyElectricityBill: initialData?.monthlyElectricityBill ?? undefined,
    requirements: initialData?.requirements ?? '',
    leadSource: initialData?.leadSource ?? 'website',
    assignedTo: initialData?.assignedTo ?? 'user-sales-01',
    enquiryDate: initialData?.enquiryDate ? initialData.enquiryDate.split('T')[0] : new Date().toISOString().split('T')[0],
    nextFollowUpDate: initialData?.nextFollowUpDate ?? '',
    priority: initialData?.priority ?? 'medium',
    status: initialData?.status ?? 'new',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await customerService.list({ pageSize: 100 });
        setCustomers(res.data);
      } catch (err) {
        console.error('Failed to load customers', err);
      }
    }
    loadCustomers();
  }, []);

  const handleCustomerSelect = async (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = await customerService.getById(custId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.fullName,
        customerPhone: cust.phone,
        customerEmail: cust.email ?? '',
        installationLocation: prev.installationLocation || `${cust.addressLine1 ? cust.addressLine1 + ', ' : ''}${cust.city || ''}`,
      }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      errs.customerName = 'Customer name is required';
    }

    if (!formData.customerPhone.trim()) {
      errs.customerPhone = 'Customer phone is required';
    }

    if (!formData.installationLocation.trim()) {
      errs.installationLocation = 'Installation location is required';
    }

    if (formData.capacityOption === 'custom' && !formData.customCapacity?.trim()) {
      errs.customCapacity = 'Please specify custom capacity';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.fullName} (${c.phone}) - ${c.customerId}`,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Customer Selection / Info */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Customer Information</h3>
          {!initialData && (
            <Link
              to="/crm/customers/new"
              className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
            >
              + Create New Customer
            </Link>
          )}
        </div>

        {!initialData && (
          <div className="mb-4">
            <Select
              label="Select Existing Customer"
              options={customerOptions}
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              placeholder="-- Search / Select a Customer --"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Customer Name"
            required
            value={formData.customerName}
            error={errors.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="Full Name"
          />
          <Input
            label="Phone Number"
            required
            type="tel"
            value={formData.customerPhone}
            error={errors.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="10-digit number"
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="name@example.com"
          />
        </div>
      </Card>

      {/* Solar Requirements */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Solar System Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="System Type"
            options={Object.entries(SYSTEM_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.systemType}
            onChange={(e) => setFormData({ ...formData, systemType: e.target.value as SystemType })}
          />

          <Select
            label="Property Type"
            options={Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.propertyType}
            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
          />

          <Select
            label="Required Capacity"
            options={Object.entries(CAPACITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.capacityOption}
            onChange={(e) => setFormData({ ...formData, capacityOption: e.target.value as CapacityOption })}
          />

          {formData.capacityOption === 'custom' && (
            <Input
              label="Custom Capacity (kW)"
              required
              value={formData.customCapacity}
              error={errors.customCapacity}
              onChange={(e) => setFormData({ ...formData, customCapacity: e.target.value })}
              placeholder="e.g. 15 kW"
            />
          )}

          <Input
            label="Monthly Electricity Bill (₹)"
            type="number"
            value={formData.monthlyElectricityBill ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                monthlyElectricityBill: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="e.g. 4500"
          />

          <div className="md:col-span-2">
            <Input
              label="Installation Location / Address"
              required
              value={formData.installationLocation}
              error={errors.installationLocation}
              onChange={(e) => setFormData({ ...formData, installationLocation: e.target.value })}
              placeholder="Site address for installation"
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Requirements / Notes"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Specific roof structure, shadow concerns, brand preferences..."
            />
          </div>
        </div>
      </Card>

      {/* Sales Information */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Sales & Pipeline Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Lead Source"
            options={Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.leadSource}
            onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSource })}
          />

          <Select
            label="Priority"
            options={Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as EnquiryPriority })}
          />

          <Input
            label="Enquiry Date"
            type="date"
            value={formData.enquiryDate}
            onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
          />

          <Input
            label="Next Follow-up Date"
            type="date"
            value={formData.nextFollowUpDate}
            onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
          />

          {initialData && (
            <Select
              label="Enquiry Status"
              options={Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EnquiryStatus })}
            />
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Enquiry' : 'Create Enquiry'}
        </Button>
      </div>
    </form>
  );
}

