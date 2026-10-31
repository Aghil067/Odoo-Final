/**
 * src/features/crm/pages/CustomerEditPage.tsx
 * Edit existing customer information.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CustomerForm } from '../components/CustomerForm';
import { customerService } from '../services/customerService';
import type { Customer, CustomerFormData } from '../types/customer.types';

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await customerService.getById(id);
        setCustomer(data);
      } catch (err) {
        console.error('Failed to load customer for edit', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (data: CustomerFormData) => {
    if (!id) return;
    try {
      setIsSaving(true);
      setError(null);
      await customerService.update(id, data);
      navigate(`/crm/customers/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading customer information...</div>;
  }

  if (!customer) {
    return <div className="p-12 text-center text-sm text-slate-500">Customer not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Customer</h1>
          <p className="text-sm text-slate-500">
            Updating profile for {customer.fullName} ({customer.customerId})
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <CustomerForm initialData={customer} onSubmit={handleSubmit} isLoading={isSaving} />
    </div>
  );
}

