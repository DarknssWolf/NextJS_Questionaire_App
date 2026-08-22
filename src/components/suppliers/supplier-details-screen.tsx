'use client';

import { AggregatedScoreChart } from '@/components/charts/aggregated-score-chart';
import { ScoreTrendsChart } from '@/components/charts/score-trends-chart';
import { DueDateSelectionModal } from '@/components/suppliers/due-date-selection-modal';
import SuppliersOverview from '@/components/suppliers/suppliers-overview';
import SuppliersPastEvaluations from '@/components/suppliers/suppliers-past-evaluations';
import { ViewEvaluationReportButton } from '@/components/suppliers/view-evaluation-report-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerifiedIcon } from '@/components/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { sendSupplierInvitations } from '@/server/services/email.service';
import { type calculateSupplierPastEvaluations } from '@/server/services/dashboard.service';
import {
  type getSupplierById,
  type getSupplierLatestSubmission,
} from '@/server/services/supplier.service';
import { useSession } from '@/providers/session-provider';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

type SupplierDetailsScreenProps = {
  supplierId: number;
  companyId: number;
  supplierDetailsPromise: Promise<Awaited<ReturnType<typeof getSupplierById>>>;
  pastEvaluationsPromise: Promise<
    Awaited<ReturnType<typeof calculateSupplierPastEvaluations>>
  >;
  latestSubmissionPromise: Promise<
    Awaited<ReturnType<typeof getSupplierLatestSubmission>>
  >;
};

export function SupplierDetailsScreen({
  supplierId,
  companyId,
  latestSubmissionPromise,
  pastEvaluationsPromise,
  supplierDetailsPromise,
}: SupplierDetailsScreenProps) {
  const session = useSession();
  const supplierDetails = use(supplierDetailsPromise);
  const pastEvaluations = use(pastEvaluationsPromise);
  const latestSubmission = use(latestSubmissionPromise);

  const chartSections = [
    ...new Set(
      pastEvaluations.flatMap((evaluation) =>
        evaluation.sections.map((section) => section.title)
      )
    ),
  ];

  const transformedChartData = pastEvaluations.map((evaluation) => ({
    year: evaluation.year.toString(),
    ...Object.fromEntries(
      evaluation.sections.map((section) => [section.title, section.percent])
    ),
  }));

  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);

  const verifiedBy = 'This supplier is verified by Company Name';

  const handleSendEvaluation = () => {
    setIsEmailConfirmOpen(true);
  };

  const handleConfirmSendEvaluation = async (dueDate: Date) => {
    setIsEmailConfirmOpen(false);
    try {
      toast('Sending evaluation invitation...', {
        description: 'Sending evaluation to supplier.',
      });

      const loggedInUserEmail = session?.email ?? '';

      const result = await sendSupplierInvitations(
        [supplierId],
        companyId,
        loggedInUserEmail,
        dueDate
      );

      if (result.success) {
        toast('Evaluation sent successfully', {
          description: 'Evaluations invitation sent to supplier.',
        });
      } else {
        toast.error('Failed to send evaluations', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error sending evaluations:', error);
      toast.error('Failed to send evaluations', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  function getAbbreviation(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('');
  }

  if (!supplierDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Supplier not found</h1>
          <p className="text-muted-foreground mt-2">
            The supplier you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  const {
    name,
    verified,
    primaryContactEmail,
    primaryContactPhone,
    address,
    industry,
    spendCategory,
    fteHeadcount,
    annualSpend,
    registrationDate,
    lastEvaluationDate,
    evaluationStatus,
    mainProductType,
    peakSeason,
    lowSeason,
    aggregatedScoreDetails,
  } = supplierDetails;

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
          <span>{name}</span>
        </div>

        <div className="bg-card rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="bg-accent-info h-16 w-16">
                <AvatarFallback className="text-xl font-semibold text-white">
                  {getAbbreviation(name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{name}</h1>
                  {verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center">
                            <VerifiedIcon className="h-5 w-5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{verifiedBy}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <Badge variant="statusCompleted">Registered</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSendEvaluation}>
                Send Evaluation
              </Button>
              {latestSubmission && (
                <ViewEvaluationReportButton
                  disabled={!latestSubmission.isSubmitted}
                  supplierId={supplierId}
                  submissionId={latestSubmission.id}
                />
              )}
            </div>
          </div>

          <div className="text-muted-foreground mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{primaryContactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{primaryContactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{address}</span>
            </div>
          </div>
        </div>

        <SuppliersOverview
          registrationDate={registrationDate}
          lastEvaluationDate={lastEvaluationDate}
          dueDate={
            latestSubmission?.dueDate
              ? (() => {
                  const date =
                    latestSubmission.dueDate instanceof Date
                      ? latestSubmission.dueDate
                      : new Date(latestSubmission.dueDate);
                  if (isNaN(date.getTime())) return null;
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                })()
              : null
          }
          evaluationStatus={evaluationStatus}
          industry={industry ?? ''}
          spendCategory={spendCategory ?? ''}
          mainProductType={mainProductType ?? ''}
          fteHeadcount={fteHeadcount}
          annualSpend={annualSpend}
          peakSeason={peakSeason ?? ''}
          lowSeason={lowSeason ?? ''}
        />

        <div className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <div className="flex flex-col rounded-lg bg-white md:col-span-1">
            <AggregatedScoreChart
              title="Current Evaluation"
              score={aggregatedScoreDetails.score}
              changePercentage={aggregatedScoreDetails.changePercentage}
              riskLevel={aggregatedScoreDetails.riskLevel}
              findings={aggregatedScoreDetails.findings}
              evaluationStatus={aggregatedScoreDetails.evaluationStatus}
              footer={
                latestSubmission && (
                  <ViewEvaluationReportButton
                    disabled={!latestSubmission.isSubmitted}
                    supplierId={supplierId}
                    submissionId={latestSubmission.id}
                    className="mx-auto"
                  />
                )
              }
            />
          </div>
          <div className="rounded-lg bg-white md:col-span-2">
            <ScoreTrendsChart
              cardTitle="Score trends"
              sections={chartSections}
              chartData={transformedChartData}
            />
          </div>
        </div>

        <SuppliersPastEvaluations
          evaluations={pastEvaluations}
          supplierId={supplierId}
        />
      </div>

      <DueDateSelectionModal
        isOpen={isEmailConfirmOpen}
        onClose={() => setIsEmailConfirmOpen(false)}
        onConfirm={handleConfirmSendEvaluation}
        title="Send Evaluation Email"
        confirmText="Send Email"
        cancelText="Cancel"
        existingDueDate={
          latestSubmission?.dueDate && !latestSubmission.isSubmitted
            ? (() => {
                const date =
                  latestSubmission.dueDate instanceof Date
                    ? latestSubmission.dueDate
                    : new Date(latestSubmission.dueDate);
                return isNaN(date.getTime()) ? null : date;
              })()
            : null
        }
      >
        <p>
          Are you sure you want to send the evaluation email invitation to{' '}
          <strong>{name}</strong>?
        </p>
        <p className="mt-2 text-sm text-gray-600">
          This will send an email with the questionnaire link to the
          supplier&apos;s registered email address.
        </p>
      </DueDateSelectionModal>
    </div>
  );
}

export const SupplierDetailsScreenSkeleton = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-10" />
        </div>

        <div className="bg-card rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-60 rounded-full" />
            </div>
          </div>

          <div className="text-muted-foreground mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>

        <Skeleton className="h-[350px] w-full" />

        <div className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <Skeleton className="h-[350px] md:col-span-1" />
          <Skeleton className="h-[350px] md:col-span-2" />
        </div>

        <Skeleton className="aspect-video w-full" />
      </div>
    </div>
  );
};
