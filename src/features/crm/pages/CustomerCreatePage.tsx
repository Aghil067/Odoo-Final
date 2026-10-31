/**
 * src/features/crm/pages/CustomerCreatePage.tsx
 * Customer onboarding page for Admin and Sales Executives.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CustomerForm } from '../components/CustomerForm';
import { customerService } from '../services/customerService';
import type { CustomerFormData } from '../types/customer.types';

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await customerService.create(data);
      navigate(`/crm/customers/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create customer. Please check the form.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Register New Customer</h1>
          <p className="text-sm text-slate-500">Add client contact, address, and source details.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

