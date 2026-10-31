/**
 * TechnicianCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for registering a new technician or updating an existing profile.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, HardHat } from 'lucide-react';
import type { Technician, TechnicianFormData } from '../types/technician.types';
import type { TechnicianTeam } from '../types/team.types';
import { technicianService } from '../services/technicianService';
import { teamService } from '../services/teamService';
import { TechnicianForm } from '../components/TechnicianForm';

export function TechnicianCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Technician | undefined>(undefined);
  const [teams, setTeams] = useState<TechnicianTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isEditMode = Boolean(id);

  useEffect(() => {
    async function loadPrerequisites() {
      try {
        setIsLoading(true);
        const teamsData = await teamService.list();
        setTeams(teamsData);

        if (id) {
          const tech = await technicianService.getById(id);
          if (tech) setInitialData(tech);
        }
      } catch (err) {
        console.error('Failed to load technician form prerequisites', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPrerequisites();
  }, [id]);

  const handleSubmit = async (formData: TechnicianFormData) => {
    if (isEditMode && id) {
      await technicianService.update(id, formData);
      navigate(`/technicians/${id}`);
    } else {
      const created = await technicianService.create(formData);
      navigate(`/technicians/${created.id}`);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div>
        <Link
          to="/technicians"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Technicians</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HardHat className="w-5 h-5 text-green-600" />
          <span>{isEditMode ? 'Edit Technician Profile' : 'Register New Technician'}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isEditMode
            ? 'Update contact information, skills, qualifications, or team allocation'
            : 'Enter technician personal details, solar skills, employment status, and emergency contacts'}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading form details...
        </div>
      ) : (
        <TechnicianForm
          initialData={initialData}
          teams={teams}
          onSubmit={handleSubmit}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
}
