'use client';

import { CheckSquare } from 'lucide-react';
import { use } from 'react';
import { CardComponent, TitleWeight } from '../card-component';
import { Skeleton } from '../ui/skeleton';

type CompletedEvaluationCountProps = {
  completedEvaluationsCountPromise: Promise<number>;
};

export const CompletedEvaluationCount = ({
  completedEvaluationsCountPromise,
}: CompletedEvaluationCountProps) => {
  const count = use(completedEvaluationsCountPromise);

  return (
    <CardComponent
      title="Evaluations completed this term"
      titleWeight={TitleWeight.Normal}
      icon={<CheckSquare className="text-muted-foreground h-5 w-5" />}
      content={count}
    />
  );
};

export const CompletedEvaluationCountLoading = () => {
  return <Skeleton className="h-1/2 w-full" />;
};
