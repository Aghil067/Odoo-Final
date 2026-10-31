/**
 * WarrantyRegisterPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for registering equipment warranties in M07.
 */

import React from 'react';
import type { WarrantyRegistrationFormData } from '../types/warranty.types';
import { warrantyService } from '../services/warrantyService';
import { WarrantyRegistrationForm } from '../components/WarrantyRegistrationForm';

export const WarrantyRegisterPage: React.FC = () => {
  const handleRegister = async (data: WarrantyRegistrationFormData) => {
    await warrantyService.register(data);
  };

  return (
    <div className="space-y-6">
      <WarrantyRegistrationForm onSubmit={handleRegister} />
    </div>
  );
};

