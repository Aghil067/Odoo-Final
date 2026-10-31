/**
 * src/components/ui/Badge.tsx
 * Reusable coloured status badge. Used by Customer, Enquiry and FollowUp tables.
 */
interface BadgeProps {
  label: string;
  className?: string;
}
export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

