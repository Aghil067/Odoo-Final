/**
 * src/components/ui/Button.tsx
 * Reusable button component. Consistent variant system used across M01.
 */
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400',
  danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-400',
  outline:   'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export function Button({
  variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon,
  children, disabled, className = '', ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
      `}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

