'use client';

import { use } from 'react';
import { AggregatedScoreChart } from '../charts/aggregated-score-chart';
import { type calculateCompanyAggregatedScoreDetails } from '@/server/services/dashboard.service';
import { Skeleton } from '../ui/skeleton';

type AggregatedEvaluationScoreProps = {
  aggregatedScoreDataPromise: Promise<
    Awaited<ReturnType<typeof calculateCompanyAggregatedScoreDetails>>
  >;
};

export const AggregatedEvaluationScore = ({
  aggregatedScoreDataPromise,
}: AggregatedEvaluationScoreProps) => {
  const data = use(aggregatedScoreDataPromise);

  if (!data) {
    return <div>Your Current Aggregated Score not found</div>;
  }

  return (
    <AggregatedScoreChart
      title="Your Current Aggregated Score"
      score={data.aggregatedScoreDetails.score}
      changePercentage={data.aggregatedScoreDetails.changePercentage}
      riskLevel={data.aggregatedScoreDetails.riskLevel}
      supplierCompliance={data.supplierCompliance}
    />
  );
};

export const AggregatedEvaluationScoreLoading = () => {
  return <Skeleton className="h-full w-full" />;
};
