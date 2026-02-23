import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  className?: string;
}

export default function Card({
  children,
  title,
  badge,
  footer,
  hoverable = false,
  className = '',
}: CardProps) {
  return (
    <div
      className={`
        bg-dark-900 border border-dark-700 rounded-xl
        ${hoverable ? 'hover:border-dark-600 transition-colors' : ''}
        ${className}
      `.trim()}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          {title && <h3 className="text-lg font-semibold text-dark-50">{title}</h3>}
          {badge}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-700">
          {footer}
        </div>
      )}
    </div>
  );
}
