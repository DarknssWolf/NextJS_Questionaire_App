'use client';

import { type getTopHighRiskSpendCategories } from '@/server/services/dashboard.service';
import { use } from 'react';
import { HighRiskSupplierChart } from '../charts/high-risk-supplier-chart';
import { Skeleton } from '../ui/skeleton';

type HighRiskSuppliersProps = {
  highRiskDataPromise: Promise<
    Awaited<ReturnType<typeof getTopHighRiskSpendCategories>>
  >;
};

export const HighRiskSuppliers = ({
  highRiskDataPromise,
}: HighRiskSuppliersProps) => {
  const data = use(highRiskDataPromise);

  return <HighRiskSupplierChart data={data.chartData} />;
};

export const HighRiskSuppliersLoading = () => {
  return <Skeleton className="h-[342px] w-full" />;
};
