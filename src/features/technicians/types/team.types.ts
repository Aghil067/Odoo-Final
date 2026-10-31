/**
 * team.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript interfaces for Technician Teams and Crews.
 */

export interface TeamMemberBrief {
  id: string;
  technicianId: string;
  name: string;
  role?: string;
  phone: string;
}

export interface TechnicianTeam {
  id: string;
  teamId: string; // e.g. "TEAM-001"
  name: string; // e.g. "Alpha Solar Crew (Bengaluru Central)"
  code: string; // e.g. "ALPHA-BLR"
  description: string;
  operatingRegion: string;
  speciality: string;

  leaderId: string;
  leaderName: string;
  leaderPhone?: string;

  memberIds: string[];
  members?: TeamMemberBrief[];
  memberCount: number;

  status: 'active' | 'inactive';
  currentActiveJobsCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  code: string;
  description: string;
  operatingRegion: string;
  speciality: string;
  leaderId: string;
  memberIds: string[];
  status: 'active' | 'inactive';
}
