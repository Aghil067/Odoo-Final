/**
 * TechnicianDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Technician Profile Dossier for Module M06.
 * Displays profile overview, qualifications, skills, emergency contacts,
 * live availability, and assigned installation/service jobs.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Clock,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import type { Technician } from '../types/technician.types';
import type { TechnicianAssignment } from '../types/assignment.types';
import type { LeaveRecord } from '../types/availability.types';
import { technicianService } from '../services/technicianService';
import { assignmentService } from '../services/assignmentService';
import { availabilityService } from '../services/availabilityService';
import {
  TECHNICIAN_SKILL_LABELS,
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_STATUS_COLORS,
  EMPLOYMENT_STATUS_COLORS,
} from '../types/technician.types';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '../types/assignment.types';
import { Button } from '../../../components/ui/Button';

export function TechnicianDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [technician, setTechnician] = useState<Technician | null>(null);
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [tech, myAsns, techLeaves] = await Promise.all([
          technicianService.getById(id),
          assignmentService.getMyAssignments(id),
          availabilityService.getLeaves(id),
        ]);
        setTechnician(tech);
        setAssignments(myAsns);
        setLeaves(techLeaves);
      } catch (err) {
        console.error('Failed to load technician dossier', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading technician dossier...
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 space-y-3">
        <p>Technician record not found.</p>
        <Link to="/technicians">
          <Button size="sm" variant="outline">
            Return to Technician Directory
          </Button>
        </Link>
      </div>
    );
  }

  const activeAssignments = assignments.filter(
    (a) => a.status === 'in_progress' || a.status === 'assigned' || a.status === 'accepted'
  );
  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Edit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/technicians"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {technician.technicianId}
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                {technician.fullName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Team: <strong>{technician.teamName || 'Unassigned Crew'}</strong> • Supervisor: {technician.supervisorName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/technicians/${technician.id}/edit`}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            {technician.profilePhotoUrl ? (
              <img
                src={technician.profilePhotoUrl}
                alt={technician.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-xl">
                {technician.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {technician.fullName}
                </h2>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    AVAILABILITY_STATUS_COLORS[technician.availabilityStatus]
                  }`}
                >
                  {AVAILABILITY_STATUS_LABELS[technician.availabilityStatus]}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    EMPLOYMENT_STATUS_COLORS[technician.employmentStatus]
                  }`}
                >
                  {technician.employmentStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Employee Ref: <strong className="font-mono">{technician.employeeRefId || 'N/A'}</strong> • Joined {technician.joiningDate}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="font-semibold text-slate-800">
              Employment: <span className="capitalize">{technician.employmentType.replace('_', ' ')}</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Next Free Date: <strong>{technician.nextAvailableDate || '2026-10-31'}</strong>
            </div>
          </div>
        </div>

        {/* Contact and address row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Contact Numbers</span>
            <div className="font-mono font-semibold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{technician.phone}</span>
            </div>
            {technician.alternatePhone && (
              <div className="font-mono text-slate-500 text-[11px]">
                Alt: {technician.alternatePhone}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Email Address</span>
            <div className="font-medium text-slate-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{technician.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Operating City & State</span>
            <div className="font-medium text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{technician.city}, {technician.state} {technician.pinCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Column Details: Left (Skills & Performance) | Right (Assignments & Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Skills, Qualifications, Emergency */}
        <div className="space-y-6">
          {/* Skills and Qualifications */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Skills & Technical Expertise
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Experience:</span>
                <div className="font-bold text-slate-800 text-sm">
                  {technician.qualification.yearsOfExperience} Years in Field Solar
                </div>
              </div>

              {technician.qualification.qualification && (
                <div>
                  <span className="text-slate-400">Formal Education / ITI:</span>
                  <div className="font-semibold text-slate-800">
                    {technician.qualification.qualification}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-1">Qualified Solar Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {technician.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium"
                    >
                      {TECHNICIAN_SKILL_LABELS[sk]}
                    </span>
                  ))}
                </div>
              </div>

              {technician.qualification.certifications.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Certifications:</span>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                    {technician.qualification.certifications.map((cert, idx) => (
                      <li key={idx} className="font-medium">{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {technician.qualification.trainingDetails && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400">OEM Training Details:</span>
                  <p className="text-slate-600 italic mt-0.5">
                    {technician.qualification.trainingDetails}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Emergency Contact
              </h3>
            </div>
            <div>Name: <strong>{technician.emergencyContact.name}</strong></div>
            <div>Relationship: <strong>{technician.emergencyContact.relationship}</strong></div>
            <div className="font-mono">Phone: <strong>{technician.emergencyContact.phone}</strong></div>
          </div>

          {/* Performance Summary (Actual metrics only) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Operational Performance
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xl font-bold text-emerald-700">
                  {technician.completedInstallationsCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Installations Done</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-700">
                  {technician.completedServiceTasksCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Service Tickets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active & Historical Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Current & Upcoming Assignments ({activeAssignments.length})</span>
              </h3>
            </div>

            {activeAssignments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active or scheduled assignments for this technician right now.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((asn) => (
                  <div
                    key={asn.id}
                    className="border border-slate-200 rounded-lg p-3.5 hover:bg-slate-50 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">
                            {asn.referenceId}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {asn.customerName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ASSIGNMENT_STATUS_COLORS[asn.status]
                            }`}
                          >
                            {ASSIGNMENT_STATUS_LABELS[asn.status]}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {asn.referenceTitle}
                        </p>
                      </div>

                      {asn.type === 'installation' && (
                        <Link
                          to={`/installations/${asn.referenceId.toLowerCase()}/execution`}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline text-[11px]"
                        >
                          <span>Field Execution</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{asn.scheduledStartDate} → {asn.scheduledEndDate}</span>
                      </span>
                      <span>Site: <strong>{asn.siteCity}</strong></span>
                      <span>Role: <strong>{asn.assignedTechnicians.find((t) => t.technicianId === technician.id)?.role || 'Crew'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave & Schedule Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Working Schedule & Approved Leaves</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {technician.weeklyScheduleSummary || 'Mon-Sat, 08:30 - 17:30'}
              </span>
            </div>

            {leaves.length === 0 ? (
              <p className="text-xs text-slate-400">No scheduled leaves recorded.</p>
            ) : (
              <div className="space-y-2">
                {leaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/40 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-purple-900 capitalize">
                        {lv.leaveType} Leave
                      </span>
                      <span className="text-slate-500 ml-2">
                        {lv.startDate} to {lv.endDate}
                      </span>
                      {lv.reason && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Reason: {lv.reason}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      APPROVED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Assignment History */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Completed Assignments Log ({completedAssignments.length})</span>
              </h3>
            </div>

            {completedAssignments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No completed work orders recorded in current session.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {completedAssignments.map((asn) => (
                  <div
                    key={asn.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">
                        {asn.referenceId}
                      </span>
                      <span className="ml-2 font-semibold text-slate-700">
                        {asn.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Completed on {asn.actualEndDate || asn.scheduledEndDate}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
