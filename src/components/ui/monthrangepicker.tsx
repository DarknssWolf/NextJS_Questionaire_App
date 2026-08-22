'use client';
import * as React from 'react';
import { Button, buttonVariants } from './button';
import { cn } from '@/lib/utils';

type Month = {
  number: number;
  name: string;
};

const MONTHS: Month[][] = [
  [
    { number: 0, name: 'Jan' },
    { number: 1, name: 'Feb' },
    { number: 2, name: 'Mar' },
    { number: 3, name: 'Apr' },
  ],
  [
    { number: 4, name: 'May' },
    { number: 5, name: 'Jun' },
    { number: 6, name: 'Jul' },
    { number: 7, name: 'Aug' },
  ],
  [
    { number: 8, name: 'Sep' },
    { number: 9, name: 'Oct' },
    { number: 10, name: 'Nov' },
    { number: 11, name: 'Dec' },
  ],
];

type QuickSelector = {
  label: string;
  startMonth: Date;
  endMonth: Date;
  variant?: ButtonVariant;
  onClick?: (selector: QuickSelector) => void;
};

const QUICK_SELECTORS: QuickSelector[] = [
  {
    label: 'Q1',
    startMonth: new Date(2024, 0),
    endMonth: new Date(2024, 2),
  },
  {
    label: 'Q2',
    startMonth: new Date(2024, 3),
    endMonth: new Date(2024, 5),
  },
  {
    label: 'Q3',
    startMonth: new Date(2024, 6),
    endMonth: new Date(2024, 8),
  },
  {
    label: 'Q4',
    startMonth: new Date(2024, 9),
    endMonth: new Date(2024, 11),
  },
];

type MonthRangeCalProps = {
  selectedMonthRange?: { start: Date; end: Date };
  onStartMonthSelect?: (date: Date) => void;
  onMonthRangeSelect?: ({ start, end }: { start: Date; end: Date }) => void;
  onYearForward?: () => void;
  onYearBackward?: () => void;
  callbacks?: {
    yearLabel?: (year: number) => string;
    monthLabel?: (month: Month) => string;
  };
  variant?: {
    calendar?: {
      main?: ButtonVariant;
      selected?: ButtonVariant;
    };
    chevrons?: ButtonVariant;
  };
  minDate?: Date;
  maxDate?: Date;
  quickSelectors?: QuickSelector[];
  showQuickSelectors?: boolean;
};

type ButtonVariant =
  | 'default'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive'
  | 'secondary'
  | null
  | undefined;

function MonthRangePicker({
  onMonthRangeSelect,
  onStartMonthSelect,
  callbacks,
  selectedMonthRange,
  onYearBackward,
  onYearForward,
  variant,
  minDate,
  maxDate,
  quickSelectors,
  showQuickSelectors,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthRangeCalProps) {
  return (
    <div className={cn('min-w-[400px] p-3', className)} {...props}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="w-full">
          <MonthRangeCal
            onMonthRangeSelect={onMonthRangeSelect}
            onStartMonthSelect={onStartMonthSelect}
            callbacks={callbacks}
            selectedMonthRange={selectedMonthRange}
            onYearBackward={onYearBackward}
            onYearForward={onYearForward}
            variant={variant}
            minDate={minDate}
            maxDate={maxDate}
            quickSelectors={quickSelectors}
            showQuickSelectors={showQuickSelectors}
          />
        </div>
      </div>
    </div>
  );
}

function MonthRangeCal({
  selectedMonthRange,
  onMonthRangeSelect,
  onStartMonthSelect,
  callbacks,
  variant,
  minDate,
  maxDate,
  quickSelectors,
  showQuickSelectors = true,
}: MonthRangeCalProps) {
  const actualQuickSelectors = quickSelectors ?? QUICK_SELECTORS;
  const [startMonth, setStartMonth] = React.useState<number>(
    selectedMonthRange?.start?.getMonth() ?? new Date().getMonth()
  );
  const [endMonth, setEndMonth] = React.useState<number>(
    selectedMonthRange?.end?.getMonth() ?? new Date().getMonth()
  );
  const [rangePending, setRangePending] = React.useState<boolean>(false);
  const [endLocked, setEndLocked] = React.useState<boolean>(true);

  if (minDate && maxDate && minDate > maxDate) minDate = maxDate;

  return (
    <div className="flex gap-4">
      <div className="min-w-[300px] space-y-4">
        <table className="w-full border-collapse space-y-1">
          <tbody>
            {MONTHS.map((monthRow, a) => {
              return (
                <tr key={'row-' + a} className="mt-2 flex w-full">
                  {monthRow.map((m) => {
                    return (
                      <td
                        key={m.number}
                        className={cn(
                          '[&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 relative h-10 w-1/4 p-0 text-center text-sm focus-within:relative focus-within:z-20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has([aria-selected].day-range-end)]:rounded-r-md',
                          m.number > startMonth &&
                            m.number < endMonth &&
                            (rangePending || endLocked)
                            ? 'bg-accent text-accent-foreground'
                            : '',
                          m.number == startMonth && (rangePending || endLocked)
                            ? 'bg-accent text-accent-foreground rounded-l-md'
                            : '',
                          m.number == endMonth &&
                            (rangePending || endLocked) &&
                            m.number >= startMonth
                            ? 'bg-accent text-accent-foreground rounded-r-md'
                            : ''
                        )}
                        onMouseEnter={() => {
                          if (rangePending && !endLocked) {
                            setEndMonth(m.number);
                          }
                        }}
                      >
                        <button
                          onClick={() => {
                            if (rangePending) {
                              if (m.number < startMonth) {
                                setRangePending(true);
                                setEndLocked(false);
                                setStartMonth(m.number);
                                setEndMonth(m.number);
                                if (onStartMonthSelect)
                                  onStartMonthSelect(new Date(2024, m.number));
                              } else {
                                setRangePending(false);
                                setEndLocked(true);
                                if (onMonthRangeSelect)
                                  onMonthRangeSelect({
                                    start: new Date(2024, startMonth),
                                    end: new Date(2024, m.number),
                                  });
                              }
                            } else {
                              setRangePending(true);
                              setEndLocked(false);
                              setStartMonth(m.number);
                              setEndMonth(m.number);
                              if (onStartMonthSelect)
                                onStartMonthSelect(new Date(2024, m.number));
                            }
                          }}
                          className={cn(
                            buttonVariants({
                              variant:
                                startMonth == m.number ||
                                (endMonth == m.number && !rangePending)
                                  ? (variant?.calendar?.selected ?? 'default')
                                  : (variant?.calendar?.main ?? 'ghost'),
                            }),
                            'h-full w-full p-0 font-normal aria-selected:opacity-100'
                          )}
                        >
                          {callbacks?.monthLabel
                            ? callbacks.monthLabel(m)
                            : m.name}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showQuickSelectors ? (
        <div className="flex flex-col justify-center gap-1">
          {actualQuickSelectors.map((s) => {
            return (
              <Button
                onClick={() => {
                  setStartMonth(s.startMonth.getMonth());
                  setEndMonth(s.endMonth.getMonth());
                  setRangePending(false);
                  setEndLocked(true);
                  if (onMonthRangeSelect)
                    onMonthRangeSelect({
                      start: s.startMonth,
                      end: s.endMonth,
                    });
                  if (s.onClick) s.onClick(s);
                }}
                key={s.label}
                variant={s.variant ?? 'outline'}
              >
                {s.label}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

MonthRangePicker.displayName = 'MonthRangePicker';

export { MonthRangePicker };
