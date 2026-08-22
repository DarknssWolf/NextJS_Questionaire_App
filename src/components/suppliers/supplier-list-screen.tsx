'use client';

import { DueDateSelectionModal } from '@/components/suppliers/due-date-selection-modal';
import SuppliersTable from '@/components/suppliers/suppliers-table';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { sendSupplierInvitations } from '@/server/services/email.service';
import { type getSuppliers } from '@/server/services/supplier.service';
import { supplierSearchParams } from '@/lib/search-params';
import { useSession } from '@/providers/session-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, AlertTriangle } from 'lucide-react';

type SupplierListScreenProps = {
  suppliersPromise: Promise<Awaited<ReturnType<typeof getSuppliers>>>;
  companyId: number;
};

export function SupplierListScreen({
  suppliersPromise,
  companyId,
}: SupplierListScreenProps) {
  const session = useSession();
  const router = useRouter();
  const suppliers = use(suppliersPromise);
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useQueryStates(supplierSearchParams, {
    history: 'push',
  });
  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);

  const selectedSupplierData = useMemo(
    () => suppliers.data.filter((s) => selectedSuppliers.includes(s.id)),
    [suppliers.data, selectedSuppliers]
  );

  const suppliersWithDueDates = useMemo(
    () =>
      selectedSupplierData.filter((s) => s.dueDate && s.dueDate.trim() !== ''),
    [selectedSupplierData]
  );

  const allHaveDueDates =
    selectedSupplierData.length > 0 &&
    suppliersWithDueDates.length === selectedSupplierData.length;
  const someHaveDueDates = suppliersWithDueDates.length > 0 && !allHaveDueDates;

  const handleSendEvaluation = () => {
    if (selectedSuppliers.length === 0) {
      toast('No suppliers selected', {
        description: 'Please select supplier(s) to send evaluations.',
      });
      return;
    }

    setIsEmailConfirmOpen(true);
  };

  const handleConfirmSendEvaluation = async (dueDate: Date) => {
    setIsEmailConfirmOpen(false);
    try {
      toast('Sending evaluation invitations...', {
        description: `Sending evaluations to ${selectedSuppliers.length} supplier(s).`,
      });

      const loggedInUserEmail = session?.email ?? '';

      const result = await sendSupplierInvitations(
        selectedSuppliers,
        companyId,
        loggedInUserEmail,
        dueDate
      );

      if (result.success) {
        toast('Evaluations sent successfully', {
          description: `Evaluation invitations sent to ${result.successCount} supplier(s).`,
        });
        setSelectedSuppliers([]);
        router.refresh();
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

  const exportFilteredListToCSV = () => {
    const filteredSuppliers = suppliers.data.filter((supplier) => {
      if (
        searchParams.search &&
        !supplier.name.toLowerCase().includes(searchParams.search.toLowerCase())
      ) {
        return false;
      }
      if (
        searchParams.spendCategory !== 'all' &&
        supplier.spendCategory !== searchParams.spendCategory
      ) {
        return false;
      }
      if (
        searchParams.industry !== 'all' &&
        supplier.industry !== searchParams.industry
      ) {
        return false;
      }
      if (
        searchParams.country !== 'all' &&
        supplier.country !== searchParams.country
      ) {
        return false;
      }
      if (
        searchParams.riskLevel !== EvaluationRiskLevel.ALL &&
        supplier.riskLevel !== searchParams.riskLevel
      ) {
        return false;
      }
      if (searchParams.completionStatus !== EvaluationStatus.ALL) {
        if (searchParams.completionStatus === EvaluationStatus.COMPLETED) {
          if (
            supplier.completionStatus !== EvaluationStatus.COMPLETED &&
            supplier.completionStatus !== EvaluationStatus.AUTO_SUBMITTED
          ) {
            return false;
          }
        } else if (
          supplier.completionStatus !== searchParams.completionStatus
        ) {
          return false;
        }
      }
      return true;
    });

    const headers = [
      'Primary Contact Name',
      'Company Name',
      'Primary Contact Email',
    ];
    const csvHeader = headers.join(';');
    const csvRows = filteredSuppliers.map((supplier) => {
      const primaryContactName = supplier.primaryContactName || '';
      const companyName = supplier.name || '';
      const primaryContactEmail = supplier.primaryContactEmail || '';

      const escapedValues = [
        primaryContactName,
        companyName,
        primaryContactEmail,
      ].map((value) => {
        return typeof value === 'string' &&
          (value.includes(';') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });

      return escapedValues.join(';');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export Data', {
      description: `${filteredSuppliers.length} supplier(s) exported`,
    });
  };

  const noneCompleted =
    selectedSuppliers.length > 0 &&
    selectedSupplierData.every((s) => s.evaluationProgress < 100);
  const canSendEvaluation = selectedSuppliers.length > 0 && noneCompleted;
  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
            <p className="mt-1 text-gray-600">
              Total Suppliers: {suppliers.data.length}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="brandOutline" size="pill" asChild>
              <Link href="/suppliers/load">load supplier(s)</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="brandSolid" size="pill">
                  send
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={handleSendEvaluation}
                          disabled={!canSendEvaluation}
                          className={
                            !canSendEvaluation
                              ? 'cursor-not-allowed opacity-50'
                              : ''
                          }
                        >
                          Send Evaluation
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {!canSendEvaluation && selectedSuppliers.length > 0 && (
                      <TooltipContent
                        side="left"
                        className="z-50 max-w-xs rounded-lg border border-yellow-400 bg-yellow-50 px-3 py-2 shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-900">
                            Selected suppliers have completed their evaluations
                          </p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <SuppliersTable
          suppliers={suppliers.data}
          selectedSuppliers={selectedSuppliers}
          setSelectedSuppliers={setSelectedSuppliers}
          currentPage={searchParams.page}
          setCurrentPage={async (page) => {
            await setSearchParams({ page });
          }}
          filters={{
            search: searchParams.search,
            spendCategory: searchParams.spendCategory,
            industry: searchParams.industry,
            country: searchParams.country,
            riskLevel: searchParams.riskLevel,
            completionStatus: searchParams.completionStatus,
          }}
          setFilters={async (filters) => {
            await setSearchParams(filters);
          }}
          companyId={companyId}
          onExportFilteredList={exportFilteredListToCSV}
        />
        <Toaster />

        <DueDateSelectionModal
          isOpen={isEmailConfirmOpen}
          onClose={() => setIsEmailConfirmOpen(false)}
          onConfirm={handleConfirmSendEvaluation}
          title="Send Evaluation Emails"
          confirmText="Send Emails"
          cancelText="Cancel"
          existingDueDate={
            allHaveDueDates && suppliersWithDueDates.length > 0
              ? (() => {
                  const [day, month, year] =
                    suppliersWithDueDates[0].dueDate.split('/');
                  const date = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day)
                  );
                  return isNaN(date.getTime()) ? null : date;
                })()
              : null
          }
          suppliersWithExistingDueDatesCount={
            someHaveDueDates ? suppliersWithDueDates.length : 0
          }
        >
          <p>
            Are you sure you want to send evaluation email invitations to{' '}
            <strong>
              {selectedSuppliers.length}{' '}
              {selectedSuppliers.length !== 1 ? 'suppliers' : 'supplier'}
            </strong>
            ?
          </p>
          <p className="mt-2 text-sm text-gray-600">
            This will send emails with questionnaire links to all selected
            suppliers&apos; registered email addresses.
          </p>
        </DueDateSelectionModal>
      </div>
    </div>
  );
}

export const SupplierListScreenLoading = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-96" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="size-10" />
          </div>
        </div>
        <Skeleton className="aspect-video w-full" />
      </div>
    </div>
  );
};
