/**
 * src/features/crm/components/CustomerForm.tsx
 * Customer creation and editing form with full validation.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import type { Customer, CustomerFormData, CustomerType, CustomerSource, CustomerStatus } from '../types/customer.types';
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_LABELS,
} from '../types/customer.types';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerFormData>({
    customerType: initialData?.customerType ?? 'individual',
    fullName: initialData?.fullName ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    phone: initialData?.phone ?? '',
    alternatePhone: initialData?.alternatePhone ?? '',
    email: initialData?.email ?? '',
    gstNumber: initialData?.gstNumber ?? '',
    addressLine1: initialData?.addressLine1 ?? '',
    addressLine2: initialData?.addressLine2 ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? 'Kerala',
    pinCode: initialData?.pinCode ?? '',
    country: initialData?.country ?? 'India',
    source: initialData?.source ?? 'website',
    notes: initialData?.notes ?? '',
    status: initialData?.status ?? 'prospect',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name / Business Name is required';
    }

    if (formData.customerType !== 'individual' && !formData.contactPerson?.trim()) {
      errs.contactPerson = 'Contact Person is required for business/organization';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.alternatePhone?.trim() && !/^\d{10}$/.test(formData.alternatePhone.replace(/[\s-]/g, ''))) {
      errs.alternatePhone = 'Please enter a valid 10-digit alternate phone number';
    }

    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const typeOptions = Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const sourceOptions = Object.entries(CUSTOMER_SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const statusOptions = Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Basic Details */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Basic Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Customer Type"
            required
            options={typeOptions}
            value={formData.customerType}
            onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
          />

          <Input
            label={formData.customerType === 'individual' ? 'Full Name' : 'Business / Organization Name'}
            required
            value={formData.fullName}
            error={errors.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder={formData.customerType === 'individual' ? 'e.g. Rahul Sharma' : 'e.g. Apex Tech Ltd'}
          />

          {formData.customerType !== 'individual' && (
            <Input
              label="Contact Person"
              required
              value={formData.contactPerson}
              error={errors.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Rajesh Kumar (Manager)"
            />
          )}

          <Input
            label="Phone Number"
            required
            type="tel"
            value={formData.phone}
            error={errors.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="10-digit mobile number"
          />

          <Input
            label="Alternate Phone Number"
            type="tel"
            value={formData.alternatePhone}
            error={errors.alternatePhone}
            onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
            placeholder="Optional 10-digit number"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            error={errors.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@example.com"
          />

          {formData.customerType !== 'individual' && (
            <Input
              label="GST Number"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              placeholder="e.g. 32AAAAA0000A1Z5"
            />
          )}

          <Select
            label="Customer Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
          />
        </div>
      </Card>

      {/* Address Details */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Address Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Address Line 1"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="House / Building / Street"
          />
          <Input
            label="Address Line 2"
            value={formData.addressLine2}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apartment, suite, unit, etc."
          />
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Kochi"
          />
          <Input
            label="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="e.g. Kerala"
          />
          <Input
            label="PIN Code"
            value={formData.pinCode}
            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
            placeholder="6-digit PIN code"
          />
          <Input
            label="Country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
      </Card>

      {/* Additional Details */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Additional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Customer Source"
            options={sourceOptions}
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value as CustomerSource })}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific instructions, context, or requirements..."
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Customer' : 'Save Customer'}
        </Button>
      </div>
    </form>
  );
}

