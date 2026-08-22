'use client';

import { ConfirmationModal } from '@/components/questionnaire/confirmation-modal';
import { DueDateSelectionModal } from '@/components/suppliers/due-date-selection-modal';
import SuppliersFilters from '@/components/suppliers/suppliers-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { VerifiedIcon } from '@/components/ui/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { PAGINATION } from '@/lib/constants';
import {
  getEvaluationRiskLevelVariant,
  getRiskLevelLabel,
} from '@/lib/evaluation-utils';
import { type CompanySupplierSummary } from '@/models/Supplier';
import { sendSupplierInvitations } from '@/server/services/email.service';
import {
  verifySupplier,
  removeSupplierFromCompany,
} from '@/server/services/supplier.service';
import { submitSubmissionForSupplier } from '@/server/services/submission-auto-complete.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { useSession } from '@/providers/session-provider';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Send,
  CheckCircle,
  AlertTriangle,
  X,
  OctagonAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SuppliersTable({
  suppliers,
  selectedSuppliers,
  setSelectedSuppliers,
  currentPage,
  setCurrentPage,
  filters,
  setFilters,
  companyId,
  onExportFilteredList,
}: {
  suppliers: CompanySupplierSummary[];
  selectedSuppliers: number[];
  setSelectedSuppliers: (ids: number[]) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  filters: {
    search: string;
    spendCategory: string;
    industry: string;
    country: string;
    riskLevel: EvaluationRiskLevel;
    completionStatus: EvaluationStatus;
  };
  setFilters: (filters: {
    search: string;
    spendCategory: string;
    industry: string;
    country: string;
    riskLevel: EvaluationRiskLevel;
    completionStatus: EvaluationStatus;
  }) => void;
  companyId: number;
  onExportFilteredList: () => void;
}) {
  const session = useSession();
  const router = useRouter();
  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);
  const [selectedSupplierForEmail, setSelectedSupplierForEmail] =
    useState<CompanySupplierSummary | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [selectedSupplierForSubmit, setSelectedSupplierForSubmit] =
    useState<CompanySupplierSummary | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [selectedSupplierForRemove, setSelectedSupplierForRemove] =
    useState<CompanySupplierSummary | null>(null);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.spendCategory === 'all' ||
      supplier.spendCategory === filters.spendCategory;
    const matchesIndustry =
      filters.industry === 'all' || supplier.industry === filters.industry;
    const matchesCountry =
      filters.country === 'all' || supplier.country === filters.country;
    const matchesRiskLevel =
      filters.riskLevel.toLowerCase() ===
        EvaluationRiskLevel.ALL.toLowerCase() ||
      supplier.riskLevel.toLowerCase() === filters.riskLevel.toLowerCase();
    const matchesCompletionStatus =
      filters.completionStatus === EvaluationStatus.ALL ||
      (filters.completionStatus === EvaluationStatus.COMPLETED &&
        (supplier.completionStatus === EvaluationStatus.COMPLETED ||
          supplier.completionStatus === EvaluationStatus.AUTO_SUBMITTED)) ||
      (filters.completionStatus !== EvaluationStatus.COMPLETED &&
        supplier.completionStatus === filters.completionStatus);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesIndustry &&
      matchesCountry &&
      matchesRiskLevel &&
      matchesCompletionStatus
    );
  });

  const totalPages = Math.ceil(
    filteredSuppliers.length / PAGINATION.SUPPLIERS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * PAGINATION.SUPPLIERS_PER_PAGE;
  const endIndex = startIndex + PAGINATION.SUPPLIERS_PER_PAGE;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers.map((s) => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectSupplier = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedSuppliers([...selectedSuppliers, id]);
    } else {
      setSelectedSuppliers(selectedSuppliers.filter((s) => s !== id));
    }
  };

  const handleSendEvaluation = (supplier: CompanySupplierSummary) => {
    setSelectedSupplierForEmail(supplier);
    setIsEmailConfirmOpen(true);
  };

  const handleConfirmSendEvaluation = async (dueDate: Date) => {
    if (!selectedSupplierForEmail) return;

    setIsEmailConfirmOpen(false);
    try {
      toast('Sending evaluation invitation...', {
        description: 'Sending evaluation to supplier.',
      });

      const loggedInUserEmail = session?.email ?? '';

      const result = await sendSupplierInvitations(
        [selectedSupplierForEmail.id],
        companyId,
        loggedInUserEmail,
        dueDate
      );

      if (result.success) {
        toast('Evaluation sent successfully', {
          description: 'Evaluations invitation sent to supplier.',
        });
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
    setSelectedSupplierForEmail(null);
  };

  const handleVerifySupplier = async (supplier: CompanySupplierSummary) => {
    try {
      const result = await verifySupplier(supplier.id);

      if (!result.success) {
        toast.error('Failed to verify supplier', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error verifying supplier:', error);
      toast.error('Failed to verify supplier', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleSubmitSurvey = (supplier: CompanySupplierSummary) => {
    setSelectedSupplierForSubmit(supplier);
    setIsSubmitConfirmOpen(true);
  };

  const handleConfirmSubmitSurvey = async () => {
    if (!selectedSupplierForSubmit) return;

    setIsSubmitConfirmOpen(false);
    try {
      toast('Submitting survey...', {
        description: 'Finalizing and submitting the survey.',
      });

      const result = await submitSubmissionForSupplier(
        selectedSupplierForSubmit.id
      );

      if (result.success) {
        toast.success('Survey submitted successfully', {
          description: result.message,
        });
        window.location.reload();
      } else {
        toast.error('Failed to submit survey', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
    setSelectedSupplierForSubmit(null);
  };

  const handleRemoveSupplier = (supplier: CompanySupplierSummary) => {
    setSelectedSupplierForRemove(supplier);
    setIsRemoveConfirmOpen(true);
  };

  const handleConfirmRemoveSupplier = async () => {
    if (!selectedSupplierForRemove) return;

    setIsRemoveConfirmOpen(false);
    try {
      toast('Removing supplier...', {
        description: 'Unlinking supplier from your company',
      });

      const result = await removeSupplierFromCompany(
        selectedSupplierForRemove.id,
        companyId
      );

      if (result.success) {
        toast.success('Supplier removed successfully', {
          description: 'The supplier has been removed from your company',
        });
        router.refresh();
      } else {
        toast.error('Failed to remove supplier', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error removing supplier:', error);
      toast.error('Failed to remove supplier', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
    setSelectedSupplierForRemove(null);
  };

  return (
    <div className="space-y-6 p-6">
      <SuppliersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        suppliers={suppliers}
        onExportFilteredList={onExportFilteredList}
      />

      <div className="rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedSuppliers.length === suppliers.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">
                Supplier Name
              </TableHead>
              <TableHead className="text-muted-foreground">Industry</TableHead>
              <TableHead className="text-muted-foreground text-center">
                Risk Level
              </TableHead>
              <TableHead className="text-muted-foreground text-center">
                Date Invite Sent
              </TableHead>
              <TableHead className="text-muted-foreground text-center">
                Due Date
              </TableHead>

              <TableHead className="text-muted-foreground text-center">
                Current Score
              </TableHead>
              <TableHead className="text-muted-foreground">
                Evaluation Progress
              </TableHead>
              <TableHead className="w-20"></TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="hover:bg-muted">
                <TableCell className="px-4 py-3 align-middle">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={(checked) =>
                        handleSelectSupplier(supplier.id, checked as boolean)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="hover:underline"
                    >
                      <span className="font-medium">{supplier.name}</span>
                    </Link>
                    {supplier.verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <VerifiedIcon className="h-5 w-5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This supplier is verified</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {supplier.wasManuallySubmitted && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <OctagonAlert className="text-risk-yellow-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="border-border z-50 max-w-xs rounded-lg border bg-white px-3 py-2 shadow-lg">
                            <p className="text-muted-foreground text-sm">
                              This evaluation was manually submitted by your
                              company
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {supplier.wasAutoSubmitted && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="text-risk-yellow-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="border-border z-50 max-w-xs rounded-lg border bg-white px-3 py-2 shadow-lg">
                            <p className="text-muted-foreground text-sm">
                              This questionnaire was submitted automatically
                              after its due date. Unanswered questions were
                              scored at their lowest option.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {supplier.industry}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={getEvaluationRiskLevelVariant(supplier.riskLevel)}
                  >
                    {getRiskLevelLabel(supplier.riskLevel)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {supplier.dateInviteSent || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {supplier.dueDate}
                </TableCell>

                <TableCell className="text-center">
                  <span className="text-foreground font-semibold">
                    {supplier.evaluationScore}
                  </span>
                </TableCell>
                <TableCell>
                  {supplier.evaluationProgress > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-3 flex-1 rounded-full">
                        <div
                          className="bg-brand-500 h-3 rounded-full"
                          style={{
                            width: `${supplier.evaluationProgress}%`,
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground min-w-12 text-sm">
                        {supplier.evaluationProgress}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm"></span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={() => handleSendEvaluation(supplier)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8"
                    >
                      <Send className="text-muted-foreground h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8">
                          <MoreVertical className="text-muted-foreground h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={
                            supplier.verified
                              ? undefined
                              : () => handleVerifySupplier(supplier)
                          }
                          className={
                            supplier.verified
                              ? 'text-muted-foreground cursor-not-allowed'
                              : 'text-accent-verified'
                          }
                          disabled={supplier.verified}
                        >
                          {supplier.verified
                            ? 'Already Verified'
                            : 'Verify Supplier'}
                        </DropdownMenuItem>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <DropdownMenuItem
                                  onClick={() => handleSubmitSurvey(supplier)}
                                  className="flex items-center gap-2"
                                  disabled={supplier.evaluationProgress >= 100}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Finalize Survey
                                </DropdownMenuItem>
                              </div>
                            </TooltipTrigger>
                            {supplier.evaluationProgress >= 100 && (
                              <TooltipContent
                                side="left"
                                className="border-risk-yellow bg-risk-yellow/25 z-50 max-w-xs rounded-lg border px-3 py-2 shadow-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="text-risk-yellow-foreground h-4 w-4 flex-shrink-0" />
                                  <p className="text-risk-yellow-foreground text-sm font-medium">
                                    Supplier has already completed their
                                    evaluation
                                  </p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuItem
                          onClick={() => handleRemoveSupplier(supplier)}
                          className="text-destructive focus:text-destructive flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {paginatedSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="border-b text-center">
                  <span className="text-body-l text-base-600">
                    No suppliers found
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paginatedSuppliers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredSuppliers.length)} of{' '}
            {filteredSuppliers.length} suppliers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPage === pageNum
                      ? 'bg-accent-info/10 text-accent-info'
                      : ''
                  }
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    currentPage === totalPages
                      ? 'bg-accent-info/10 text-accent-info'
                      : ''
                  }
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DueDateSelectionModal
        isOpen={isEmailConfirmOpen}
        onClose={() => {
          setIsEmailConfirmOpen(false);
          setSelectedSupplierForEmail(null);
        }}
        onConfirm={handleConfirmSendEvaluation}
        title="Send Evaluation Email"
        confirmText="Send Email"
        cancelText="Cancel"
        existingDueDate={
          selectedSupplierForEmail?.dueDate
            ? (() => {
                const [day, month, year] =
                  selectedSupplierForEmail.dueDate.split('/');
                const date = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day)
                );
                return isNaN(date.getTime()) ? null : date;
              })()
            : null
        }
      >
        {selectedSupplierForEmail && (
          <>
            <p>
              Are you sure you want to send the evaluation email invitation to{' '}
              <strong>{selectedSupplierForEmail.name}</strong>?
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              This will send an email with the questionnaire link to the
              supplier&apos;s registered email address.
            </p>
          </>
        )}
      </DueDateSelectionModal>

      <ConfirmationModal
        isOpen={isSubmitConfirmOpen}
        onClose={() => {
          setIsSubmitConfirmOpen(false);
          setSelectedSupplierForSubmit(null);
        }}
        onConfirm={handleConfirmSubmitSurvey}
        title="Finalize Survey"
        confirmText="Finalize"
        cancelText="Cancel"
      >
        {selectedSupplierForSubmit && (
          <>
            <p>
              Are you sure you want to finalize and submit the survey for{' '}
              <strong>{selectedSupplierForSubmit.name}</strong>?
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              This will auto-fill any unanswered questions with the lowest score
              and mark the survey as complete. This action cannot be undone.
            </p>
          </>
        )}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isRemoveConfirmOpen}
        onClose={() => {
          setIsRemoveConfirmOpen(false);
          setSelectedSupplierForRemove(null);
        }}
        onConfirm={handleConfirmRemoveSupplier}
        title="Remove Supplier"
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
      >
        {selectedSupplierForRemove && (
          <>
            <p>
              Are you sure you want to remove{' '}
              <strong>{selectedSupplierForRemove.name}</strong>?
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              This will unlink the supplier from your company. The supplier data
              will not be deleted.
            </p>
          </>
        )}
      </ConfirmationModal>
    </div>
  );
}
