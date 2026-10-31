/**
 * src/components/ui/Textarea.tsx
 */
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Textarea({ label, error, required, id, className = '', ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-800
          placeholder-slate-400 resize-y transition-colors
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${error ? 'border-red-400' : 'border-slate-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

