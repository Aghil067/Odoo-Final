/**
 * src/components/ui/Input.tsx – Reusable form input with error state.
 */
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  required?: boolean;
}

export function Input({ label, error, hint, leftIcon, required, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
        required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`
            w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-800
            placeholder-slate-400 transition-colors
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            disabled:bg-slate-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-9' : ''}
            ${error ? 'border-red-400' : 'border-slate-300'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

