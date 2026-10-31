/**
 * ServiceAssignmentsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Dedicated Service Assignments & Scheduling Dispatch Page in Module M08.
 * Integrates directly with M06 Technician Management.
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceTask } from '../types/serviceTask.types';
import type { Technician } from '../../technicians/types/technician.types';
import { serviceTaskService } from '../services/serviceTaskService';
import { technicianService } from '../../technicians/services/technicianService';
import { TaskStatusBadge, PriorityBadge } from '../components/ServiceStatusBadge';
import { TechnicianServiceAssignmentModal } from '../components/TechnicianServiceAssignmentModal';

export const ServiceAssignmentsPage: React.FC = () => {
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [taskRes, techRes] = await Promise.all([
        serviceTaskService.list(),
        technicianService.list(),
      ]);
      setTasks(taskRes.data || []);
      setTechnicians(Array.isArray(techRes) ? techRes : (techRes as any).data || []);
    } catch (err) {
      console.error('Failed to load assignments data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignConfirm = async (assignment: {
    technicianId: string;
    technicianName: string;
    teamId?: string;
    teamName?: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
  }) => {
    if (!selectedTask) return;
    await serviceTaskService.update(selectedTask.id, {
      assignedTechnicianId: assignment.technicianId,
      assignedTechnicianName: assignment.technicianName,
      assignedTeamId: assignment.teamId,
      assignedTeamName: assignment.teamName,
      scheduledDate: assignment.scheduledDate,
      scheduledTimeSlot: assignment.scheduledTimeSlot,
      status: 'assigned',
    });
    setSelectedTask(null);
    await loadData();
  };

  const unassignedTasks = tasks.filter((t) => !t.assignedTechnicianId);
  const activeAssignments = tasks.filter((t) => t.assignedTechnicianId && t.status !== 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-600" />
            Technician Service Dispatch & Assignments
          </h1>
          <p className="text-xs text-slate-500">
            Allocate certified solar technicians to customer service tasks with skill match verification.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors self-start sm:self-auto disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unassigned and Active Dispatches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unassigned Tasks */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Unassigned Service Tasks ({unassignedTasks.length})
              </h3>
            </div>

            {unassignedTasks.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">All current service tasks are assigned.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{task.taskId}</span>
                        <PriorityBadge priority={task.priority} />
                        <span className="font-mono text-green-700">Ref: {task.ticketRef}</span>
                      </div>
                      <p className="font-medium text-slate-800">{task.taskDescription}</p>
                      <p className="text-[11px] text-slate-500">
                        {task.customerName} • {task.siteAddress}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Tech
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Dispatches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Active Field Dispatches ({activeAssignments.length})
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {activeAssignments.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{task.taskId}</span>
                      <TaskStatusBadge status={task.status} size="sm" />
                      <span className="text-[11px] font-mono text-slate-400">
                        Visit: {task.scheduledDate || 'TBD'}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{task.taskDescription}</p>
                    <p className="text-[11px] text-slate-500">
                      Tech: <span className="font-semibold text-slate-700">{task.assignedTechnicianName}</span> • Progress: {task.progressPercent}%
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded transition-colors"
                    >
                      Reassign
                    </button>
                    <Link
                      to={`/service/tasks/${task.id}`}
                      className="px-2.5 py-1 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-semibold rounded transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Technician Availability Watch (from M06) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Technician Roster (M06)</h3>
            <p className="text-xs text-slate-500">Live technician availability state.</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-[500px] overflow-y-auto">
            {technicians.map((tech) => (
              <div key={tech.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{tech.fullName}</p>
                  <p className="text-[11px] text-slate-500">{tech.qualification?.qualification || tech.teamName || 'Solar Technician'}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                    tech.availabilityStatus === 'available'
                      ? 'bg-emerald-50 text-emerald-700'
                      : tech.availabilityStatus === 'busy'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tech.availabilityStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TechnicianServiceAssignmentModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          onAssign={handleAssignConfirm}
        />
      )}
    </div>
  );
};
