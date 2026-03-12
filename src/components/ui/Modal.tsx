import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    xl: 'max-w-4xl',
  }[size];

  const isFullHeight = size === 'xl';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 ${isFullHeight ? 'pt-8 sm:pt-12' : 'pt-16 sm:pt-24'}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeClass} bg-white dark:bg-gray-900 border border-black/12 dark:border-gray-700 rounded-sm shadow-lg overflow-hidden ${isFullHeight ? 'h-[85vh] flex flex-col' : ''}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-gray-800 flex-shrink-0">
            <h2 className="text-base font-sans font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        <div className={isFullHeight ? 'flex-1 overflow-hidden flex flex-col' : 'overflow-y-auto max-h-[75vh]'}>
          {children}
        </div>
      </div>
    </div>
  );
}
