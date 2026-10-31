/**
 * PhotoUpload.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable photo upload component for physical roof and electrical inspection photos.
 * Provides image preview, categorization, description, file validation, and deletion.
 */

import { useState, type ChangeEvent } from 'react';
import { Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import type { SurveyPhoto, PhotoCategory } from '../types/survey.types';
import { PHOTO_CATEGORY_LABELS } from '../types/survey.types';

interface PhotoUploadProps {
  photos: SurveyPhoto[];
  onChange: (photos: SurveyPhoto[]) => void;
  disabled?: boolean;
}

export function PhotoUpload({ photos, onChange, disabled }: PhotoUploadProps) {
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('full_roof_view');
  const [description, setDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File validation: check type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto: SurveyPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        category: selectedCategory,
        url: reader.result as string,
        fileName: file.name,
        fileSizeBytes: file.size,
        description: description.trim() || undefined,
        uploadedAt: new Date().toISOString(),
      };

      onChange([...photos, newPhoto]);
      setDescription('');
      // Reset file input
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const categoryOptions = Object.entries(PHOTO_CATEGORY_LABELS).map(([k, v]) => ({
    value: k,
    label: v,
  }));

  return (
    <div className="space-y-4">
      {/* Upload Control Box */}
      {!disabled && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Camera className="w-4 h-4 text-green-600" />
            <span>Add Site Photo</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Photo Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PhotoCategory)}
            />

            <div className="md:col-span-2">
              <Input
                label="Caption / Observation"
                placeholder="e.g. Parapet edge or cable conduit route"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {uploadError && (
            <p className="text-xs text-red-600 font-medium" role="alert">
              {uploadError}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
              />
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <ImageIcon className="w-4 h-4" />
                Select Photo from Device
              </span>
            </label>
            <span className="text-[11px] text-slate-400">Max size 5MB per photo</span>
          </div>
        </div>
      )}

      {/* Uploaded Photos Grid */}
      {photos.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
          No site photographs uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden group shadow-sm flex flex-col"
            >
              <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <img src={p.url} alt={p.description || p.category} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                  {PHOTO_CATEGORY_LABELS[p.category]}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(p.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded hover:bg-red-700 transition-colors shadow"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between text-xs">
                <p className="font-medium text-slate-700 truncate">{p.description || p.fileName}</p>
                <span className="text-[10px] text-slate-400 mt-1">
                  {(p.fileSizeBytes / 1024).toFixed(0)} KB • {new Date(p.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
