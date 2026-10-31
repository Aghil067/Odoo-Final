/**
 * ServiceTicketDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Individual Service Ticket Dossier & Operations Page in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HeadphonesIcon, ArrowLeft } from 'lucide-react';
import type { ServiceTicket } from '../types/serviceTicket.types';
import type { ServiceTask, ServiceTaskFormData } from '../types/serviceTask.types';
import type { ServiceTicketResolution } from '../types/serviceResolution.types';
import { serviceTicketService } from '../services/serviceTicketService';
import { serviceTaskService } from '../services/serviceTaskService';
import { serviceResolutionService } from '../services/serviceResolutionService';
import { ServiceTicketDetails } from '../components/ServiceTicketDetails';
import { ServiceTaskFormModal } from '../components/ServiceTaskFormModal';
import { useAuth } from '../../auth/hooks/useAuth';

export const ServiceTicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [resolution, setResolution] = useState<ServiceTicketResolution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const loadTicketData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [t, tList, res] = await Promise.all([
        serviceTicketService.getById(id),
        serviceTaskService.getTasksForTicket(id),
        serviceResolutionService.getResolution(id),
      ]);
      setTicket(t);
      setTasks(tList);
      setResolution(res);
    } catch (err) {
      console.error('Failed to load ticket dossier', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const handleAssignTech = async (assignment: {
    technicianId: string;
    technicianName: string;
    teamId?: string;
    teamName?: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
  }) => {
    if (!ticket) return;
    await serviceTicketService.update(ticket.id, {
      assignedTechnicianId: assignment.technicianId,
      assignedTechnicianName: assignment.technicianName,
      assignedTeamId: assignment.teamId,
      assignedTeamName: assignment.teamName,
      scheduledVisitDate: assignment.scheduledDate,
      status: ticket.status === 'open' || ticket.status === 'awaiting_assignment' ? 'assigned' : ticket.status,
    });
    await loadTicketData();
  };

  const handleCreateTask = async (data: ServiceTaskFormData) => {
    await serviceTaskService.create(data);
    await loadTicketData();
  };

  const handleResolve = async (res: ServiceTicketResolution) => {
    if (!id) return;
    await serviceResolutionService.resolveTicket(id, res);
    await loadTicketData();
  };

  const handleClose = async () => {
    if (!id) return;
    await serviceResolutionService.closeTicket(id, user?.name || 'Service Manager');
    await loadTicketData();
  };

  const handleReopen = async (reason: string) => {
    if (!id) return;
    await serviceResolutionService.reopenTicket(id, reason);
    await loadTicketData();
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading service ticket dossier...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 space-y-3">
        <HeadphonesIcon className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="text-base font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">The requested ticket does not exist or has been removed.</p>
        <Link
          to="/service/tickets"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ServiceTicketDetails
        ticket={ticket}
        tasks={tasks}
        resolution={resolution}
        onAssignTech={handleAssignTech}
        onOpenCreateTask={() => setShowCreateTaskModal(true)}
        onResolve={handleResolve}
        onCloseTicket={handleClose}
        onReopenTicket={handleReopen}
        userRole={user?.role || 'admin'}
      />

      <ServiceTaskFormModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        ticketId={ticket.id}
        ticketRef={ticket.ticketId}
        customerId={ticket.customerId}
        customerName={ticket.customerName}
        customerPhone={ticket.customerPhone}
        siteAddress={ticket.siteAddress || ''}
        siteCity={ticket.siteCity}
        productName={ticket.productName}
        serialNumber={ticket.serialNumber}
        priority={ticket.priority}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};

