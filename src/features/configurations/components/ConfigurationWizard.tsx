/**
 * ConfigurationWizard.tsx
 * ─────────────────────────────────────────────────────────────
 * 6-Step Wizard for Creating Customer Solar Configurations:
 *  - STEP 1: Select Customer (from M01)
 *  - STEP 2: Select Approved Site Survey (strictly approved M02 records)
 *  - STEP 3: Technical System Type & Capacity (with deviation warning check)
 *  - STEP 4: Select System Template (prefills components)
 *  - STEP 5: Review & Customize Component Snapshot
 *  - STEP 6: Configuration & BOM Summary
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';

import { customerService } from '../../crm/services/customerService';
import { surveyService } from '../../surveys/services/surveyService';
import { templateService } from '../services/templateService';
import { componentService } from '../services/componentService';
import { configurationService } from '../services/configurationService';

import type { CustomerSummary } from '../../crm/types/customer.types';
import type { Survey } from '../../surveys/types/survey.types';
import type { SystemTemplate, PhaseType } from '../types/template.types';
import type { SystemComponent } from '../types/component.types';
import type {
  CreateConfigurationData,
  ConfigurationComponent,
} from '../types/configuration.types';
import type { SystemType, CapacityOption } from '../../crm/types/enquiry.types';

import {
  SYSTEM_TYPE_LABELS,
  CAPACITY_LABELS,
} from '../../crm/types/enquiry.types';
import { PHASE_TYPE_LABELS } from '../types/template.types';
import { COMPONENT_CATEGORY_LABELS } from '../types/component.types';

const STEPS = [
  '1. Customer',
  '2. Approved Survey',
  '3. Specs & Sizing',
  '4. Template',
  '5. Components',
  '6. Summary & BOM',
];

export function ConfigurationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data catalogues
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [approvedSurveys, setApprovedSurveys] = useState<Survey[]>([]);
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [catalogueComponents, setCatalogueComponents] = useState<SystemComponent[]>([]);

  // Step 1: Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Step 2: Approved Survey Selection
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  // Step 3: Technical Specs
  const [configName, setConfigName] = useState('');
  const [systemType, setSystemType] = useState<SystemType>('on_grid');
  const [ratedCapacity, setRatedCapacity] = useState<CapacityOption>('3kw');
  const [phaseType, setPhaseType] = useState<PhaseType>('single_phase');
  const [configNotes, setConfigNotes] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  // Step 4: Template Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Step 5: Components Snapshot
  const [components, setComponents] = useState<ConfigurationComponent[]>([]);
  const [compToAddId, setCompToAddId] = useState('');

  // Load initial data
  useEffect(() => {
    customerService.list({ pageSize: 100 }).then((res) => setCustomers(res.data));
    templateService.list({ status: 'active', pageSize: 100 }).then((res) => setTemplates(res.data));
    componentService.list({ status: 'active', pageSize: 100 }).then((res) => setCatalogueComponents(res.data));
  }, []);

  // When customer is selected, fetch their approved surveys from M02
  const handleCustomerSelect = async (custId: string) => {
    setSelectedCustomerId(custId);
    setSelectedSurveyId('');
    setSelectedSurvey(null);

    const cust = customers.find((c) => c.id === custId) ?? null;
    setSelectedCustomer(cust);

    if (custId) {
      // Query surveys for this customer with approvalStatus = 'approved'
      const res = await surveyService.list({
        search: cust?.fullName,
        approvalStatus: 'approved',
      });
      // Further strictly filter for this customer ID & approved status
      const verifiedApproved = res.data.filter(
        (s) => s.customerId === custId && s.approval.approvalStatus === 'approved'
      );
      setApprovedSurveys(verifiedApproved);
    } else {
      setApprovedSurveys([]);
    }
  };

  // When survey is selected, prepopulate system specs & default config name
  const handleSurveySelect = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    const srv = approvedSurveys.find((s) => s.id === surveyId) ?? null;
    setSelectedSurvey(srv);

    if (srv && selectedCustomer) {
      setConfigName(`${selectedCustomer.fullName} - ${srv.requestedCapacity.toUpperCase()} Rooftop`);
      setSystemType(srv.systemType);
      setRatedCapacity(srv.requestedCapacity);
    }
  };

  // When template is selected, prefill editable components snapshot
  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      const cloned: ConfigurationComponent[] = tpl.components.map((tc) => ({
        ...tc,
        estimatedLineTotal: tc.estimatedUnitCost ? tc.estimatedUnitCost * tc.quantity : undefined,
      }));
      setComponents(cloned);
    }
  };

  // Component adjustments in Step 5
  const handleQuantityChange = (id: string, qty: number) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newQty = Math.max(1, qty);
          return {
            ...c,
            quantity: newQty,
            estimatedLineTotal: c.estimatedUnitCost ? c.estimatedUnitCost * newQty : undefined,
          };
        }
        return c;
      })
    );
  };

  const handleRemoveComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddManualComponent = () => {
    if (!compToAddId) return;
    const cat = catalogueComponents.find((c) => c.id === compToAddId);
    if (!cat) return;

    const newComp: ConfigurationComponent = {
      id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      componentId: cat.id,
      name: cat.name,
      category: cat.category,
      modelNumber: cat.modelNumber,
      specification: cat.specification,
      quantity: 1,
      unit: cat.unit,
      estimatedUnitCost: cat.estimatedUnitCost,
      estimatedLineTotal: cat.estimatedUnitCost,
    };

    setComponents((prev) => [...prev, newComp]);
    setCompToAddId('');
  };

  // Sizing discrepancy check between recommended capacity & configured capacity
  const isCapacityMismatched = () => {
    if (!selectedSurvey || !selectedSurvey.feasibility) return false;
    const recKw = selectedSurvey.feasibility.recommendedCapacityKw;
    const configuredNum = parseInt(ratedCapacity.replace('kw', ''), 10);
    return !isNaN(configuredNum) && Math.abs(configuredNum - recKw) > 0.5;
  };

  // Submission handler in Step 6
  const handleFinalSubmit = async (saveAsDraft = false) => {
    if (!selectedCustomer || !selectedSurvey) return;
    try {
      setIsSubmitting(true);
      const chosenTemplate = templates.find((t) => t.id === selectedTemplateId);

      const payload: CreateConfigurationData = {
        configurationName: configName || `${selectedCustomer.fullName} Solar System`,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.fullName,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email,
        surveyId: selectedSurvey.id,
        surveyRef: selectedSurvey.surveyId,
        siteLocation: selectedSurvey.siteLocation,
        roofType: selectedSurvey.roofInfo?.roofType ?? 'rcc_concrete',
        availableRoofAreaSqFt: selectedSurvey.roofInfo?.availableAreaSqFt ?? 400,
        recommendedCapacityKw: selectedSurvey.feasibility?.recommendedCapacityKw ?? 3.5,
        systemType,
        ratedCapacity,
        phaseType,
        templateId: chosenTemplate?.id,
        templateName: chosenTemplate?.templateName,
        components,
        notes: configNotes,
        discrepancyJustification: discrepancyReason || undefined,
        status: saveAsDraft ? 'draft' : 'ready_for_quotation',
      };

      const created = await configurationService.create(payload);
      navigate(`/configurations/${created.id}`);
    } catch (err) {
      console.error('Failed to create configuration', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = components.reduce((acc, curr) => acc + (curr.estimatedLineTotal || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Step Stepper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px]">
          {STEPS.map((stg, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <div key={stg} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-green-100 border-2 border-green-600 text-green-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : stepNum}
                  </div>
                  <span
                    className={`text-[11px] mt-1 whitespace-nowrap ${
                      isCurrent ? 'font-bold text-green-700' : 'text-slate-500'
                    }`}
                  >
                    {stg}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-4 ${
                      currentStep > stepNum ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: Select Customer ─────────────────────────────── */}
      {currentStep === 1 && (
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">
            Step 1: Select Customer
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Select the customer registered in SunPower Solutions CRM.
          </p>

          <Select
            label="Customer"
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.fullName} (${c.phone}) - ${c.customerId}`,
            }))}
            value={selectedCustomerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            placeholder="-- Choose a Customer --"
          />

          {selectedCustomer && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Customer Name</span>
                <span className="font-bold text-slate-800">{selectedCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ID</span>
                <span className="font-mono text-slate-600">{selectedCustomer.customerId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-700">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Location</span>
                <span className="font-medium text-slate-700">{selectedCustomer.city || 'Kerala'}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
            <Button
              variant="primary"
              disabled={!selectedCustomerId}
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Select Site Survey
            </Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 2: Select Approved Site Survey ─────────────────── */}
      {currentStep === 2 && (
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">
            Step 2: Select Approved Site Survey
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            System configurations require physical roof inspection sign-off from M02.
          </p>

          {approvedSurveys.length === 0 ? (
            <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-800">No Approved Site Survey Found</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Customer <strong>{selectedCustomer?.fullName}</strong> does not have an approved site survey.
                Surveys in "Scheduled", "In Progress", or "Submitted" status cannot be configured until an administrator certifies the inspection findings in Module M02.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  Choose Another Customer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Approved Site Survey"
                options={approvedSurveys.map((s) => ({
                  value: s.id,
                  label: `${s.surveyId} - ${s.siteName} (${s.siteLocation}) [Approved on ${s.scheduledDate}]`,
                }))}
                value={selectedSurveyId}
                onChange={(e) => handleSurveySelect(e.target.value)}
                placeholder="-- Select an Approved Survey --"
              />

              {selectedSurvey && selectedSurvey.feasibility && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Certified Survey Findings ({selectedSurvey.surveyId})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-400 block">Roof Type</span>
                      <span className="font-semibold capitalize">
                        {selectedSurvey.roofInfo?.roofType.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Available Area</span>
                      <span className="font-semibold">
                        {selectedSurvey.roofInfo?.availableAreaSqFt} sq. ft.
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Surveyor Recommended</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {selectedSurvey.feasibility.recommendedCapacityKw} kWp
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Approval Sign-off</span>
                      <span className="font-semibold text-slate-800">
                        {selectedSurvey.approval.approverName || 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2 mt-6 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedSurveyId}
              onClick={() => setCurrentStep(3)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Specs & Sizing
            </Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 3: System Type & Capacity ─────────────────────── */}
      {currentStep === 3 && (
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">
            Step 3: Define Solar System Specifications
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Specify the target capacity based on survey observations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Configuration Name"
                required
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
              />
            </div>

            <Select
              label="System Type"
              options={Object.entries(SYSTEM_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as SystemType)}
            />

            <Select
              label="Configured Capacity"
              options={Object.entries(CAPACITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              value={ratedCapacity}
              onChange={(e) => setRatedCapacity(e.target.value as CapacityOption)}
            />

            <Select
              label="Grid Phase"
              options={Object.entries(PHASE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              value={phaseType}
              onChange={(e) => setPhaseType(e.target.value as PhaseType)}
            />

            {/* Discrepancy Alert */}
            {isCapacityMismatched() && (
              <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Sizing Deviation Warning</span>
                </div>
                <p className="text-amber-700">
                  The surveyor recommended{' '}
                  <strong>{selectedSurvey?.feasibility?.recommendedCapacityKw} kW</strong> during the physical inspection, but you have selected <strong>{ratedCapacity}</strong>.
                  Please state technical justification below.
                </p>
                <Textarea
                  placeholder="Justify why sizing differs (e.g. Future EV charger expansion, high day load)..."
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Textarea
                label="Configuration Notes"
                placeholder="Specific roof layout notes, parapet cable entry..."
                value={configNotes}
                onChange={(e) => setConfigNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-6 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={isCapacityMismatched() && !discrepancyReason.trim()}
              onClick={() => setCurrentStep(4)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Select Template
            </Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 4: Select Template ────────────────────────────── */}
      {currentStep === 4 && (
        <Card>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Step 4: Select Predefined Template</h3>
              <p className="text-xs text-slate-500">
                Choose a pre-engineered design matching {CAPACITY_LABELS[ratedCapacity]} {SYSTEM_TYPE_LABELS[systemType]}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateId('');
                setComponents([]);
                setCurrentStep(5);
              }}
              className="text-xs font-semibold text-green-600 hover:underline"
            >
              Skip / Build Custom BOM
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {templates
              .filter((t) => t.systemType === systemType)
              .map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-600 bg-green-50/50 shadow-sm ring-2 ring-green-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-mono text-slate-400 block">{tpl.templateCode}</span>
                        <h4 className="text-sm font-bold text-slate-800">{tpl.templateName}</h4>
                      </div>
                      <Badge
                        label={CAPACITY_LABELS[tpl.ratedCapacity]}
                        className="bg-green-100 text-green-800 font-semibold"
                      />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tpl.description}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                      <span>{tpl.components.length} components included</span>
                      <span className="font-bold text-slate-800">
                        ₹{(tpl.estimatedTotalCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-between gap-2 mt-6 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedTemplateId && components.length === 0}
              onClick={() => setCurrentStep(5)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Customize Components
            </Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 5: Customize Components ───────────────────────── */}
      {currentStep === 5 && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Step 5: Review & Tailor Components</h3>
              <p className="text-xs text-slate-500">
                Adjust quantities specifically for this customer without modifying the original template.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={compToAddId}
                onChange={(e) => setCompToAddId(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg max-w-xs bg-white text-slate-700"
              >
                <option value="">-- Add Extra Item --</option>
                {catalogueComponents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({COMPONENT_CATEGORY_LABELS[c.category]})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="primary"
                disabled={!compToAddId}
                onClick={handleAddManualComponent}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add
              </Button>
            </div>
          </div>

          {components.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No components selected. Add items from the catalogue above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 w-28">Quantity</th>
                    <th className="py-2.5 px-3">Est. Unit Price</th>
                    <th className="py-2.5 px-3">Line Total</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {components.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.specification}</span>
                      </td>
                      <td className="py-2.5 px-3">{COMPONENT_CATEGORY_LABELS[item.category]}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-center"
                          />
                          <span className="text-slate-400 text-[11px]">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {item.estimatedUnitCost ? `₹${item.estimatedUnitCost.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {item.estimatedLineTotal ? `₹${item.estimatedLineTotal.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between gap-2 mt-6 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(4)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={components.length === 0}
              onClick={() => setCurrentStep(6)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Review Summary & BOM
            </Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 6: Summary & BOM Preview ──────────────────────── */}
      {currentStep === 6 && (
        <Card className="space-y-6">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">
              Step 6: Configuration Review & Proposed BOM
            </h3>
            <p className="text-xs text-slate-500">
              Verify customer details, technical specifications, and proposed Bill of Materials.
            </p>
          </div>

          {/* Dossier Header Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block">Customer</span>
              <span className="font-bold text-slate-800">{selectedCustomer?.fullName}</span>
              <span className="text-slate-400 block">{selectedCustomer?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Installation Site</span>
              <span className="font-medium text-slate-700">{selectedSurvey?.siteLocation}</span>
              <span className="text-slate-400 block">Survey: {selectedSurvey?.surveyId}</span>
            </div>
            <div>
              <span className="text-slate-400 block">System Design</span>
              <span className="font-bold text-green-700 text-sm">
                {CAPACITY_LABELS[ratedCapacity]} {SYSTEM_TYPE_LABELS[systemType]}
              </span>
              <span className="text-slate-500 block">{PHASE_TYPE_LABELS[phaseType]}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Estimated Materials</span>
              <span className="font-bold text-slate-800 text-base">₹{totalCost.toLocaleString()}</span>
              <span className="text-slate-400 block">{components.length} Line items</span>
            </div>
          </div>

          {/* Bill of Materials Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Proposed Bill of Materials (BOM)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Subject to final procurement verification
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Component Description</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3">Unit Price</th>
                  <th className="py-2 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {components.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-2 px-3">{COMPONENT_CATEGORY_LABELS[c.category]}</td>
                    <td className="py-2 px-3 text-center font-bold">
                      {c.quantity} {c.unit}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {c.estimatedUnitCost ? `₹${c.estimatedUnitCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {c.estimatedLineTotal ? `₹${c.estimatedLineTotal.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(5)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => handleFinalSubmit(true)}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFinalSubmit(false)}
                isLoading={isSubmitting}
              >
                Save Configuration (Ready for Quotation)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

