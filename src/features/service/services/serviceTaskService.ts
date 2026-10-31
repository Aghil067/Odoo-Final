/**
 * serviceTaskService.ts
 * ─────────────────────────────────────────────────────────────
 * Service layer for Service Tasks, Inspections & Field Work in Module M08.
 */

import type {
  ServiceTask,
  ServiceTaskFormData,
  ServiceTaskFilters,
  ServiceTaskStatus,
  ServiceInspectionRecord,
  ServiceRepairRecord,
  SparePartRequirement,
  ServicePhoto,
  ServiceCustomerConfirmation,
} from '../types/serviceTask.types';
import { MOCK_SERVICE_TASKS } from '../data/mockServiceData';
import { serviceTicketService } from './serviceTicketService';

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _tasksStore: ServiceTask[] = [...MOCK_SERVICE_TASKS];

export const serviceTaskService = {
  async list(filters: ServiceTaskFilters = {}): Promise<{
    data: ServiceTask[];
    total: number;
  }> {
    await delay();
    let results = [..._tasksStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.taskId.toLowerCase().includes(q) ||
          t.ticketRef.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.productName.toLowerCase().includes(q) ||
          t.taskDescription.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      results = results.filter((t) => t.status === filters.status);
    }

    if (filters.priority) {
      results = results.filter((t) => t.priority === filters.priority);
    }

    if (filters.technicianId) {
      results = results.filter((t) => t.assignedTechnicianId === filters.technicianId);
    }

    if (filters.ticketId) {
      results = results.filter((t) => t.ticketId === filters.ticketId || t.ticketRef === filters.ticketId);
    }

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<ServiceTask | null> {
    await delay();
    return _tasksStore.find((t) => t.id === id || t.taskId === id) || null;
  },

  async getTasksForTicket(ticketId: string): Promise<ServiceTask[]> {
    await delay();
    return _tasksStore.filter((t) => t.ticketId === ticketId || t.ticketRef === ticketId);
  },

  async getMyTasks(technicianId = 'tech-001'): Promise<ServiceTask[]> {
    await delay();
    return _tasksStore.filter((t) => t.assignedTechnicianId === technicianId);
  },

  async create(data: ServiceTaskFormData): Promise<ServiceTask> {
    await delay();
    const newId = `tsk-${String(_tasksStore.length + 1).padStart(3, '0')}`;
    const newTaskId = `TSK-2026-${String(_tasksStore.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const isAssigned = !!data.assignedTechnicianId;

    const newTask: ServiceTask = {
      id: newId,
      taskId: newTaskId,
      ticketId: data.ticketId,
      ticketRef: data.ticketRef,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      siteAddress: data.siteAddress,
      siteCity: data.siteCity,
      productName: data.productName,
      serialNumber: data.serialNumber,

      requiredSkills: data.requiredSkills,
      taskDescription: data.taskDescription,
      workInstructions: data.workInstructions,
      priority: data.priority,

      assignedTechnicianId: data.assignedTechnicianId,
      assignedTechnicianName: data.assignedTechnicianName,
      assignedTeamId: data.assignedTeamId,
      assignedTeamName: data.assignedTeamName,
      scheduledDate: data.scheduledDate,
      scheduledTimeSlot: data.scheduledTimeSlot,
      expectedCompletionDate: data.expectedCompletionDate,

      status: isAssigned ? 'assigned' : 'pending',
      progressPercent: 0,
      spareParts: [],
      photos: [],
      createdAt: now,
      updatedAt: now,
    };

    _tasksStore = [newTask, ..._tasksStore];

    // Link task ID to parent ticket
    try {
      const ticket = await serviceTicketService.getById(data.ticketId);
      if (ticket) {
        await serviceTicketService.update(data.ticketId, {
          taskIds: [...ticket.taskIds, newId],
          status: isAssigned && ticket.status === 'open' ? 'assigned' : ticket.status,
          assignedTechnicianId: data.assignedTechnicianId || ticket.assignedTechnicianId,
          assignedTechnicianName: data.assignedTechnicianName || ticket.assignedTechnicianName,
        });
      }
    } catch (err) {
      console.warn('Could not update parent ticket tasks', err);
    }

    return newTask;
  },

  async update(id: string, data: Partial<ServiceTask>): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;
    return updated;
  },

  async updateStatus(id: string, status: ServiceTaskStatus, progressPercent?: number): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const current = _tasksStore[index];
    const now = new Date().toISOString();

    let autoProgress = current.progressPercent;
    if (progressPercent !== undefined) {
      autoProgress = progressPercent;
    } else if (status === 'completed') {
      autoProgress = 100;
    } else if (status === 'in_progress' && autoProgress === 0) {
      autoProgress = 25;
    }

    const updated: ServiceTask = {
      ...current,
      status,
      progressPercent: autoProgress,
      startedAt: status === 'in_progress' && !current.startedAt ? now : current.startedAt,
      completedAt: status === 'completed' && !current.completedAt ? now : current.completedAt,
      updatedAt: now,
    };

    _tasksStore[index] = updated;

    // Update parent ticket status if task moves to in_progress or completed
    if (status === 'in_progress') {
      await serviceTicketService.updateStatus(current.ticketId, 'in_progress', `Technician started work on ${current.taskId}`);
    }

    return updated;
  },

  async recordInspection(id: string, inspection: ServiceInspectionRecord): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      inspection,
      status: 'in_progress',
      progressPercent: Math.max(_tasksStore[index].progressPercent, 40),
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;
    return updated;
  },

  async recordRepair(id: string, repair: ServiceRepairRecord): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      repair,
      status: repair.outcome === 'successfully_repaired' ? 'completed' : 'awaiting_parts',
      progressPercent: repair.outcome === 'successfully_repaired' ? 90 : 60,
      completedAt: repair.outcome === 'successfully_repaired' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;
    return updated;
  },

  async requestParts(id: string, part: SparePartRequirement): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      spareParts: [..._tasksStore[index].spareParts, part],
      status: 'awaiting_parts',
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;

    // Notify ticket status
    await serviceTicketService.updateStatus(_tasksStore[index].ticketId, 'awaiting_parts', `Spare parts requisitioned: ${part.productName}`);

    return updated;
  },

  async addPhoto(id: string, photo: ServicePhoto): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      photos: [..._tasksStore[index].photos, photo],
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;
    return updated;
  },

  async recordCustomerConfirmation(id: string, confirmation: ServiceCustomerConfirmation): Promise<ServiceTask> {
    await delay();
    const index = _tasksStore.findIndex((t) => t.id === id || t.taskId === id);
    if (index === -1) {
      throw new Error(`Service task not found: ${id}`);
    }

    const updated: ServiceTask = {
      ..._tasksStore[index],
      customerConfirmation: confirmation,
      status: 'completed',
      progressPercent: 100,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    _tasksStore[index] = updated;
    return updated;
  },
};

