import Link from 'next/link';
import { Button } from '../ui/button';

type ViewEvaluationReportButtonProps = {
  disabled?: boolean;
  supplierId: number;
  submissionId: number;
  className?: string;
};

export const ViewEvaluationReportButton = ({
  disabled,
  supplierId,
  submissionId,
  className,
}: ViewEvaluationReportButtonProps) => {
  return (
    <Button
      variant="brand"
      asChild={!disabled}
      disabled={disabled}
      className={className}
    >
      {disabled ? (
        <span>view latest evaluation report</span>
      ) : (
        <Link
          href={`/suppliers/${supplierId}/evaluation-report/${submissionId}`}
        >
          view latest evaluation report
        </Link>
      )}
    </Button>
  );
};
