import { cn } from '@/lib/utils';
import React from 'react';

type ReportCardProps = {
  title: string;
  subtitle?: string;
  corner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const ReportCard = ({
  corner,
  children,
  title,
  subtitle,
  className,
}: ReportCardProps) => {
  return (
    <div
      className={cn(
        'border-base-200 flex flex-col gap-y-6 rounded-[30px] border px-6 py-8',
        className
      )}
    >
      <div className="flex justify-between">
        <div className="flex flex-col gap-y-2">
          <span className="text-body-l text-base-800 font-semibold">
            {title}
          </span>
          {subtitle && (
            <span className="text-body-m font-light">{subtitle}</span>
          )}
        </div>
        {corner}
      </div>
      {children}
    </div>
  );
};
