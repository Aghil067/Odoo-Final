/**
 * technician.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces and enums for M06: Technician Management.
 */

export type TechnicianSkill =
  | 'solar_panel_installation'
  | 'inverter_installation'
  | 'battery_installation'
  | 'electrical_wiring'
  | 'dc_wiring'
  | 'ac_wiring'
  | 'earthing'
  | 'electrical_testing'
  | 'troubleshooting'
  | 'maintenance'
  | 'repair';

export type EmploymentType = 'full_time' | 'part_time' | 'contract';

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';

export type AvailabilityStatus =
  | 'available'
  | 'assigned'
  | 'busy'
  | 'on_leave'
  | 'unavailable';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface TechnicianQualification {
  qualification?: string;
  certifications: string[];
  yearsOfExperience: number;
  trainingDetails?: string;
  skillRemarks?: string;
}

export interface Technician {
  id: string; // Internal ID e.g. "tech-001"
  technicianId: string; // Display ID e.g. "TECH-0001"
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  profilePhotoUrl?: string;

  // Address
  address?: string;
  city: string;
  state: string;
  pinCode?: string;

  // Employment
  employeeRefId?: string; // HR ID e.g. "EMP-2024-08"
  joiningDate: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  teamId?: string;
  teamName?: string;
  supervisorName: string; // e.g. "Kavita Menon"

  // Skills & Qualifications
  skills: TechnicianSkill[];
  qualification: TechnicianQualification;

  // Emergency Contact
  emergencyContact: EmergencyContact;

  // Real-time Availability & Current Workload
  availabilityStatus: AvailabilityStatus;
  currentAssignmentCount: number;
  currentAssignmentSummary?: string;
  nextAvailableDate?: string;
  weeklyScheduleSummary?: string; // e.g. "Mon-Sat, 08:30 - 17:30"

  // Cumulative Performance Metrics
  completedInstallationsCount: number;
  completedServiceTasksCount: number;
  activeAssignmentsCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface TechnicianFormData {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  profilePhotoUrl?: string;

  address?: string;
  city: string;
  state: string;
  pinCode?: string;

  employeeRefId?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  teamId?: string;
  supervisorName: string;

  skills: TechnicianSkill[];
  yearsOfExperience: number;
  certificationsText?: string;
  qualificationDegree?: string;
  trainingDetails?: string;
  skillRemarks?: string;

  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export interface TechnicianFilters {
  search?: string;
  skill?: TechnicianSkill | 'all';
  teamId?: string | 'all';
  availabilityStatus?: AvailabilityStatus | 'all';
  employmentStatus?: EmploymentStatus | 'all';
  employmentType?: EmploymentType | 'all';
}

// ─── Human-readable Skill Labels ──────────────────────────────

export const TECHNICIAN_SKILL_LABELS: Record<TechnicianSkill, string> = {
  solar_panel_installation: 'Solar Panel Installation',
  inverter_installation: 'Inverter Installation',
  battery_installation: 'Battery Installation',
  electrical_wiring: 'Electrical Wiring',
  dc_wiring: 'DC Wiring',
  ac_wiring: 'AC Wiring',
  earthing: 'Earthing & Protection',
  electrical_testing: 'Electrical Testing & Comm.',
  troubleshooting: 'Troubleshooting & Diagnostics',
  maintenance: 'Preventive Maintenance',
  repair: 'System Repair',
};

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  assigned: 'Assigned',
  busy: 'Busy / On Site',
  on_leave: 'On Leave',
  unavailable: 'Unavailable',
};

export const AVAILABILITY_STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  busy: 'bg-amber-100 text-amber-800 border-amber-200',
  on_leave: 'bg-purple-100 text-purple-800 border-purple-200',
  unavailable: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-slate-100 text-slate-700 border-slate-200',
  on_leave: 'bg-purple-100 text-purple-800 border-purple-200',
};
