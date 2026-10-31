/**
 * InstallationWizard.tsx
 * ─────────────────────────────────────────────────────────────
 * 5-Step Work Order Creation Wizard.
 * Fully integrates with:
 *   - M01 Customer & CRM (Existing customers)
 *   - M02 Site Survey (Approved surveys only)
 *   - M03 Solar Configuration (Matching system templates & BOM)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  ClipboardCheck,
  Sun,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Check,
} from 'lucide-react';
import type {
  InstallationFormData,
  InstallationType,
  InstallationPriority,
} from '../types/installation.types';
import type { CustomerSummary } from '../../crm/types/customer.types';
import type { Survey } from '../../surveys/types/survey.types';
import type { SolarConfiguration } from '../../configurations/types/configuration.types';
import { customerService } from '../../crm/services/customerService';
import { surveyService } from '../../surveys/services/surveyService';
import { configurationService } from '../../configurations/services/configurationService';
import { installationService } from '../services/installationService';
import { Button } from '../../../components/ui/Button';

export function InstallationWizard() {
  const navigate = useNavigate();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External data from M01, M02, M03
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [approvedSurveys, setApprovedSurveys] = useState<Survey[]>([]);
  const [configurations, setConfigurations] = useState<SolarConfiguration[]>([]);

  // Selected entities
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedConfiguration, setSelectedConfiguration] = useState<SolarConfiguration | null>(null);

  // Form Details (Step 4)
  const [title, setTitle] = useState('');
  const [type, setType] = useState<InstallationType>('residential');
  const [priority, setPriority] = useState<InstallationPriority>('medium');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [installationManager, setInstallationManager] = useState('Kavita Menon');
  const [assignedTeam, setAssignedTeam] = useState('Alpha Solar Crew');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Validation errors
  const [stepError, setStepError] = useState('');

  // Load prerequisites
  useEffect(() => {
    async function loadPrerequisites() {
      try {
        setIsLoadingData(true);
        const [custRes, srvRes, cfgRes] = await Promise.all([
          customerService.list(),
          surveyService.list({ status: 'approved' }),
          configurationService.list(),
        ]);
        setCustomers(custRes.data);
        setApprovedSurveys(srvRes.data);
        setConfigurations(cfgRes.data);
      } catch (err) {
        console.error('Failed to load wizard prerequisite data', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadPrerequisites();
  }, []);

  // When customer changes, clear or preselect matching surveys
  const handleCustomerSelect = (cust: CustomerSummary) => {
    setSelectedCustomer(cust);
    setContactPerson(cust.fullName);
    setContactNumber(cust.phone);

    // Filter surveys for this customer
    const matchingSurveys = approvedSurveys.filter(
      (s) => s.customerId === cust.id || s.customerName.toLowerCase() === cust.fullName.toLowerCase()
    );
    if (matchingSurveys.length > 0) {
      setSelectedSurvey(matchingSurveys[0]);
    } else {
      setSelectedSurvey(null);
    }
    setSelectedConfiguration(null);
  };

  // Filter approved surveys for selected customer
  const filteredSurveys = selectedCustomer
    ? approvedSurveys.filter(
        (s) =>
          s.customerId === selectedCustomer.id ||
          s.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase()
      )
    : approvedSurveys;

  // Filter configurations for selected customer and survey
  const filteredConfigs = selectedCustomer
    ? configurations.filter(
        (c) =>
          c.customerId === selectedCustomer.id ||
          c.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase() ||
          (selectedSurvey && (c.surveyId === selectedSurvey.id || c.surveyRef === selectedSurvey.surveyId))
      )
    : configurations;

  // Auto-generate title when configuration is picked
  useEffect(() => {
    if (selectedCustomer && selectedConfiguration) {
      const cap = selectedConfiguration.customCapacity || `${selectedConfiguration.ratedCapacity} kW`;
      setTitle(`${selectedCustomer.fullName} ${cap} Solar Rooftop Installation`);
    }
  }, [selectedCustomer, selectedConfiguration]);

  // Step Navigators with Validation
  const handleNextStep = () => {
    setStepError('');
    if (currentStep === 1) {
      if (!selectedCustomer) {
        setStepError('Please select a customer from M01 to proceed.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedSurvey) {
        setStepError('Please select an approved site survey from M02 to proceed.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedConfiguration) {
        setStepError('Please select an approved solar system configuration from M03 to proceed.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!title.trim()) {
        setStepError('Installation work order title is required.');
        return;
      }
      if (!plannedStartDate || !plannedEndDate) {
        setStepError('Both planned start date and planned end date are required.');
        return;
      }
      if (plannedStartDate > plannedEndDate) {
        setStepError('Planned end date must be after planned start date.');
        return;
      }
      if (!contactPerson.trim() || !contactNumber.trim()) {
        setStepError('Site contact person and contact phone number are required.');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleCreateInstallation = async () => {
    if (!selectedCustomer || !selectedSurvey || !selectedConfiguration) return;

    try {
      setIsSubmitting(true);
      const cap = selectedConfiguration.customCapacity || `${selectedConfiguration.ratedCapacity} kW`;

      const formData: InstallationFormData = {
        title,
        type,
        priority,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.fullName,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email,
        siteAddress: selectedSurvey.siteLocation || selectedCustomer.city || 'Site Address',
        siteCity: selectedCustomer.city || 'Bengaluru',
        siteState: 'Karnataka',
        sitePincode: '560001',

        surveyId: selectedSurvey.id,
        surveyRef: selectedSurvey.surveyId,
        configurationId: selectedConfiguration.id,
        configurationRef: selectedConfiguration.configurationId,
        configurationName: selectedConfiguration.configurationName,
        systemType: selectedConfiguration.systemType,
        systemCapacity: cap,

        plannedStartDate,
        plannedEndDate,
        installationManager,
        assignedTeam,

        contactPerson,
        contactNumber,
        specialInstructions,
      };

      const created = await installationService.create(formData, 'Installation Manager');
      navigate(`/installations/${created.id}`);
    } catch (err) {
      console.error('Failed to create installation order', err);
      setStepError('Failed to save work order. Please verify input data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Wizard Header and Step Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Create Installation Work Order
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Step-by-step creation linking Customer, Approved Survey, and Solar BOM
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-between max-w-2xl mt-5">
          {[
            { step: 1, label: 'Customer & Site', icon: User },
            { step: 2, label: 'Approved Survey', icon: ClipboardCheck },
            { step: 3, label: 'Configuration & BOM', icon: Sun },
            { step: 4, label: 'Work Order Details', icon: Calendar },
            { step: 5, label: 'Review & Create', icon: Check },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="flex-1 flex flex-col items-center relative">
                {item.step > 1 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      currentStep >= item.step ? 'bg-green-600' : 'bg-slate-300'
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 border-2 transition-all ${
                    isDone
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                      ? 'bg-white border-green-600 text-green-700 ring-4 ring-green-100 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 text-center hidden sm:block ${
                    isCurrent ? 'text-green-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation alert banner */}
      {stepError && (
        <div className="m-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* STEP CONTENT BODY */}
      <div className="p-6">
        {isLoadingData ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading prerequisite records from M01, M02 and M03...
          </div>
        ) : (
          <>
            {/* STEP 1: CUSTOMER AND SITE */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Select Customer (from M01 CRM)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {customers.length} registered customers
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                  {customers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleCustomerSelect(cust)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-600 bg-green-50/50 ring-2 ring-green-600/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-900">
                              {cust.fullName}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {cust.customerId} • {cust.phone}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.city || 'Bengaluru, Karnataka'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: APPROVED SURVEY */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-green-600" />
                    <span>Select Approved Site Survey (from M02)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Customer: <strong>{selectedCustomer?.fullName}</strong>
                  </span>
                </div>

                {filteredSurveys.length === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-amber-900">
                      No Approved Surveys Found
                    </h4>
                    <p className="text-xs text-amber-800 max-w-md mx-auto">
                      An installation work order requires a technical feasibility survey approved by an authorized Site Survey Manager in M02.
                    </p>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/surveys/new')}
                      >
                        Create Site Survey in M02
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto p-1">
                    {filteredSurveys.map((srv) => {
                      const isSelected = selectedSurvey?.id === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedSurvey(srv)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-600 bg-green-50/50 ring-2 ring-green-600/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">
                                  {srv.surveyId}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">
                                  {srv.systemType.replace('_', ' ')} • {srv.requestedCapacity || '3kw'}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                                  APPROVED
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{srv.siteLocation}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <div>Surveyor: <strong>{srv.assignedSurveyorName || 'Vikram Singh'}</strong></div>
                            <div>Date: <strong>{srv.scheduledDate || '2026-10-18'}</strong></div>
                            <div>Roof: <strong>{srv.roofInfo?.roofType?.replace('_', ' ') || 'RCC Concrete'}</strong></div>
                            <div>Area: <strong>{srv.roofInfo?.availableAreaSqFt || 600} sq.ft</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SOLAR CONFIGURATION & BOM */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-green-600" />
                    <span>Select Solar Configuration & BOM (from M03)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Linked to Survey: <strong>{selectedSurvey?.surveyId}</strong>
                  </span>
                </div>

                {filteredConfigs.length === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-amber-900">
                      No Solar Configurations Available
                    </h4>
                    <p className="text-xs text-amber-800 max-w-md mx-auto">
                      Please configure a proposed Solar System and generate its Bill of Materials (BOM) in Module M03 first.
                    </p>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/configurations/new')}
                      >
                        Create Configuration in M03
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                    {filteredConfigs.map((cfg) => {
                      const isSelected = selectedConfiguration?.id === cfg.id;
                      const cap = cfg.customCapacity || `${cfg.ratedCapacity} kW`;
                      return (
                        <div
                          key={cfg.id}
                          onClick={() => setSelectedConfiguration(cfg)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-600 bg-green-50/50 ring-2 ring-green-600/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">
                                  {cfg.configurationId}
                                </span>
                                <h4 className="text-sm font-semibold text-slate-900">
                                  {cfg.configurationName}
                                </h4>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                System: <strong>{cap}</strong> • Type: <strong className="capitalize">{cfg.systemType.replace('_', ' ')}</strong> • Phase: <strong>{cfg.phaseType?.replace('_', ' ')}</strong>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            )}
                          </div>

                          {/* BOM Summary preview */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                BOM: <strong>{cfg.components?.length || 0} component items</strong>
                              </span>
                            </div>
                            <div className="font-semibold text-slate-800">
                              Est. Value: ₹{(cfg.estimatedTotalCost || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: INSTALLATION DETAILS */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Step 4: Installation Work Order Details & Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Specify installation scope, operational dates, site contact, and team assignment
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Installation Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. Rajesh Kumar 3kW Rooftop Solar Installation"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Installation Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as InstallationType)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    >
                      <option value="residential">Residential Rooftop</option>
                      <option value="commercial">Commercial / Industrial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Priority Level *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as InstallationPriority)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Planned Start Date *
                    </label>
                    <input
                      type="date"
                      value={plannedStartDate}
                      onChange={(e) => setPlannedStartDate(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Planned Completion Date *
                    </label>
                    <input
                      type="date"
                      value={plannedEndDate}
                      onChange={(e) => setPlannedEndDate(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Installation Manager *
                    </label>
                    <input
                      type="text"
                      value={installationManager}
                      onChange={(e) => setInstallationManager(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assigned Crew Team (M06)
                    </label>
                    <select
                      value={assignedTeam}
                      onChange={(e) => setAssignedTeam(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    >
                      <option value="Alpha Solar Crew">Alpha Solar Crew (Bengaluru Central)</option>
                      <option value="Beta Solar Crew">Beta Solar Crew (Whitefield / East)</option>
                      <option value="Industrial Projects Division">Industrial Projects Division</option>
                      <option value="Hyderabad Solar Crew 1">Hyderabad Solar Crew 1</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Site Contact Person *
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Site Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      placeholder="+91 98450 12345"
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Special Site Instructions / Access Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. Gate code, ladder clearance, rooftop water tank location, customer availability hours..."
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW AND CREATE */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Step 5: Review Installation Work Order
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify all parameters before creating the official work order
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Customer & Site Card */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <User className="w-3.5 h-3.5 text-green-600" />
                      <span>Customer & Installation Site</span>
                    </div>
                    <div><strong>Customer:</strong> {selectedCustomer?.fullName}</div>
                    <div><strong>Phone:</strong> {selectedCustomer?.phone}</div>
                    <div><strong>Email:</strong> {selectedCustomer?.email || 'N/A'}</div>
                    <div><strong>Site Location:</strong> {selectedSurvey?.siteLocation || selectedCustomer?.city}</div>
                  </div>

                  {/* Survey & System Specs Card */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-green-600" />
                      <span>Survey & Technical System</span>
                    </div>
                    <div><strong>Approved Survey:</strong> {selectedSurvey?.surveyId}</div>
                    <div><strong>Configuration:</strong> {selectedConfiguration?.configurationId} - {selectedConfiguration?.configurationName}</div>
                    <div><strong>System Type:</strong> {selectedConfiguration?.systemType.replace('_', ' ')}</div>
                    <div><strong>System Capacity:</strong> {selectedConfiguration?.customCapacity || `${selectedConfiguration?.ratedCapacity} kW`}</div>
                  </div>

                  {/* Schedule & Team Card */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-green-600" />
                      <span>Schedule & Execution</span>
                    </div>
                    <div><strong>Planned Dates:</strong> {plannedStartDate} to {plannedEndDate}</div>
                    <div><strong>Priority:</strong> <span className="uppercase font-semibold text-amber-700">{priority}</span></div>
                    <div><strong>Assigned Team:</strong> {assignedTeam}</div>
                    <div><strong>Installation Manager:</strong> {installationManager}</div>
                  </div>

                  {/* Contact & Instructions Card */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green-600" />
                      <span>Site Contact & Access</span>
                    </div>
                    <div><strong>Contact Person:</strong> {contactPerson} ({contactNumber})</div>
                    <div><strong>Special Instructions:</strong> {specialInstructions || 'None recorded'}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Wizard Action Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={currentStep === 1 ? () => navigate('/installations') : handlePrevStep}
          disabled={isSubmitting}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < 5 ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleNextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              size="md"
              variant="primary"
              onClick={handleCreateInstallation}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Create Installation Work Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
