'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'confirm',
  cancelText = 'cancel',
  isDestructive = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-lg duration-200">
        <h3 className="text-brand-navy mb-3 text-xl font-semibold">{title}</h3>
        <div className="mb-6 text-zinc-700">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border-brand-500 text-brand-500 hover:bg-brand-500/10 rounded-full border-2 px-6 py-2 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-full px-6 py-2 text-white transition-colors',
              isDestructive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-brand-500 hover:bg-brand-600'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
