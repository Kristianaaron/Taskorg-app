import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — solid, no blur */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      {/* Panel — square, hard border, offset shadow */}
      <div
        className={`relative w-full ${sizeClass} bg-white dark:bg-gray-900 border-2 border-black dark:border-white brutal-shadow-md overflow-hidden`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-white">
            <h2 className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
        <div className="overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
