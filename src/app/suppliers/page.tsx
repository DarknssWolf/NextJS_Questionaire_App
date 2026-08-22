import {
  SupplierListScreen,
  SupplierListScreenLoading,
} from '@/components/suppliers/supplier-list-screen';
import { getSuppliers } from '@/server/services/supplier.service';
import { getCompanyIdCookie } from '@/lib/cookies';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const companyId = await getCompanyIdCookie();

  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const suppliersPromise = getSuppliers(companyId);

  return (
    <Suspense fallback={<SupplierListScreenLoading />}>
      <SupplierListScreen
        suppliersPromise={suppliersPromise}
        companyId={companyId}
      />
    </Suspense>
  );
}
