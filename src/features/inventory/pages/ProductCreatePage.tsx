/**
 * ProductCreatePage.tsx
 * ─────────────────────────────────────────────────────────────
 * Page wrapper for authoring a new hardware product in M04.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ProductForm } from '../components/ProductForm';
import { productService } from '../services/productService';
import type { ProductFormData } from '../types/product.types';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const created = await productService.create(formData);
      navigate(`/inventory/products/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create product', err);
      setError(err?.message || 'Failed to save product. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Solar Hardware Product</h1>
          <p className="text-sm text-slate-500">
            Register solar panels, inverters, batteries, or accessories in the inventory system.
          </p>
        </div>
        <Link to="/inventory/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Products
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory/products')}
        isLoading={isSubmitting}
      />
    </div>
  );
}

