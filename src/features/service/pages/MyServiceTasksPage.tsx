/**
 * MyServiceTasksPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Technician Field Operations View in Module M08.
 * Tailored for logged-in field technicians performing on-site service work.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  PlayCircle,
  Clock,
  MapPin,
  Phone,
  Cpu,
  ArrowRight,
  User,
} from 'lucide-react';
import type { ServiceTask } from '../types/serviceTask.types';
import { serviceTaskService } from '../services/serviceTaskService';
import { TaskStatusBadge, PriorityBadge } from '../components/ServiceStatusBadge';

export const MyServiceTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [selectedTechId, setSelectedTechId] = useState('tech-001'); // Sanjay Verma by default
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);

  const loadMyTasks = async (techId: string) => {
    try {
      setIsLoading(true);
      const res = await serviceTaskService.getMyTasks(techId);
      setTasks(res);
    } catch (err) {
      console.error('Failed to load my tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks(selectedTechId);
  }, [selectedTechId]);

  const handleQuickStatus = async (taskId: string, status: any, progress?: number) => {
    try {
      await serviceTaskService.updateStatus(taskId, status, progress);
      await loadMyTasks(selectedTechId);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'active') return t.status === 'in_progress' || t.status === 'accepted';
    if (activeFilter === 'upcoming') return t.status === 'assigned' || t.status === 'scheduled';
    if (activeFilter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            My Assigned Service Tasks
          </h1>
          <p className="text-xs text-slate-500">
            Field work order execution, diagnostic checklist, and customer completion sign-off.
          </p>
        </div>

        {/* Technician Persona Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Technician Persona:</span>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="text-xs font-semibold text-green-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="tech-001">Sanjay Verma (Lead Tech)</option>
            <option value="tech-003">Vikram Singh (Diagnostics)</option>
            <option value="tech-004">Arjun Nair (Battery Specialist)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        {[
          { id: 'active', label: 'Active Work Orders' },
          { id: 'upcoming', label: 'Upcoming Dispatches' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All Personal Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as any)}
            className={`pb-3 relative transition-colors ${
              activeFilter === tab.id
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading assignments...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <Wrench className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">No tasks in this view</h3>
          <p className="text-xs text-slate-500">You are all caught up on this queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                    {task.taskId}
                  </span>
                  <TaskStatusBadge status={task.status} size="sm" />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-xs font-mono text-green-700">Ref: {task.ticketRef}</span>
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(task.id, 'accepted', 10)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accept Work
                    </button>
                  )}

                  {(task.status === 'accepted' || task.status === 'scheduled') && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(task.id, 'in_progress', 25)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Start Work
                    </button>
                  )}

                  <Link
                    to={`/service/tasks/${task.id}`}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    Open Inspection <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Task Details Body */}
              <div className="space-y-2 text-xs">
                <h3 className="text-sm font-bold text-slate-900">{task.taskDescription}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{task.customerName} — {task.siteAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.productName} (SN: {task.serialNumber || 'N/A'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">Scheduled: {task.scheduledDate || 'Flexible'} ({task.scheduledTimeSlot || 'Morning'})</span>
                  </div>
                </div>

                {task.workInstructions && (
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 italic">
                    "{task.workInstructions}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
