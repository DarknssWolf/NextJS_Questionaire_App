import {
  AggregatedEvaluationScore,
  AggregatedEvaluationScoreLoading,
} from '@/components/dashboard/aggregated-evaluation-score';
import {
  CompletedEvaluationCount,
  CompletedEvaluationCountLoading,
} from '@/components/dashboard/completed-evaluation-count';
import {
  HighRiskSuppliers,
  HighRiskSuppliersLoading,
} from '@/components/dashboard/high-risk-suppliers';
import {
  PendingEvaluationCount,
  PendingEvaluationCountLoading,
} from '@/components/dashboard/pending-evaluation-count';
import {
  PillarsScore,
  PillarsScoreLoading,
} from '@/components/dashboard/pillars-score';
import {
  ScoreTrends,
  ScoreTrendsLoading,
} from '@/components/dashboard/score-trends';
import {
  TotalSuppliersCount,
  TotalSuppliersCountLoading,
} from '@/components/dashboard/total-suppliers-count';
import {
  calculateCompanyAggregatedScoreDetails,
  calculateCompanyScoreTrends,
  calculateCompanySectionCompliance,
  getCompletedEvaluationsThisYear,
  getPendingEvaluations,
  getTopHighRiskSpendCategories,
  getTotalSuppliers,
} from '@/server/services/dashboard.service';
import { getCompanyIdCookie } from '@/lib/cookies';
import { Suspense } from 'react';

export default async function DashboardPage() {
  const companyId = await getCompanyIdCookie();

  if (!companyId) {
    throw new Error('Company ID not found');
  }

  return (
    <div className="container mx-auto space-y-8 p-4">
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <div className="flex h-full flex-col">
          <Suspense fallback={<TotalSuppliersCountLoading />}>
            <TotalSuppliersCount
              totalSuppliersCountPromise={getTotalSuppliers(companyId)}
            />
          </Suspense>
        </div>
        <div className="flex flex-col gap-4">
          <Suspense fallback={<CompletedEvaluationCountLoading />}>
            <CompletedEvaluationCount
              completedEvaluationsCountPromise={getCompletedEvaluationsThisYear(
                companyId
              )}
            />
          </Suspense>
          <Suspense fallback={<PendingEvaluationCountLoading />}>
            <PendingEvaluationCount
              pendingEvaluationsCountPromise={getPendingEvaluations(companyId)}
            />
          </Suspense>
        </div>
        <div className="md:row-span-2">
          <Suspense fallback={<AggregatedEvaluationScoreLoading />}>
            <AggregatedEvaluationScore
              aggregatedScoreDataPromise={calculateCompanyAggregatedScoreDetails(
                companyId
              )}
            />
          </Suspense>
        </div>
        <div className="md:col-span-2">
          <Suspense fallback={<ScoreTrendsLoading />}>
            <ScoreTrends
              scoreTrendsPromise={calculateCompanyScoreTrends(companyId)}
            />
          </Suspense>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Suspense fallback={<HighRiskSuppliersLoading />}>
          <HighRiskSuppliers
            highRiskDataPromise={getTopHighRiskSpendCategories(companyId)}
          />
        </Suspense>
        <Suspense fallback={<PillarsScoreLoading />}>
          <PillarsScore
            sectionCompliancePromise={calculateCompanySectionCompliance(
              companyId
            )}
          />
        </Suspense>
      </div>
    </div>
  );
}
