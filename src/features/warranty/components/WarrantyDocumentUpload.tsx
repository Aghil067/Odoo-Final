/**
 * WarrantyDocumentUpload.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable document & photograph upload component for warranties & claims.
 */

import React, { useState } from 'react';
import { Upload, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import type { WarrantyDocument, WarrantyDocumentType } from '../types/warranty.types';

interface WarrantyDocumentUploadProps {
  documents: WarrantyDocument[];
  onChange: (docs: WarrantyDocument[]) => void;
  allowedTypes?: WarrantyDocumentType[];
  title?: string;
  description?: string;
  maxFiles?: number;
}

export const WarrantyDocumentUpload: React.FC<WarrantyDocumentUploadProps> = ({
  documents,
  onChange,
  title = 'Supporting Proof & Documents',
  description = 'Upload PDF documents, commissioning handover sheets, delivery slips, or fault photos (Max 10MB)',
}) => {
  const [docType, setDocType] = useState<WarrantyDocumentType>('installation_proof');
  const [docName, setDocName] = useState('');
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  const handleSimulatedAdd = () => {
    if (!docName.trim()) return;

    setIsSimulatingUpload(true);
    setTimeout(() => {
      const newDoc: WarrantyDocument = {
        id: `doc-${Date.now()}`,
        documentType: docType,
        name: docName.trim().endsWith('.pdf') ? docName.trim() : `${docName.trim()}.pdf`,
        fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
      };
      onChange([...documents, newDoc]);
      setDocName('');
      setIsSimulatingUpload(false);
    }, 400);
  };

  const handleRemove = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {/* Upload Input Area */}
      <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as WarrantyDocumentType)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="installation_proof">Installation Completion Handover</option>
              <option value="purchase_proof">Invoice / Purchase Proof</option>
              <option value="delivery_proof">Delivery Challan Slip</option>
              <option value="other">Other Inspection / Serial Photo</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">File Name or Reference</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Commissioning_Certificate_Final.pdf"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSimulatedAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSimulatedAdd}
                disabled={!docName.trim() || isSimulatingUpload}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {isSimulatingUpload ? 'Attaching...' : 'Attach Proof'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 ? (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 text-xs bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    <span className="capitalize">{doc.documentType.replace('_', ' ')}</span> • {doc.fileSize || '1.2 MB'} • Uploaded on {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-3 text-xs text-slate-400 italic">
          No supporting proof documents attached yet. Attach delivery or installation proof for faster activation.
        </p>
      )}
    </div>
  );
};

