import { SubmissionResults } from '@/components/suppliers/submission-results';
import { Button } from '@/components/ui/button';
import { getSubmissionResult } from '@/server/services/submission-results.service';
import {
  getRoleFromMetadata,
  getSupplierIdFromMetadata,
} from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string; submissionId: string }>;
};

export default async function SubmissionResultsPage({ params }: PageProps) {
  const { id, submissionId: submissionIdParam } = await params;
  const submissionId = Number(submissionIdParam);

  if (!Number.isInteger(submissionId)) notFound();

  const result = await getSubmissionResult(submissionId);
  if (!result) notFound();

  const role = await getRoleFromMetadata();
  if (role === 'supplier_admin' || role === 'supplier_additional_admin') {
    const supplierId = await getSupplierIdFromMetadata();
    if (result.supplierId !== supplierId) redirect('/');
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 py-8">
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href={`/suppliers/${id}`}>
          <ArrowLeft />
          Back to supplier
        </Link>
      </Button>

      <SubmissionResults result={result} />
    </div>
  );
}
