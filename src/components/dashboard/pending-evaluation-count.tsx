'use client';

import { use } from 'react';
import { CardComponent, TitleWeight } from '../card-component';
import { SquareMinus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type PendingEvaluationCountProps = {
  pendingEvaluationsCountPromise: Promise<number>;
};

export const PendingEvaluationCount = ({
  pendingEvaluationsCountPromise,
}: PendingEvaluationCountProps) => {
  const count = use(pendingEvaluationsCountPromise);

  return (
    <CardComponent
      title="Pending Evaluations"
      titleWeight={TitleWeight.Normal}
      icon={<SquareMinus className="text-muted-foreground h-5 w-5" />}
      content={count}
    />
  );
};

export const PendingEvaluationCountLoading = () => {
  return <Skeleton className="h-1/2 w-full" />;
};
