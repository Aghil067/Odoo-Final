/**
 * SubsidiesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Solar Subsidy Tracking page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { SubsidyApplication, SubsidyFormData, SubsidyStatus } from '../types/subsidy.types';
import { subsidyService } from '../services/subsidyService';
import { SubsidyTable } from '../components/SubsidyTable';
import { SubsidyFormModal } from '../components/SubsidyFormModal';

export const SubsidiesPage: React.FC = () => {
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadSubsidies = async () => {
    try {
      setIsLoading(true);
      const res = await subsidyService.list();
      setSubsidies(res.data);
    } catch (err) {
      console.error('Failed to load subsidy applications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubsidies();
  }, []);

  const handleCreate = async (formData: SubsidyFormData) => {
    await subsidyService.create(formData);
    await loadSubsidies();
  };

  const handleUpdateStatus = async (
    id: string,
    status: SubsidyStatus,
    approvedAmount?: number,
    remarks?: string
  ) => {
    await subsidyService.updateStatus(id, status, approvedAmount, remarks);
    await loadSubsidies();
  };

  const handleUploadDoc = async (subsidyId: string, docId: string, fileName: string) => {
    await subsidyService.uploadDocument(subsidyId, docId, fileName);
    await loadSubsidies();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Solar Subsidy Tracking</h1>
        <p className="text-xs text-slate-500">
          Track customer Central Financial Assistance (CFA) paperwork under PM Surya Ghar Muft Bijli Yojana & State DISCOM portals.
        </p>
      </div>

      <SubsidyTable
        subsidies={subsidies}
        isLoading={isLoading}
        onOpenCreate={() => setShowCreateModal(true)}
        onUpdateStatus={handleUpdateStatus}
        onUploadDoc={handleUploadDoc}
      />

      <SubsidyFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

