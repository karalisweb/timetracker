import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-lg hover:shadow-xl',
  secondary:
    'bg-dark-700 border border-dark-600 text-dark-50 hover:bg-dark-600 hover:border-dark-500',
  danger:
    'bg-red-500/10 text-red-400 hover:bg-red-500/20',
  link:
    'text-brand-orange hover:text-brand-orange-dark bg-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3 text-xs rounded-md',
  md: 'py-2.5 px-5 text-sm rounded-lg',
  lg: 'py-3 px-6 text-base rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${variant === 'primary' ? 'rounded-full' : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
