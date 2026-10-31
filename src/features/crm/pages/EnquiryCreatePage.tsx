/**
 * src/features/crm/pages/EnquiryCreatePage.tsx
 * Page to register new solar enquiry with existing or new customer.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EnquiryForm } from '../components/EnquiryForm';
import { enquiryService } from '../services/enquiryService';
import type { EnquiryFormData } from '../types/enquiry.types';

export function EnquiryCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EnquiryFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await enquiryService.create(data);
      navigate(`/crm/enquiries/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create enquiry. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create Solar Enquiry</h1>
          <p className="text-sm text-slate-500">Capture solar capacity, roof details, and client requirements.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <EnquiryForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

