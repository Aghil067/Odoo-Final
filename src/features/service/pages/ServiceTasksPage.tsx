/**
 * ServiceTasksPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Service Tasks Roster Page in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, Plus } from 'lucide-react';
import type { ServiceTask, ServiceTaskFormData } from '../types/serviceTask.types';
import { serviceTaskService } from '../services/serviceTaskService';
import { ServiceTaskTable } from '../components/ServiceTaskTable';
import { ServiceTaskFormModal } from '../components/ServiceTaskFormModal';

export const ServiceTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const res = await serviceTaskService.list();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (data: ServiceTaskFormData) => {
    await serviceTaskService.create(data);
    await loadTasks();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Service Tasks & Field Dispatches
          </h1>
          <p className="text-xs text-slate-500">
            Track technician execution, on-site diagnostics, scheduled visits, and task completion progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTasks}
            className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Service Task
          </button>
        </div>
      </div>

      <ServiceTaskTable
        tasks={tasks}
        onOpenCreate={() => setShowCreateModal(true)}
        isLoading={isLoading}
      />

      <ServiceTaskFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        ticketId="srv-001"
        ticketRef="SRV-TKT-101"
        customerId="cust-002"
        customerName="Priya Sharma"
        customerPhone="+91 98450 67890"
        siteAddress="12th Main, 4th Block, Koramangala"
        siteCity="Bengaluru"
        productName="Solis 5kW 3-Phase On-grid Inverter"
        serialNumber="SOLIS-5K-2026-00118"
        priority="high"
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
