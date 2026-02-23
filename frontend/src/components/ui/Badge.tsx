type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'admin'
  | 'pm'
  | 'senior'
  | 'executor'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  error: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
  admin: 'bg-red-500/15 text-red-400',
  pm: 'bg-blue-500/15 text-blue-400',
  senior: 'bg-purple-500/15 text-purple-400',
  executor: 'bg-green-500/15 text-green-400',
  neutral: 'bg-dark-700 text-dark-400',
};

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
