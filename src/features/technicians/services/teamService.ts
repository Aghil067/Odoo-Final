/**
 * teamService.ts
 * ─────────────────────────────────────────────────────────────
 * Master service layer for Technician Teams and Field Crews.
 */

import type { TechnicianTeam, TeamFormData } from '../types/team.types';
import { MOCK_TEAMS, MOCK_TECHNICIANS } from '../data/mockTechnicianData';

let teamsStore: TechnicianTeam[] = [...MOCK_TEAMS];

export const teamService = {
  /**
   * List all teams with resolved member objects.
   */
  async list(): Promise<TechnicianTeam[]> {
    return teamsStore.map((team) => {
      const members = MOCK_TECHNICIANS.filter((t) => team.memberIds.includes(t.id)).map((t) => ({
        id: t.id,
        technicianId: t.technicianId,
        name: t.fullName,
        role: t.id === team.leaderId ? 'Team Leader' : 'Crew Member',
        phone: t.phone,
      }));

      return {
        ...team,
        members,
        memberCount: team.memberIds.length,
      };
    });
  },

  /**
   * Get team by ID.
   */
  async getById(id: string): Promise<TechnicianTeam | null> {
    const team = teamsStore.find((t) => t.id === id || t.teamId.toLowerCase() === id.toLowerCase());
    if (!team) return null;

    const members = MOCK_TECHNICIANS.filter((t) => team.memberIds.includes(t.id)).map((t) => ({
      id: t.id,
      technicianId: t.technicianId,
      name: t.fullName,
      role: t.id === team.leaderId ? 'Team Leader' : 'Crew Member',
      phone: t.phone,
    }));

    return {
      ...team,
      members,
      memberCount: team.memberIds.length,
    };
  },

  /**
   * Create a new team.
   */
  async create(data: TeamFormData): Promise<TechnicianTeam> {
    const nextNum = teamsStore.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newId = `team-${padded}`;
    const newTeamId = `TEAM-${padded}`;
    const nowIso = new Date().toISOString();

    const leader = MOCK_TECHNICIANS.find((t) => t.id === data.leaderId);

    const newTeam: TechnicianTeam = {
      id: newId,
      teamId: newTeamId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      operatingRegion: data.operatingRegion,
      speciality: data.speciality,
      leaderId: data.leaderId,
      leaderName: leader?.fullName || 'Assigned Leader',
      leaderPhone: leader?.phone,
      memberIds: Array.from(new Set([data.leaderId, ...data.memberIds])),
      memberCount: data.memberIds.length + (data.memberIds.includes(data.leaderId) ? 0 : 1),
      status: data.status,
      currentActiveJobsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    teamsStore.push(newTeam);
    return { ...newTeam };
  },

  /**
   * Update team attributes.
   */
  async update(id: string, updates: Partial<TechnicianTeam>): Promise<TechnicianTeam> {
    const idx = teamsStore.findIndex((t) => t.id === id || t.teamId === id);
    if (idx === -1) throw new Error('Team not found');

    const updated = {
      ...teamsStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    teamsStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Add a technician member to a team.
   */
  async addMember(teamId: string, technicianId: string): Promise<TechnicianTeam> {
    const idx = teamsStore.findIndex((t) => t.id === teamId || t.teamId === teamId);
    if (idx === -1) throw new Error('Team not found');

    const team = teamsStore[idx];
    if (!team.memberIds.includes(technicianId)) {
      team.memberIds.push(technicianId);
      team.memberCount = team.memberIds.length;
      team.updatedAt = new Date().toISOString();
    }

    return { ...team };
  },

  /**
   * Remove a member from a team.
   */
  async removeMember(teamId: string, technicianId: string): Promise<TechnicianTeam> {
    const idx = teamsStore.findIndex((t) => t.id === teamId || t.teamId === teamId);
    if (idx === -1) throw new Error('Team not found');

    const team = teamsStore[idx];
    team.memberIds = team.memberIds.filter((mid) => mid !== technicianId);
    team.memberCount = team.memberIds.length;
    team.updatedAt = new Date().toISOString();

    return { ...team };
  },
};
