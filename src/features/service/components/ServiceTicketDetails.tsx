/**
 * ServiceTicketDetails.tsx
 * ─────────────────────────────────────────────────────────────
 * Comprehensive Service Ticket Dossier component for Module M08.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Cpu,
  Shield,
  AlertTriangle,
  Plus,
  Camera,
} from 'lucide-react';
import type { ServiceTicket } from '../types/serviceTicket.types';
import type { ServiceTask } from '../types/serviceTask.types';
import type { ServiceTicketResolution } from '../types/serviceResolution.types';
import {
  TicketStatusBadge,
  PriorityBadge,
  WarrantyIndicatorBadge,
} from './ServiceStatusBadge';
import { WarrantyInfoPanel } from './WarrantyInfoPanel';
import { ServiceTimeline } from './ServiceTimeline';
import { ServiceTaskTable } from './ServiceTaskTable';
import { ServiceResolutionForm } from './ServiceResolutionForm';
import { TechnicianServiceAssignmentModal } from './TechnicianServiceAssignmentModal';

interface ServiceTicketDetailsProps {
  ticket: ServiceTicket;
  tasks: ServiceTask[];
  resolution?: ServiceTicketResolution | null;
  onAssignTech: (data: any) => Promise<void>;
  onOpenCreateTask: () => void;
  onResolve: (resolution: ServiceTicketResolution) => Promise<void>;
  onCloseTicket: () => Promise<void>;
  onReopenTicket: (reason: string) => Promise<void>;
  userRole?: string;
}

export const ServiceTicketDetails: React.FC<ServiceTicketDetailsProps> = ({
  ticket,
  tasks,
  resolution,
  onAssignTech,
  onOpenCreateTask,
  onResolve,
  onCloseTicket,
  onReopenTicket,
  userRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'resolution' | 'timeline'>('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const isManager = userRole === 'admin' || userRole === 'service_manager';

  // Dummy task for assignment modal if task list has tasks or using ticket data
  const primaryTask: ServiceTask = tasks[0] || {
    id: `temp-${ticket.id}`,
    taskId: `TSK-REQ-${ticket.ticketId}`,
    ticketId: ticket.id,
    ticketRef: ticket.ticketId,
    customerId: ticket.customerId,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    siteAddress: ticket.siteAddress || '',
    productName: ticket.productName,
    requiredSkills: ['inverter_troubleshooting', 'electrical_wiring'],
    taskDescription: ticket.detailedDescription,
    priority: ticket.priority,
    status: 'pending',
    progressPercent: 0,
    spareParts: [],
    photos: [],
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {ticket.ticketId}
              </span>
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-slate-400 font-mono">Date: {ticket.reportedDate}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{ticket.issueTitle}</h1>
            <p className="text-xs text-slate-500 font-mono">
              Equipment: <span className="font-semibold text-slate-800">{ticket.productName}</span> • Serial:{' '}
              <span className="font-semibold text-green-700">{ticket.serialNumber || 'N/A'}</span> • Customer:{' '}
              <span className="font-semibold text-slate-800">{ticket.customerName}</span>
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-2">
            {isManager && ticket.status !== 'closed' && (
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <User className="w-4 h-4" />
                {ticket.assignedTechnicianName ? 'Reassign Tech' : 'Assign Technician'}
              </button>
            )}

            {isManager && ticket.status !== 'closed' && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Service Task
              </button>
            )}

            {ticket.warrantyId && (
              <Link
                to={`/warranty/${ticket.warrantyId}`}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4 text-green-600" />
                Warranty Dossier
              </Link>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Assigned Specialist</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {ticket.assignedTechnicianName || 'Unassigned'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Scheduled Service Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
              {ticket.scheduledVisitDate || 'Visit Not Scheduled'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Warranty Indicator</span>
            <div className="mt-0.5">
              <WarrantyIndicatorBadge indicator={ticket.warrantyIndicator} />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 block">Field Service Tasks</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {tasks.length} task{tasks.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        {(
          [
            { id: 'overview', label: 'Ticket Overview' },
            { id: 'tasks', label: `Service Tasks (${tasks.length})` },
            { id: 'resolution', label: 'Resolution & Closure' },
            { id: 'timeline', label: 'Activity Timeline' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 relative transition-colors ${
              activeTab === t.id
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer & Location */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Customer & Site Information
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">{ticket.customerName}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span className="font-mono text-slate-800">{ticket.customerPhone}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{ticket.customerEmail}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Installation Ref:</span>
                  <span className="font-mono text-green-700 font-semibold">
                    {ticket.installationRef || 'Over-the-counter'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Site Location:</span>
                  <span className="text-right text-slate-700 max-w-[220px]">
                    {ticket.siteAddress ? `${ticket.siteAddress}, ${ticket.siteCity || ''}` : 'Customer Address'}
                  </span>
                </div>
              </div>
            </div>

            {/* Equipment details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-green-600" />
                Equipment & Hardware Information
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Equipment Name:</span>
                  <span className="font-medium text-slate-900">{ticket.productName}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Serial Number:</span>
                  <span className="font-mono font-bold text-green-700">
                    {ticket.serialNumber || 'Unserialized / Non-tracked'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Manufacturer:</span>
                  <span className="text-slate-800">{ticket.manufacturer || 'OEM Solar Standard'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="text-slate-800">{ticket.modelNumber || 'Standard'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Installed Location:</span>
                  <span className="text-slate-800">{ticket.equipmentLocation || 'Rooftop Utility Rack'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Description & Evidence */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Reported Problem & Customer Observations
            </h3>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Detailed Defect Description:</span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                {ticket.detailedDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Error Code on Display</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                  {ticket.errorCode || 'No specific fault code recorded'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Customer Observations</span>
                <span className="text-slate-700 mt-0.5 block">
                  {ticket.customerObservations || 'Reported via telephone helpline'}
                </span>
              </div>
            </div>

            {ticket.supportingPhotos && ticket.supportingPhotos.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Attached Customer Evidence ({ticket.supportingPhotos.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ticket.supportingPhotos.map((url, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-24 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warranty Panel */}
          <WarrantyInfoPanel
            indicator={ticket.warrantyIndicator}
            warrantyId={ticket.warrantyId}
            warrantyRef={ticket.warrantyRef}
            warrantyStatus={ticket.warrantyStatus}
            warrantyStartDate={ticket.warrantyStartDate}
            warrantyExpiryDate={ticket.warrantyExpiryDate}
            warrantyCoverageType={ticket.warrantyCoverageType}
            warrantyCoverageDescription={ticket.warrantyCoverageDescription}
          />
        </div>
      )}

      {/* Tab 2: Service Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <ServiceTaskTable
            tasks={tasks}
            onOpenCreate={isManager && ticket.status !== 'closed' ? onOpenCreateTask : undefined}
          />
        </div>
      )}

      {/* Tab 3: Resolution & Closure */}
      {activeTab === 'resolution' && (
        <ServiceResolutionForm
          initialResolution={resolution || undefined}
          ticketStatus={ticket.status}
          onResolve={onResolve}
          onCloseTicket={onCloseTicket}
          onReopenTicket={onReopenTicket}
          isManager={isManager}
        />
      )}

      {/* Tab 4: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Service Operations Audit Trail</h3>
          <ServiceTimeline activities={ticket.activityTimeline} />
        </div>
      )}

      {/* Technician Assignment Modal */}
      <TechnicianServiceAssignmentModal
        task={primaryTask}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={onAssignTech}
      />
    </div>
  );
};
