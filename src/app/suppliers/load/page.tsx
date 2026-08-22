'use server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SuppliersCreate from '@/components/suppliers/suppliers-create';
import { SupplierContextProvider } from '@/providers/suppliers/SupplierContextProvider';
import { getCompanyIdCookie } from '@/lib/cookies';
import { notFound } from 'next/navigation';

export default async function LoadSuppliersPage() {
  const companyId = await getCompanyIdCookie();

  if (!companyId) {
    notFound();
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Link
            className="flex items-center gap-1 hover:underline"
            href="/suppliers"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Suppliers</span>
          </Link>
          <span>/</span>
          <span>Load Suppliers</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-base-700 text-3xl font-semibold">
            Load Suppliers
          </h1>
          <p className="text-base-700">
            Add suppliers individually or upload multiple suppliers at once
          </p>
        </div>

        <SupplierContextProvider companyId={companyId}>
          <SuppliersCreate />
        </SupplierContextProvider>
      </div>
    </div>
  );
}
