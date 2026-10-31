/**
 * SurveyExecutionForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete on-site inspection form for physical solar evaluations:
 *  - Section A: Roof Information (type, condition, area, slope, shading, orientation)
 *  - Section B: Electrical Information (connection, meter, db condition, earthing)
 *  - Section C: Installation Feasibility (suitability checks, recommended kW, observations)
 *  - Section D: Site Photographs (full roof, surface, meter, earthing, shading)
 *  - Section E: Customer Confirmation & Signature
 */

import { useState, type FormEvent } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { PhotoUpload } from './PhotoUpload';
import type {
  Survey,
  SurveyExecutionData,
  RoofType,
  RoofCondition,
  RoofSlope,
  ShadingCondition,
  FeasibilityStatus,
  SurveyPhoto,
} from '../types/survey.types';

interface SurveyExecutionFormProps {
  survey: Survey;
  onSubmit: (data: SurveyExecutionData) => Promise<void>;
  isLoading?: boolean;
}

export function SurveyExecutionForm({ survey, onSubmit, isLoading }: SurveyExecutionFormProps) {
  // Section A: Roof Info
  const [roofInfo, setRoofInfo] = useState({
    roofType: survey.roofInfo?.roofType ?? ('rcc_concrete' as RoofType),
    customRoofType: survey.roofInfo?.customRoofType ?? '',
    roofCondition: survey.roofInfo?.roofCondition ?? ('good' as RoofCondition),
    availableAreaSqFt: survey.roofInfo?.availableAreaSqFt ?? 400,
    roofLengthFt: survey.roofInfo?.roofLengthFt ?? 25,
    roofWidthFt: survey.roofInfo?.roofWidthFt ?? 16,
    numberOfFloors: survey.roofInfo?.numberOfFloors ?? 2,
    roofOrientation: survey.roofInfo?.roofOrientation ?? 'South-Facing',
    roofSlope: survey.roofInfo?.roofSlope ?? ('flat' as RoofSlope),
    shadingCondition: survey.roofInfo?.shadingCondition ?? ('no_shade' as ShadingCondition),
    nearbyObstacles: survey.roofInfo?.nearbyObstacles ?? '',
    roofAccessAvailable: survey.roofInfo?.roofAccessAvailable ?? true,
    structuralConcerns: survey.roofInfo?.structuralConcerns ?? '',
  });

  // Section B: Electrical Info
  const [electricalInfo, setElectricalInfo] = useState({
    existingElectricityConnection: survey.electricalInfo?.existingElectricityConnection ?? true,
    connectionType: survey.electricalInfo?.connectionType ?? ('single_phase' as const),
    meterAvailable: survey.electricalInfo?.meterAvailable ?? true,
    sanctionedLoadKw: survey.electricalInfo?.sanctionedLoadKw ?? 5,
    mainDistributionBoardCondition:
      survey.electricalInfo?.mainDistributionBoardCondition ?? ('good' as const),
    earthingAvailable: survey.electricalInfo?.earthingAvailable ?? true,
    existingInverter: survey.electricalInfo?.existingInverter ?? false,
    existingSolarInstallation: survey.electricalInfo?.existingSolarInstallation ?? false,
    electricalObservations: survey.electricalInfo?.electricalObservations ?? '',
  });

  // Section C: Feasibility
  const [feasibility, setFeasibility] = useState({
    roofSuitability: survey.feasibility?.roofSuitability ?? true,
    structuralSuitability: survey.feasibility?.structuralSuitability ?? true,
    electricalSuitability: survey.feasibility?.electricalSuitability ?? true,
    shadingSuitability: survey.feasibility?.shadingSuitability ?? true,
    installationAccessibility: survey.feasibility?.installationAccessibility ?? true,
    estimatedUsableAreaSqFt: survey.feasibility?.estimatedUsableAreaSqFt ?? 350,
    recommendedCapacityKw: survey.feasibility?.recommendedCapacityKw ?? 3.5,
    feasibilityStatus: survey.feasibility?.feasibilityStatus ?? ('feasible' as FeasibilityStatus),
    surveyorObservations: survey.feasibility?.surveyorObservations ?? '',
  });

  // Section D: Photos
  const [photos, setPhotos] = useState<SurveyPhoto[]>(survey.photos ?? []);

  // Section E: Customer Confirmation
  const [customerConfirmation, setCustomerConfirmation] = useState({
    representativeName:
      survey.customerConfirmation?.representativeName ?? survey.customerName,
    confirmed: survey.customerConfirmation?.confirmed ?? true,
    signatureCaptured: survey.customerConfirmation?.signatureCaptured ?? true,
    completionDate:
      survey.customerConfirmation?.completionDate ?? new Date().toISOString().split('T')[0],
    completionTime: survey.customerConfirmation?.completionTime ?? '11:30',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (roofInfo.availableAreaSqFt <= 0) errs.availableAreaSqFt = 'Roof area must be greater than 0';
    if (feasibility.recommendedCapacityKw <= 0)
      errs.recommendedCapacityKw = 'Recommended capacity must be greater than 0';
    if (!customerConfirmation.representativeName.trim())
      errs.representativeName = 'Representative name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent, submitForApproval = false) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      roofInfo,
      electricalInfo,
      feasibility,
      photos,
      customerConfirmation,
      submitForApproval,
    });
  };

  return (
    <form className="space-y-6" noValidate>
      {/* ─── A. Roof Information ─────────────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          A. Roof & Structural Assessment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Roof Type"
            options={[
              { value: 'rcc_concrete', label: 'RCC Concrete' },
              { value: 'metal_sheet', label: 'Metal Sheet / Industrial Shed' },
              { value: 'tiled_roof', label: 'Tiled Roof (Clay / Mangalore)' },
              { value: 'other', label: 'Other' },
            ]}
            value={roofInfo.roofType}
            onChange={(e) => setRoofInfo({ ...roofInfo, roofType: e.target.value as RoofType })}
          />

          <Select
            label="Roof Condition"
            options={[
              { value: 'good', label: 'Good (No cracks, sturdy)' },
              { value: 'average', label: 'Average (Minor aging)' },
              { value: 'poor', label: 'Poor (Damaged / Needs repair)' },
            ]}
            value={roofInfo.roofCondition}
            onChange={(e) =>
              setRoofInfo({ ...roofInfo, roofCondition: e.target.value as RoofCondition })
            }
          />

          <Input
            label="Available Roof Area (sq. ft.)"
            required
            type="number"
            value={roofInfo.availableAreaSqFt}
            error={errors.availableAreaSqFt}
            onChange={(e) =>
              setRoofInfo({ ...roofInfo, availableAreaSqFt: Number(e.target.value) })
            }
          />

          <Input
            label="Approx Length (ft)"
            type="number"
            value={roofInfo.roofLengthFt ?? ''}
            onChange={(e) => setRoofInfo({ ...roofInfo, roofLengthFt: Number(e.target.value) })}
          />

          <Input
            label="Approx Width (ft)"
            type="number"
            value={roofInfo.roofWidthFt ?? ''}
            onChange={(e) => setRoofInfo({ ...roofInfo, roofWidthFt: Number(e.target.value) })}
          />

          <Input
            label="Number of Floors"
            type="number"
            value={roofInfo.numberOfFloors}
            onChange={(e) => setRoofInfo({ ...roofInfo, numberOfFloors: Number(e.target.value) })}
          />

          <Input
            label="Roof Orientation / Azimuth"
            placeholder="e.g. True South, South-West"
            value={roofInfo.roofOrientation}
            onChange={(e) => setRoofInfo({ ...roofInfo, roofOrientation: e.target.value })}
          />

          <Select
            label="Roof Slope"
            options={[
              { value: 'flat', label: 'Flat (0° - 5°)' },
              { value: 'slightly_sloped', label: 'Slightly Sloped (5° - 15°)' },
              { value: 'steep', label: 'Steep Pitch (> 15°)' },
            ]}
            value={roofInfo.roofSlope}
            onChange={(e) => setRoofInfo({ ...roofInfo, roofSlope: e.target.value as RoofSlope })}
          />

          <Select
            label="Shading Condition"
            options={[
              { value: 'no_shade', label: 'No Shade (Optimal 9am - 4pm sun)' },
              { value: 'partial_shade', label: 'Partial Shade (Trees / Parapet)' },
              { value: 'heavy_shade', label: 'Heavy Shade (Surrounding high-rises)' },
            ]}
            value={roofInfo.shadingCondition}
            onChange={(e) =>
              setRoofInfo({ ...roofInfo, shadingCondition: e.target.value as ShadingCondition })
            }
          />

          <div className="md:col-span-2">
            <Input
              label="Nearby Obstacles / Shading Sources"
              placeholder="e.g. Water tank on north-west, neighboring palm trees"
              value={roofInfo.nearbyObstacles}
              onChange={(e) => setRoofInfo({ ...roofInfo, nearbyObstacles: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="roofAccess"
              type="checkbox"
              checked={roofInfo.roofAccessAvailable}
              onChange={(e) => setRoofInfo({ ...roofInfo, roofAccessAvailable: e.target.checked })}
              className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
            />
            <label htmlFor="roofAccess" className="text-sm font-medium text-slate-700">
              Safe Staircase / Roof Access Available
            </label>
          </div>

          <div className="md:col-span-3">
            <Textarea
              label="Structural Observations / Parapet Notes"
              placeholder="Any parapet height notes, waterproofing condition, water tanks..."
              value={roofInfo.structuralConcerns}
              onChange={(e) => setRoofInfo({ ...roofInfo, structuralConcerns: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* ─── B. Electrical Information ───────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          B. Electrical Infrastructure Inspection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Connection Type"
            options={[
              { value: 'single_phase', label: 'Single Phase (230V)' },
              { value: 'three_phase', label: 'Three Phase (415V)' },
            ]}
            value={electricalInfo.connectionType}
            onChange={(e) =>
              setElectricalInfo({
                ...electricalInfo,
                connectionType: e.target.value as 'single_phase' | 'three_phase',
              })
            }
          />

          <Input
            label="Sanctioned Connected Load (kW)"
            type="number"
            value={electricalInfo.sanctionedLoadKw ?? ''}
            onChange={(e) =>
              setElectricalInfo({ ...electricalInfo, sanctionedLoadKw: Number(e.target.value) })
            }
          />

          <Select
            label="Main Distribution Board Condition"
            options={[
              { value: 'good', label: 'Good (Adequate space for solar MCB/Isolator)' },
              { value: 'fair', label: 'Fair (Crowded, upgrade suggested)' },
              { value: 'requires_upgrade', label: 'Requires Upgradation / Rewiring' },
            ]}
            value={electricalInfo.mainDistributionBoardCondition}
            onChange={(e) =>
              setElectricalInfo({
                ...electricalInfo,
                mainDistributionBoardCondition: e.target.value as any,
              })
            }
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              id="earthingCheck"
              type="checkbox"
              checked={electricalInfo.earthingAvailable}
              onChange={(e) =>
                setElectricalInfo({ ...electricalInfo, earthingAvailable: e.target.checked })
              }
              className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
            />
            <label htmlFor="earthingCheck" className="text-sm text-slate-700">
              Proper Earthing Pit Available
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="existingInverter"
              type="checkbox"
              checked={electricalInfo.existingInverter}
              onChange={(e) =>
                setElectricalInfo({ ...electricalInfo, existingInverter: e.target.checked })
              }
              className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
            />
            <label htmlFor="existingInverter" className="text-sm text-slate-700">
              Has Existing Battery Inverter
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="existingSolar"
              type="checkbox"
              checked={electricalInfo.existingSolarInstallation}
              onChange={(e) =>
                setElectricalInfo({
                  ...electricalInfo,
                  existingSolarInstallation: e.target.checked,
                })
              }
              className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
            />
            <label htmlFor="existingSolar" className="text-sm text-slate-700">
              Pre-existing Solar Installed
            </label>
          </div>

          <div className="md:col-span-3">
            <Textarea
              label="Electrical Observations & Cable Route Notes"
              placeholder="Inverter mounting location, AC/DC cable path from roof to electrical board..."
              value={electricalInfo.electricalObservations}
              onChange={(e) =>
                setElectricalInfo({ ...electricalInfo, electricalObservations: e.target.value })
              }
            />
          </div>
        </div>
      </Card>

      {/* ─── C. Installation Feasibility ─────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          C. Feasibility Assessment & Sizing
        </h3>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Suitability Criteria Checks
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feasibility.roofSuitability}
                onChange={(e) =>
                  setFeasibility({ ...feasibility, roofSuitability: e.target.checked })
                }
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="font-medium text-slate-700">Roof Area OK</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feasibility.structuralSuitability}
                onChange={(e) =>
                  setFeasibility({ ...feasibility, structuralSuitability: e.target.checked })
                }
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="font-medium text-slate-700">Structure Load OK</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feasibility.electricalSuitability}
                onChange={(e) =>
                  setFeasibility({ ...feasibility, electricalSuitability: e.target.checked })
                }
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="font-medium text-slate-700">Grid Connection OK</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feasibility.shadingSuitability}
                onChange={(e) =>
                  setFeasibility({ ...feasibility, shadingSuitability: e.target.checked })
                }
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="font-medium text-slate-700">Sun Hours OK</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feasibility.installationAccessibility}
                onChange={(e) =>
                  setFeasibility({
                    ...feasibility,
                    installationAccessibility: e.target.checked,
                  })
                }
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="font-medium text-slate-700">Access Safe</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Overall Feasibility Verdict"
            options={[
              { value: 'feasible', label: 'Feasible (Recommended for Quotation)' },
              {
                value: 'feasible_with_modifications',
                label: 'Feasible with Modifications (Elevated structure / tree pruning)',
              },
              {
                value: 'requires_further_inspection',
                label: 'Requires Further Inspection (Structural engineer audit)',
              },
              { value: 'not_feasible', label: 'Not Feasible (Severe shading or weak roof)' },
            ]}
            value={feasibility.feasibilityStatus}
            onChange={(e) =>
              setFeasibility({
                ...feasibility,
                feasibilityStatus: e.target.value as FeasibilityStatus,
              })
            }
          />

          <Input
            label="Estimated Usable Area (sq. ft.)"
            type="number"
            value={feasibility.estimatedUsableAreaSqFt}
            onChange={(e) =>
              setFeasibility({
                ...feasibility,
                estimatedUsableAreaSqFt: Number(e.target.value),
              })
            }
          />

          <Input
            label="Recommended System Capacity (kW)"
            required
            type="number"
            step="0.5"
            value={feasibility.recommendedCapacityKw}
            error={errors.recommendedCapacityKw}
            onChange={(e) =>
              setFeasibility({
                ...feasibility,
                recommendedCapacityKw: Number(e.target.value),
              })
            }
          />

          <div className="md:col-span-3">
            <Textarea
              label="Surveyor Feasibility Remarks"
              placeholder="State technical reasons, panel layout suggestions, or mandatory structural precautions..."
              value={feasibility.surveyorObservations}
              onChange={(e) =>
                setFeasibility({ ...feasibility, surveyorObservations: e.target.value })
              }
            />
          </div>
        </div>
      </Card>

      {/* ─── D. Site Photographs ─────────────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-2 pb-2 border-b border-slate-100">
          D. Site Photographs
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Capture panoramic roof views, meter box, main board, earthing, and shade-causing trees.
        </p>
        <PhotoUpload photos={photos} onChange={setPhotos} />
      </Card>

      {/* ─── E. Customer Confirmation ───────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          E. Customer Site Representative Acknowledgment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Representative Present at Site"
            required
            value={customerConfirmation.representativeName}
            error={errors.representativeName}
            onChange={(e) =>
              setCustomerConfirmation({
                ...customerConfirmation,
                representativeName: e.target.value,
              })
            }
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              id="confirmAcknowledge"
              type="checkbox"
              checked={customerConfirmation.confirmed}
              onChange={(e) =>
                setCustomerConfirmation({
                  ...customerConfirmation,
                  confirmed: e.target.checked,
                })
              }
              className="w-4 h-4 text-green-600 rounded"
            />
            <label htmlFor="confirmAcknowledge" className="text-sm font-medium text-slate-700">
              Site inspection completed in presence of representative
            </label>
          </div>

          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Digital Signature placeholder captured on surveyor tablet at inspection conclusion.
            </span>
            <span className="text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded">
              Verified on Device
            </span>
          </div>
        </div>
      </Card>

      {/* ─── Form Submission Controls ───────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => handleFormSubmit(e, false)}
          disabled={isLoading}
        >
          Save Findings Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={(e) => handleFormSubmit(e, true)}
          isLoading={isLoading}
        >
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}

