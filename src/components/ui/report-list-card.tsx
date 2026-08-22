import { cn } from '@/lib/utils';

type ReportListCardProps = {
  title: string;
  items: string[];
  icon: React.ReactNode;
  className?: string;
  emptyMessage?: string;
};

export const ReportListCard = ({
  icon,
  items,
  title,
  className,
  emptyMessage = 'No items found',
}: ReportListCardProps) => {
  return (
    <div
      className={cn(
        'bg-base-100 flex flex-col gap-y-3 rounded-lg p-7',
        className
      )}
    >
      <span className="text-body-l text-base-800 font-semibold">{title}</span>
      {items.map((item, index) => (
        <div
          className="flex gap-x-2 [&_svg]:translate-y-0.5"
          key={`${item}-${index}`}
        >
          {icon}
          <span className="text-body-m font-light">
            {cleanReportListItem(item)}
          </span>
        </div>
      ))}

      {items.length === 0 && (
        <span className="text-body-m font-light">{emptyMessage}</span>
      )}
    </div>
  );
};

function cleanReportListItem(item: string) {
  return item.replace(/[\[\]""''`]/g, '').replace(/,/g, ', ');
}
