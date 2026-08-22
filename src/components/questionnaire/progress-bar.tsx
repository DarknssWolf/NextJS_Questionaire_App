interface ProgressBarProps {
  percentage: number;
  completed: number;
  total: number;
}

export default function ProgressBar({
  percentage,
  completed,
  total,
}: ProgressBarProps) {
  return (
    <div className="sticky bottom-0 w-full border-t border-gray-200 bg-white py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="bg-brand-500 h-full rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 text-center text-sm font-medium text-gray-600">
          <span className="font-bold">{percentage}% Complete</span> ({completed}{' '}
          of {total} items completed)
        </div>
      </div>
    </div>
  );
}
