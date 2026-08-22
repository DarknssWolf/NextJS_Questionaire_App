'use client';

import { type calculateCompanySectionCompliance } from '@/server/services/dashboard.service';
import { use } from 'react';
import { PillarsScoreChart } from '../charts/pillars-score-chart';
import { Skeleton } from '../ui/skeleton';

type SectionComplianceProps = {
  sectionCompliancePromise: Promise<
    Awaited<ReturnType<typeof calculateCompanySectionCompliance>>
  >;
};

export const PillarsScore = ({
  sectionCompliancePromise,
}: SectionComplianceProps) => {
  const data = use(sectionCompliancePromise);

  return <PillarsScoreChart chartData={data.chartData} />;
};

export const PillarsScoreLoading = () => {
  return <Skeleton className="h-[342px] w-full" />;
};
