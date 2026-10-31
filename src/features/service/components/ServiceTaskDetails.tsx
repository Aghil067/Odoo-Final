/**
 * ServiceTaskDetails.tsx
 * ─────────────────────────────────────────────────────────────
 * Complete task execution & field workflow screen in Module M08.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  ArrowLeft,
} from 'lucide-react';
import type {
  ServiceTask,
  ServiceTaskStatus,
  ServiceInspectionRecord,
  ServiceRepairRecord,
  SparePartRequirement,
  ServicePhoto,
  ServiceCustomerConfirmation,
} from '../types/serviceTask.types';
import { TaskStatusBadge, PriorityBadge } from './ServiceStatusBadge';
import { ServiceInspectionForm } from './ServiceInspectionForm';
import { SparePartsPanel } from './SparePartsPanel';

interface ServiceTaskDetailsProps {
  task: ServiceTask;
  onUpdateStatus: (status: ServiceTaskStatus, progress?: number) => Promise<void>;
  onSaveInspection: (inspection: ServiceInspectionRecord) => Promise<void>;
  onSaveRepair: (repair: ServiceRepairRecord) => Promise<void>;
  onRequestPart: (part: SparePartRequirement) => Promise<void>;
  onAddPhoto: (photo: ServicePhoto) => Promise<void>;
  onSaveConfirmation: (confirmation: ServiceCustomerConfirmation) => Promise<void>;
  userRole?: string;
}

export const ServiceTaskDetails: React.FC<ServiceTaskDetailsProps> = ({
  task,
  onUpdateStatus,
  onSaveInspection,
  onSaveRepair,
  onRequestPart,
  onAddPhoto,
  onSaveConfirmation,
}) => {
  const [activeTab, setActiveTab] = useState<'execution' | 'parts'>('execution');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: ServiceTaskStatus, progress?: number) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(newStatus, progress);
    } catch (err: any) {
      alert('Failed to update task status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/service/tickets/${task.ticketId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket {task.ticketRef}
        </Link>
      </div>

      {/* Task Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {task.taskId}
              </span>
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="text-xs font-mono text-green-700 font-semibold">
                Ticket: {task.ticketRef}
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900">{task.taskDescription}</h1>
            <p className="text-xs text-slate-500">
              Assigned Specialist:{' '}
              <span className="font-semibold text-slate-800">{task.assignedTechnicianName || 'Unassigned'}</span> • Scheduled: <span className="font-semibold text-slate-800">{task.scheduledDate || 'TBD'} ({task.scheduledTimeSlot || 'Standard'})</span>
            </p>
          </div>

          {/* Workflow Action Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            {task.status === 'assigned' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('accepted', 10)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Task
              </button>
            )}

            {(task.status === 'accepted' || task.status === 'scheduled') && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('in_progress', 25)}
                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                Start Field Work
              </button>
            )}

            {task.status === 'in_progress' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('on_hold', task.progressPercent)}
                className="px-3 py-1.5 border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                Put On Hold
              </button>
            )}

            {task.status === 'on_hold' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('in_progress', task.progressPercent)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                Resume Task
              </button>
            )}
          </div>
        </div>

        {/* Work Instructions Strip */}
        {task.workInstructions && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-semibold text-slate-800">Field Work Instructions: </span>
            {task.workInstructions}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span className="font-medium">Task Completion Progress</span>
            <span className="font-mono font-bold text-slate-900">{task.progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                task.progressPercent === 100
                  ? 'bg-emerald-500'
                  : task.progressPercent > 50
                  ? 'bg-purple-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${task.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'execution'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Inspection, Repair & Handover
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'parts'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Spare Parts Requisition ({task.spareParts.length})
        </button>
      </div>

      {activeTab === 'execution' && (
        <ServiceInspectionForm
          task={task}
          onSaveInspection={onSaveInspection}
          onSaveRepair={onSaveRepair}
          onAddPhoto={onAddPhoto}
          onSaveConfirmation={onSaveConfirmation}
        />
      )}

      {activeTab === 'parts' && (
        <SparePartsPanel
          spareParts={task.spareParts}
          onRequestPart={onRequestPart}
          isReadOnly={task.status === 'completed'}
        />
      )}
    </div>
  );
};
