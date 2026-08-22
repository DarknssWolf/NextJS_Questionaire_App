'use client';

import { type calculateCompanyScoreTrends } from '@/server/services/dashboard.service';
import { use } from 'react';
import { ScoreTrendsChart } from '../charts/score-trends-chart';
import { Skeleton } from '../ui/skeleton';

type ScoreTrendsProps = {
  scoreTrendsPromise: Promise<
    Awaited<ReturnType<typeof calculateCompanyScoreTrends>>
  >;
};

export const ScoreTrends = ({ scoreTrendsPromise }: ScoreTrendsProps) => {
  const data = use(scoreTrendsPromise);

  return (
    <ScoreTrendsChart
      cardTitle="Score trends"
      sections={data.sections}
      chartData={data.chartData}
    />
  );
};

export const ScoreTrendsLoading = () => {
  return <Skeleton className="h-[450px] w-full" />;
};
