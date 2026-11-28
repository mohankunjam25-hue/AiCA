import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightClass?: string;
}

/**
 * Reusable Native-Style Bottom Sheet Modal for mobile interactions
 * (Filters, Execution Console, Problem Quick Preview).
 */
export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightClass = 'max-h-[82vh]',
}: MobileBottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxHeightClass} bg-white dark:bg-[#161b22] rounded-t-3xl border-t border-[#d0d7de] dark:border-[#30363d] shadow-2xl flex flex-col overflow-hidden safe-area-bottom animate-in slide-in-from-bottom duration-200`}
      >
        {/* Drag Handle Pill */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-[#d0d7de] dark:bg-[#30363d]" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-2.5 border-b border-[#d0d7de]/70 dark:border-[#30363d] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[#656d76] dark:text-[#848d97] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="p-2 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] active:scale-95 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {children}
        </div>

        {/* Optional Sticky Footer CTA */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#d0d7de]/70 dark:border-[#30363d] bg-[#f6f8fa]/80 dark:bg-[#0d1117]/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
