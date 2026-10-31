/**
 * SurveyForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Create Site Survey request form.
 * Links to existing M01 Customers, allows site selection or inline site registration,
 * surveyor assignment, and solar requirements intake.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { customerService } from '../../crm/services/customerService';
import { siteService } from '../services/siteService';
import type { CustomerSummary } from '../../crm/types/customer.types';
import type { Site, PropertyType } from '../types/site.types';
import type { CreateSurveyRequestData, SurveyPriority } from '../types/survey.types';
import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';
import {
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
} from '../../crm/types/enquiry.types';

interface SurveyFormProps {
  onSubmit: (data: CreateSurveyRequestData) => Promise<void>;
  isLoading?: boolean;
}

export function SurveyForm({ onSubmit, isLoading }: SurveyFormProps) {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Inline site creation toggle
  const [isAddingNewSite, setIsAddingNewSite] = useState(false);
  const [newSiteData, setNewSiteData] = useState({
    siteName: '',
    addressLine1: '',
    city: '',
    state: 'Kerala',
    pinCode: '',
    propertyType: 'residential' as PropertyType,
    contactPersonOnSite: '',
    contactPhoneOnSite: '',
  });

  const [formData, setFormData] = useState<CreateSurveyRequestData>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    siteId: '',
    siteName: '',
    siteLocation: '',
    propertyType: 'residential',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    preferredTime: '10:00',
    assignedSurveyorId: 'mock-user-003',
    assignedSurveyorName: 'Sara Surveyor',
    priority: 'medium',
    instructions: '',
    systemType: 'on_grid',
    requestedCapacity: '3kw',
    customRequestedCapacity: '',
    estimatedMonthlyBill: undefined,
    customerRequirements: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    customerService.list({ pageSize: 100 }).then((res) => setCustomers(res.data));
  }, []);

  const handleCustomerChange = async (custId: string) => {
    setSelectedCustomerId(custId);
    setSelectedSiteId('');
    setIsAddingNewSite(false);

    if (!custId) {
      setSites([]);
      return;
    }

    const cust = await customerService.getById(custId);
    const custSites = await siteService.getByCustomerId(custId);

    setSites(custSites);

    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.fullName,
        customerPhone: cust.phone,
        customerEmail: cust.email ?? '',
      }));
    }

    // If customer has at least 1 site, select it
    if (custSites.length > 0) {
      handleSiteSelect(custSites[0].id, custSites);
    } else {
      // Default to adding new site
      setIsAddingNewSite(true);
      if (cust) {
        setNewSiteData((prev) => ({
          ...prev,
          siteName: `${cust.fullName}'s Property`,
          addressLine1: cust.addressLine1 || '',
          city: cust.city || '',
          contactPersonOnSite: cust.contactPerson || cust.fullName,
          contactPhoneOnSite: cust.phone,
        }));
      }
    }
  };

  const handleSiteSelect = (siteId: string, currentSites = sites) => {
    setSelectedSiteId(siteId);
    const site = currentSites.find((s) => s.id === siteId);
    if (site) {
      setFormData((prev) => ({
        ...prev,
        siteId: site.id,
        siteName: site.siteName,
        siteLocation: `${site.addressLine1}, ${site.city}`,
        propertyType: site.propertyType,
      }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.customerId) errs.customerId = 'Please select a customer';
    if (!isAddingNewSite && !selectedSiteId) errs.siteId = 'Please select an installation site';

    if (isAddingNewSite) {
      if (!newSiteData.siteName.trim()) errs.siteName = 'Site name is required';
      if (!newSiteData.addressLine1.trim()) errs.addressLine1 = 'Address line is required';
      if (!newSiteData.city.trim()) errs.city = 'City is required';
      if (!newSiteData.contactPhoneOnSite.trim()) errs.contactPhoneOnSite = 'Contact phone is required';
    }

    if (!formData.scheduledDate) errs.scheduledDate = 'Survey date is required';
    if (!formData.preferredTime) errs.preferredTime = 'Preferred time is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (!validate()) return;

    let targetSiteId = selectedSiteId;
    let targetSiteName = formData.siteName;
    let targetSiteLocation = formData.siteLocation;
    let targetPropertyType = formData.propertyType;

    // Handle on-the-fly site registration
    if (isAddingNewSite) {
      const createdSite = await siteService.create({
        ...newSiteData,
        customerId: formData.customerId,
      });
      targetSiteId = createdSite.id;
      targetSiteName = createdSite.siteName;
      targetSiteLocation = `${createdSite.addressLine1}, ${createdSite.city}`;
      targetPropertyType = createdSite.propertyType;
    }

    await onSubmit({
      ...formData,
      siteId: targetSiteId,
      siteName: targetSiteName,
      siteLocation: targetSiteLocation,
      propertyType: targetPropertyType,
      saveAsDraft,
    });
  };

  return (
    <form className="space-y-6" noValidate>
      {/* 1. Customer Information */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          A. Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Select
              label="Select Customer"
              required
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.fullName} (${c.phone}) - ${c.customerId}`,
              }))}
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              placeholder="-- Choose a registered customer --"
              error={errors.customerId}
            />
          </div>

          <Input label="Customer Name" value={formData.customerName} disabled />
          <Input label="Contact Phone" value={formData.customerPhone} disabled />
        </div>
      </Card>

      {/* 2. Installation Site Selection / Creation */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">B. Installation Site Information</h3>
          {selectedCustomerId && (
            <button
              type="button"
              onClick={() => setIsAddingNewSite(!isAddingNewSite)}
              className="text-xs font-semibold text-green-600 hover:text-green-700 underline"
            >
              {isAddingNewSite ? 'Select Existing Site' : '+ Register New Site'}
            </button>
          )}
        </div>

        {!isAddingNewSite ? (
          <div className="space-y-3">
            <Select
              label="Select Installation Site"
              required
              options={sites.map((s) => ({
                value: s.id,
                label: `${s.siteName} (${s.addressLine1}, ${s.city})`,
              }))}
              value={selectedSiteId}
              onChange={(e) => handleSiteSelect(e.target.value)}
              placeholder="-- Choose property rooftop / site --"
              error={errors.siteId}
              disabled={!selectedCustomerId}
            />
            {sites.length === 0 && selectedCustomerId && (
              <p className="text-xs text-amber-600">
                No site registered for this customer yet. Click "Register New Site" above.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <Input
              label="Site Name / Building Label"
              required
              placeholder="e.g. Main Residence Rooftop"
              value={newSiteData.siteName}
              error={errors.siteName}
              onChange={(e) => setNewSiteData({ ...newSiteData, siteName: e.target.value })}
            />
            <Select
              label="Property Type"
              options={[
                { value: 'residential', label: 'Residential' },
                { value: 'commercial', label: 'Commercial' },
              ]}
              value={newSiteData.propertyType}
              onChange={(e) =>
                setNewSiteData({ ...newSiteData, propertyType: e.target.value as PropertyType })
              }
            />
            <Input
              label="Address Line 1"
              required
              placeholder="House, building, street"
              value={newSiteData.addressLine1}
              error={errors.addressLine1}
              onChange={(e) => setNewSiteData({ ...newSiteData, addressLine1: e.target.value })}
            />
            <Input
              label="City"
              required
              placeholder="e.g. Kochi"
              value={newSiteData.city}
              error={errors.city}
              onChange={(e) => setNewSiteData({ ...newSiteData, city: e.target.value })}
            />
            <Input
              label="Contact Person on Site"
              placeholder="e.g. Caretaker / Resident"
              value={newSiteData.contactPersonOnSite}
              onChange={(e) =>
                setNewSiteData({ ...newSiteData, contactPersonOnSite: e.target.value })
              }
            />
            <Input
              label="Contact Phone on Site"
              required
              placeholder="10-digit number"
              value={newSiteData.contactPhoneOnSite}
              error={errors.contactPhoneOnSite}
              onChange={(e) =>
                setNewSiteData({ ...newSiteData, contactPhoneOnSite: e.target.value })
              }
            />
          </div>
        )}
      </Card>

      {/* 3. Survey Scheduling */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          C. Survey Scheduling & Surveyor Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Survey Date"
            required
            type="date"
            value={formData.scheduledDate}
            error={errors.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          />
          <Input
            label="Preferred Time"
            required
            type="time"
            value={formData.preferredTime}
            error={errors.preferredTime}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
          />
          <Select
            label="Assigned Surveyor"
            options={[
              { value: 'mock-user-003', label: 'Sara Surveyor (Primary)' },
              { value: 'mock-user-001', label: 'Alex Administrator (Backup)' },
            ]}
            value={formData.assignedSurveyorId}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignedSurveyorId: e.target.value,
                assignedSurveyorName:
                  e.target.value === 'mock-user-003' ? 'Sara Surveyor' : 'Alex Administrator',
              })
            }
          />
          <Select
            label="Priority Level"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as SurveyPriority })
            }
          />
          <div className="md:col-span-2">
            <Textarea
              label="Special Instructions for Surveyor"
              placeholder="e.g. Parapet shadow observations, customer requested ladder for terrace access..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* 4. Solar Requirements */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          D. Solar Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Solar System Type"
            options={Object.entries(SYSTEM_TYPE_LABELS).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            value={formData.systemType}
            onChange={(e) => setFormData({ ...formData, systemType: e.target.value as SystemType })}
          />
          <Select
            label="Requested Capacity"
            options={Object.entries(CAPACITY_LABELS).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            value={formData.requestedCapacity}
            onChange={(e) =>
              setFormData({ ...formData, requestedCapacity: e.target.value as CapacityOption })
            }
          />
          <Input
            label="Monthly Electricity Bill (₹)"
            type="number"
            placeholder="e.g. 4000"
            value={formData.estimatedMonthlyBill ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedMonthlyBill: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <Input
            label="Specific Customer Requests"
            placeholder="e.g. Hybrid inverter, monocrystalline bifacial"
            value={formData.customerRequirements}
            onChange={(e) => setFormData({ ...formData, customerRequirements: e.target.value })}
          />
        </div>
      </Card>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isLoading}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={(e) => handleSubmit(e, false)}
          isLoading={isLoading}
        >
          Create Survey Request
        </Button>
      </div>
    </form>
  );
}

