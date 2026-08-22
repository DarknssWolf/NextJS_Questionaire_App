'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { calculateDueDateFrom } from '@/lib/date';

interface DueDateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dueDate: Date) => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  existingDueDate?: Date | null;
  suppliersWithExistingDueDatesCount?: number;
}

type DueDateOption = {
  months: number;
  label: string;
  disabled: boolean;
  tooltipMessage?: string;
};

export function DueDateSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Send Email',
  cancelText = 'Cancel',
  existingDueDate,
  suppliersWithExistingDueDatesCount = 0,
}: DueDateSelectionModalProps) {
  const [selectedMonths, setSelectedMonths] = useState<number>(1);

  const hasExistingDueDate =
    !!existingDueDate && !isNaN(existingDueDate.getTime());
  const hasSomeSuppliersWithDueDates = suppliersWithExistingDueDatesCount > 0;

  const dueDateOptions = useMemo<DueDateOption[]>(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const endOfYear = new Date(currentYear, 11, 31);

    const options: DueDateOption[] = [
      {
        months: 1,
        label: '1 Month',
        disabled: false,
      },
      {
        months: 3,
        label: '3 Months',
        disabled: false,
      },
      {
        months: 6,
        label: '6 Months',
        disabled: false,
      },
    ];

    return options.map((option) => {
      const potentialDueDate = calculateDueDateFrom(today, option.months);

      if (potentialDueDate > endOfYear) {
        return {
          ...option,
          disabled: false,
          tooltipMessage: 'Due date exceeds the end of the year',
        };
      }

      return option;
    });
  }, []);

  const calculatedDueDate = useMemo(() => {
    const today = new Date();
    return calculateDueDateFrom(today, selectedMonths);
  }, [selectedMonths]);

  const handleConfirm = () => {
    onConfirm(hasExistingDueDate ? existingDueDate : calculatedDueDate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in bg-card w-full max-w-md rounded-xl p-6 shadow-lg duration-200">
        <h3 className="text-brand-navy mb-3 text-xl font-semibold">{title}</h3>
        <div className="mb-6 text-zinc-700">{children}</div>

        {hasExistingDueDate ? (
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Existing Due Date
              </div>
            </label>
            <div className="border-brand-200 bg-brand-50 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-accent-info h-5 w-5" />
                <div>
                  <p className="text-foreground text-xs font-medium">
                    Due Date:
                  </p>
                  <p className="text-foreground text-base font-semibold">
                    {format(existingDueDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              An invitation has already been sent with this due date. Click
              &quot;Resend Email&quot; to send another reminder.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select Due Date
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {dueDateOptions.map((option) => (
                <TooltipProvider key={option.months}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          !option.disabled && setSelectedMonths(option.months)
                        }
                        disabled={option.disabled}
                        className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                          selectedMonths === option.months && !option.disabled
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : option.disabled
                              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : 'hover:border-brand-500/50 border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    </TooltipTrigger>
                    {option.disabled && option.tooltipMessage && (
                      <TooltipContent className="border-accent-warning bg-risk-yellow/20 z-50 max-w-xs rounded-lg border px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="text-accent-warning h-4 w-4 flex-shrink-0" />
                          <p className="text-foreground text-sm font-medium">
                            {option.tooltipMessage}
                          </p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            <div className="border-brand-200 bg-brand-50 mt-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-accent-info h-5 w-5" />
                <div className="flex-1">
                  <p className="text-foreground text-xs font-medium">
                    Due Date:
                  </p>
                  <p className="text-foreground text-base font-semibold">
                    {format(calculatedDueDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {hasSomeSuppliersWithDueDates && (
              <p className="mt-2 text-xs text-gray-500">
                {suppliersWithExistingDueDatesCount === 1
                  ? '1 supplier already has an existing due date and will keep it.'
                  : `${suppliersWithExistingDueDatesCount} suppliers already have an existing due date and will keep their existing due dates.`}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-brand-500 text-brand-500 hover:bg-brand-500/10 rounded-full border-2 px-6 py-2 transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-brand-500 hover:bg-brand-600 rounded-full px-6 py-2 text-white transition-colors"
          >
            {hasExistingDueDate ? 'Resend Email' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
