/**
 * ServiceTaskDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Individual Service Task Execution Page in Module M08.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wrench, ArrowLeft } from 'lucide-react';
import type {
  ServiceTask,
  ServiceTaskStatus,
  ServiceInspectionRecord,
  ServiceRepairRecord,
  SparePartRequirement,
  ServicePhoto,
  ServiceCustomerConfirmation,
} from '../types/serviceTask.types';
import { serviceTaskService } from '../services/serviceTaskService';
import { ServiceTaskDetails } from '../components/ServiceTaskDetails';
import { useAuth } from '../../auth/hooks/useAuth';

export const ServiceTaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [task, setTask] = useState<ServiceTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTask = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const t = await serviceTaskService.getById(id);
      setTask(t);
    } catch (err) {
      console.error('Failed to load task', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const handleUpdateStatus = async (status: ServiceTaskStatus, progress?: number) => {
    if (!id) return;
    await serviceTaskService.updateStatus(id, status, progress);
    await loadTask();
  };

  const handleSaveInspection = async (inspection: ServiceInspectionRecord) => {
    if (!id) return;
    await serviceTaskService.recordInspection(id, inspection);
    await loadTask();
  };

  const handleSaveRepair = async (repair: ServiceRepairRecord) => {
    if (!id) return;
    await serviceTaskService.recordRepair(id, repair);
    await loadTask();
  };

  const handleRequestPart = async (part: SparePartRequirement) => {
    if (!id) return;
    await serviceTaskService.requestParts(id, part);
    await loadTask();
  };

  const handleAddPhoto = async (photo: ServicePhoto) => {
    if (!id) return;
    await serviceTaskService.addPhoto(id, photo);
    await loadTask();
  };

  const handleSaveConfirmation = async (confirmation: ServiceCustomerConfirmation) => {
    if (!id) return;
    await serviceTaskService.recordCustomerConfirmation(id, confirmation);
    await loadTask();
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading service task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20 space-y-3">
        <Wrench className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="text-base font-bold text-slate-800">Task Not Found</h2>
        <p className="text-xs text-slate-500">The requested service task does not exist or has been removed.</p>
        <Link
          to="/service/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ServiceTaskDetails
        task={task}
        onUpdateStatus={handleUpdateStatus}
        onSaveInspection={handleSaveInspection}
        onSaveRepair={handleSaveRepair}
        onRequestPart={handleRequestPart}
        onAddPhoto={handleAddPhoto}
        onSaveConfirmation={handleSaveConfirmation}
        userRole={user?.role || 'technician'}
      />
    </div>
  );
};

