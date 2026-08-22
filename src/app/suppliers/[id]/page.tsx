import {
  SupplierDetailsScreen,
  SupplierDetailsScreenSkeleton,
} from '@/components/suppliers/supplier-details-screen';
import { calculateSupplierPastEvaluations } from '@/server/services/dashboard.service';
import {
  getSupplierById,
  getSupplierLatestSubmission,
} from '@/server/services/supplier.service';
import { getCompanyIdCookie } from '@/lib/cookies';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

type SupplierDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupplierDetailsPage({
  params,
}: SupplierDetailsPageProps) {
  const { id } = await params;
  const companyId = await getCompanyIdCookie();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  return (
    <Suspense fallback={<SupplierDetailsScreenSkeleton />}>
      <SupplierDetailsScreen
        supplierId={Number(id)}
        companyId={companyId}
        supplierDetailsPromise={getSupplierById(Number(id))}
        pastEvaluationsPromise={calculateSupplierPastEvaluations(Number(id))}
        latestSubmissionPromise={getSupplierLatestSubmission(Number(id))}
      />
    </Suspense>
  );
}
