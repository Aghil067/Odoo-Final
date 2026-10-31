/**
 * InstallationPhotoUpload.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable photo upload and inspection gallery component.
 * Supports categorisation across 9 standard solar installation categories,
 * local image previews, captions, and deletion.
 */

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Maximize2,
  X,
  Filter,
} from 'lucide-react';
import type {
  InstallationPhoto,
  PhotoCategory,
} from '../types/execution.types';
import { PHOTO_CATEGORY_LABELS } from '../types/execution.types';
import { Button } from '../../../components/ui/Button';

interface InstallationPhotoUploadProps {
  photos: InstallationPhoto[];
  onAddPhoto: (photo: Omit<InstallationPhoto, 'id' | 'uploadedAt'>) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  currentUserName?: string;
  readOnly?: boolean;
}

export function InstallationPhotoUpload({
  photos,
  onAddPhoto,
  onDeletePhoto,
  currentUserName = 'Field Technician',
  readOnly = false,
}: InstallationPhotoUploadProps) {
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<InstallationPhoto | null>(null);

  // New photo form state
  const [category, setCategory] = useState<PhotoCategory>('before_installation');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPhotos =
    selectedCategory === 'all'
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image file must be less than 8MB');
      return;
    }

    setUploadError('');
    // Create local object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('Please select or upload an image');
      return;
    }

    try {
      setIsUploading(true);
      await onAddPhoto({
        category,
        url: imageUrl,
        caption: caption.trim() || undefined,
        uploadedBy: currentUserName,
        fileSize: '1.8 MB',
      });

      setShowUploadModal(false);
      setImageUrl('');
      setCaption('');
      setCategory('before_installation');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Installation Photographs & Field Verification
            </h3>
            <p className="text-xs text-slate-500">
              Categorized visual evidence for technical review and client handover
            </p>
          </div>
        </div>

        {!readOnly && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload Photos
          </Button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white font-medium'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({photos.length})
        </button>
        {(Object.keys(PHOTO_CATEGORY_LABELS) as PhotoCategory[]).map((catKey) => {
          const count = photos.filter((p) => p.category === catKey).length;
          if (count === 0 && selectedCategory !== catKey) return null; // Show only categories with items or active
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === catKey
                  ? 'bg-green-700 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {PHOTO_CATEGORY_LABELS[catKey]} ({count})
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-400 text-xs">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium text-slate-600">No installation photos uploaded yet</p>
          <p className="mt-0.5">Technicians can capture images during on-site execution.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-xs flex flex-col"
            >
              <div className="aspect-4/3 overflow-hidden relative bg-slate-200">
                <img
                  src={photo.url}
                  alt={photo.caption || photo.category}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-full text-slate-800 shadow"
                    title="Enlarge preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {!readOnly && onDeletePhoto && (
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(photo.id)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 rounded-full text-white shadow"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption and Meta */}
              <div className="p-2.5 bg-white flex-1 flex flex-col justify-between text-xs">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] uppercase tracking-wider mb-1">
                    {PHOTO_CATEGORY_LABELS[photo.category]}
                  </span>
                  <p className="font-medium text-slate-800 line-clamp-2">
                    {photo.caption || 'No caption provided'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                  <span>{photo.uploadedBy}</span>
                  <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Upload Installation Photo
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Photo Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PhotoCategory)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-green-500"
                >
                  {(Object.keys(PHOTO_CATEGORY_LABELS) as PhotoCategory[]).map((catKey) => (
                    <option key={catKey} value={catKey}>
                      {PHOTO_CATEGORY_LABELS[catKey]}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload or Camera tap */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Photo File or Take Photo *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-green-500 rounded-lg p-5 text-center cursor-pointer transition-colors bg-slate-50"
                >
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse or take photo from device
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports JPG, PNG up to 8MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="relative aspect-16/9 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={imageUrl}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Or quick preset sample photo for demo convenience */}
              {!imageUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">Or use demo photo:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl(
                        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="text-[11px] text-green-700 hover:underline font-semibold"
                  >
                    Load Sample Solar Rooftop Image
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Observation Caption / Details (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Structure torque verified, DC conduit neat routing..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={isUploading}
                  isLoading={isUploading}
                >
                  Confirm Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-16/10 bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption || 'Enlarged photo'}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-white text-xs space-y-1">
              <div className="font-semibold text-sm">
                {PHOTO_CATEGORY_LABELS[previewPhoto.category]}
              </div>
              <p className="text-slate-300">
                {previewPhoto.caption || 'No caption recorded.'}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Captured by {previewPhoto.uploadedBy} on{' '}
                {new Date(previewPhoto.uploadedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

