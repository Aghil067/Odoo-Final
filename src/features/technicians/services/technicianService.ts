/**
 * technicianService.ts
 * ─────────────────────────────────────────────────────────────
 * Master service layer for technician records, qualifications, and workloads.
 */

import type {
  Technician,
  TechnicianFilters,
  TechnicianFormData,
} from '../types/technician.types';
import { MOCK_TECHNICIANS, MOCK_TEAMS } from '../data/mockTechnicianData';

export interface TechnicianDashboardStats {
  totalTechnicians: number;
  availableTechnicians: number;
  assignedTechnicians: number;
  busyTechnicians: number;
  techniciansOnLeave: number;
  totalTeams: number;
  activeAssignments: number;
  completedAssignments: number;
}

let techniciansStore: Technician[] = [...MOCK_TECHNICIANS];

export const technicianService = {
  /**
   * List technicians with multi-attribute filtering.
   */
  async list(filters?: TechnicianFilters): Promise<Technician[]> {
    let result = [...techniciansStore];

    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          t.technicianId.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q)
      );
    }

    if (filters.skill && filters.skill !== 'all') {
      result = result.filter((t) => t.skills.includes(filters.skill as any));
    }

    if (filters.teamId && filters.teamId !== 'all') {
      result = result.filter((t) => t.teamId === filters.teamId);
    }

    if (filters.availabilityStatus && filters.availabilityStatus !== 'all') {
      result = result.filter((t) => t.availabilityStatus === filters.availabilityStatus);
    }

    if (filters.employmentStatus && filters.employmentStatus !== 'all') {
      result = result.filter((t) => t.employmentStatus === filters.employmentStatus);
    }

    if (filters.employmentType && filters.employmentType !== 'all') {
      result = result.filter((t) => t.employmentType === filters.employmentType);
    }

    return result;
  },

  /**
   * Get a technician by ID or display ID (e.g. "tech-001" or "TECH-0001")
   */
  async getById(id: string): Promise<Technician | null> {
    const found = techniciansStore.find(
      (t) => t.id === id || t.technicianId.toLowerCase() === id.toLowerCase()
    );
    return found ? { ...found } : null;
  },

  /**
   * Create a new technician record.
   */
  async create(data: TechnicianFormData): Promise<Technician> {
    const nextNum = techniciansStore.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    const newId = `tech-${padded}`;
    const newTechId = `TECH-${padded}`;
    const nowIso = new Date().toISOString();

    const team = MOCK_TEAMS.find((tm) => tm.id === data.teamId);

    const certifications = data.certificationsText
      ? data.certificationsText.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const newRecord: Technician = {
      id: newId,
      technicianId: newTechId,
      fullName: data.fullName,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      email: data.email,
      profilePhotoUrl: data.profilePhotoUrl,

      address: data.address,
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,

      employeeRefId: data.employeeRefId || `EMP-SOL-${padded}`,
      joiningDate: data.joiningDate,
      employmentType: data.employmentType,
      employmentStatus: data.employmentStatus,
      teamId: data.teamId,
      teamName: team?.name,
      supervisorName: data.supervisorName || 'Kavita Menon',

      skills: data.skills,
      qualification: {
        qualification: data.qualificationDegree,
        certifications,
        yearsOfExperience: data.yearsOfExperience || 1,
        trainingDetails: data.trainingDetails,
        skillRemarks: data.skillRemarks,
      },

      emergencyContact: {
        name: data.emergencyContactName,
        relationship: data.emergencyContactRelationship,
        phone: data.emergencyContactPhone,
      },

      availabilityStatus: 'available',
      currentAssignmentCount: 0,
      nextAvailableDate: data.joiningDate,
      weeklyScheduleSummary: 'Mon-Sat, 08:30 - 17:30',

      completedInstallationsCount: 0,
      completedServiceTasksCount: 0,
      activeAssignmentsCount: 0,

      createdAt: nowIso,
      updatedAt: nowIso,
    };

    techniciansStore.unshift(newRecord);
    return { ...newRecord };
  },

  /**
   * Update technician profile.
   */
  async update(id: string, updates: Partial<Technician>): Promise<Technician> {
    const idx = techniciansStore.findIndex((t) => t.id === id || t.technicianId === id);
    if (idx === -1) throw new Error('Technician not found');

    const updated = {
      ...techniciansStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    techniciansStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Calculate dashboard metrics dynamically.
   */
  async getDashboardStats(): Promise<TechnicianDashboardStats> {
    const all = techniciansStore;

    return {
      totalTechnicians: all.length,
      availableTechnicians: all.filter((t) => t.availabilityStatus === 'available').length,
      assignedTechnicians: all.filter((t) => t.availabilityStatus === 'assigned').length,
      busyTechnicians: all.filter((t) => t.availabilityStatus === 'busy').length,
      techniciansOnLeave: all.filter((t) => t.availabilityStatus === 'on_leave').length,
      totalTeams: MOCK_TEAMS.filter((t) => t.status === 'active').length,
      activeAssignments: all.reduce((acc, t) => acc + (t.activeAssignmentsCount || 0), 0),
      completedAssignments: all.reduce(
        (acc, t) => acc + (t.completedInstallationsCount || 0) + (t.completedServiceTasksCount || 0),
        0
      ),
    };
  },
};
