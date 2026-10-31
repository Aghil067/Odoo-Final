/**
 * TechnicianForm.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive form for registering or updating technician profiles.
 * Structured into 4 distinct sections: Personal, Employment, Skills, and Emergency Contact.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  Wrench,
  AlertCircle,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type {
  Technician,
  TechnicianFormData,
  TechnicianSkill,
  EmploymentType,
  EmploymentStatus,
} from '../types/technician.types';
import { TECHNICIAN_SKILL_LABELS } from '../types/technician.types';
import type { TechnicianTeam } from '../types/team.types';
import { Button } from '../../../components/ui/Button';

interface TechnicianFormProps {
  initialData?: Technician;
  teams: TechnicianTeam[];
  onSubmit: (data: TechnicianFormData) => Promise<void>;
  isEditMode?: boolean;
}

export function TechnicianForm({
  initialData,
  teams,
  onSubmit,
  isEditMode = false,
}: TechnicianFormProps) {
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(initialData?.alternatePhone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(initialData?.profilePhotoUrl || '');

  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || 'Bengaluru');
  const [state, setState] = useState(initialData?.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(initialData?.pinCode || '560001');

  const [employeeRefId, setEmployeeRefId] = useState(initialData?.employeeRefId || '');
  const [joiningDate, setJoiningDate] = useState(
    initialData?.joiningDate || new Date().toISOString().split('T')[0]
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialData?.employmentType || 'full_time'
  );
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(
    initialData?.employmentStatus || 'active'
  );
  const [teamId, setTeamId] = useState(initialData?.teamId || '');
  const [supervisorName, setSupervisorName] = useState(
    initialData?.supervisorName || 'Kavita Menon'
  );

  const [skills, setSkills] = useState<TechnicianSkill[]>(initialData?.skills || ['solar_panel_installation']);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    initialData?.qualification.yearsOfExperience || 3
  );
  const [certificationsText, setCertificationsText] = useState(
    initialData?.qualification.certifications.join(', ') || ''
  );
  const [qualificationDegree, setQualificationDegree] = useState(
    initialData?.qualification.qualification || ''
  );
  const [trainingDetails, setTrainingDetails] = useState(
    initialData?.qualification.trainingDetails || ''
  );
  const [skillRemarks, setSkillRemarks] = useState(
    initialData?.qualification.skillRemarks || ''
  );

  const [emergencyContactName, setEmergencyContactName] = useState(
    initialData?.emergencyContact.name || ''
  );
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(
    initialData?.emergencyContact.relationship || 'Spouse'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialData?.emergencyContact.phone || ''
  );

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle skills checkbox
  const toggleSkill = (skill: TechnicianSkill) => {
    if (skills.includes(skill)) {
      if (skills.length === 1) {
        setFormError('At least one technical skill must be selected.');
        return;
      }
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
      setFormError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Technician full name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Contact phone number is required.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (skills.length === 0) {
      setFormError('Select at least one technical qualification skill.');
      return;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setFormError('Emergency contact name and phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        fullName,
        phone,
        alternatePhone: alternatePhone.trim() || undefined,
        email,
        profilePhotoUrl: profilePhotoUrl.trim() || undefined,
        address: address.trim() || undefined,
        city,
        state,
        pinCode,
        employeeRefId: employeeRefId.trim() || undefined,
        joiningDate,
        employmentType,
        employmentStatus,
        teamId: teamId || undefined,
        supervisorName,
        skills,
        yearsOfExperience,
        certificationsText,
        qualificationDegree,
        trainingDetails,
        skillRemarks,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
      });
    } catch (err: any) {
      console.error('Failed to save technician profile', err);
      setFormError(err.message || 'Failed to save technician record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner & Error Alert */}
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION A: Personal Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            A. Personal & Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Ramesh Patel"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 94480 33441"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Alternate Phone Number
            </label>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="+91 98450 11223"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Official Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ramesh.patel@sunpowersolutions.in"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              State & PIN Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-2/3 border border-slate-300 rounded-md p-2"
              />
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-1/3 border border-slate-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Street/Area details..."
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Profile Photo URL (Optional)
            </label>
            <input
              type="url"
              value={profilePhotoUrl}
              onChange={(e) => setProfilePhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-300 rounded-md p-2 text-slate-600 font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* SECTION B: Employment Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Briefcase className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            B. Employment & Team Structure
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Employee Reference ID
            </label>
            <input
              type="text"
              value={employeeRefId}
              onChange={(e) => setEmployeeRefId(e.target.value)}
              placeholder="e.g. EMP-SOL-0120"
              className="w-full border border-slate-300 rounded-md p-2 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Date of Joining *
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md p-2 bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Employment Type *
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full border border-slate-300 rounded-md p-2 bg-white"
            >
              <option value="full_time">Full-time Regular</option>
              <option value="part_time">Part-time Staff</option>
              <option value="contract">Third-Party Contract</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Employment Status *
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
              className="w-full border border-slate-300 rounded-md p-2 bg-white"
            >
              <option value="active">Active Staff</option>
              <option value="on_leave">On Extended Leave</option>
              <option value="inactive">Inactive / Resigned</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assigned Field Crew Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 bg-white"
            >
              <option value="">No Team Assigned (Floater)</option>
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Reporting Supervisor / Manager *
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>
        </div>
      </div>

      {/* SECTION C: Skills and Qualifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Wrench className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            C. Technical Skills & Qualifications
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Solar Equipment & Installation Skills (Select All That Apply) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(Object.keys(TECHNICIAN_SKILL_LABELS) as TechnicianSkill[]).map((sk) => {
              const isChecked = skills.includes(sk);
              return (
                <div
                  key={sk}
                  onClick={() => toggleSkill(sk)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isChecked
                      ? 'border-green-600 bg-green-50 text-green-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <span className="truncate">{TECHNICIAN_SKILL_LABELS[sk]}</span>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 ml-1" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Years of Experience *
            </label>
            <input
              type="number"
              min={0}
              max={40}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
              required
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Highest Educational / ITI Qualification
            </label>
            <input
              type="text"
              value={qualificationDegree}
              onChange={(e) => setQualificationDegree(e.target.value)}
              placeholder="e.g. Diploma in Electrical Engineering, ITI Wireman"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Certifications (Comma-separated)
            </label>
            <input
              type="text"
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              placeholder="e.g. SCGJ Rooftop Installer, Wireman B License"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">
              Specific OEM Training Details
            </label>
            <input
              type="text"
              value={trainingDetails}
              onChange={(e) => setTrainingDetails(e.target.value)}
              placeholder="e.g. Growatt Inverter Factory Trained, LiFePO4 High Voltage Safety 2025"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-medium text-slate-700 mb-1">
              Skill & Evaluation Remarks
            </label>
            <input
              type="text"
              value={skillRemarks}
              onChange={(e) => setSkillRemarks(e.target.value)}
              placeholder="e.g. Master of microinverters, fast rigging capabilities"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>
        </div>
      </div>

      {/* SECTION D: Emergency Contact */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            D. Emergency Contact Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Contact Person Name *
            </label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              required
              placeholder="e.g. Sunita Patel"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Relationship *
            </label>
            <input
              type="text"
              value={emergencyContactRelationship}
              onChange={(e) => setEmergencyContactRelationship(e.target.value)}
              required
              placeholder="e.g. Spouse, Father, Sister"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              required
              placeholder="+91 94480 99881"
              className="w-full border border-slate-300 rounded-md p-2"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={() => navigate('/technicians')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="md"
          variant="primary"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditMode ? 'Update Technician Profile' : 'Save & Register Technician'}
        </Button>
      </div>
    </form>
  );
}
