import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`bg-dark-900 border border-dark-700 rounded-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-fadeIn`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
          <button
            onClick={onClose}
            className="text-dark-500 hover:text-dark-300 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 p-5 border-t border-dark-700">{footer}</div>
        )}
      </div>
    </div>
  );
}
