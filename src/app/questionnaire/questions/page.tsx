'use client';
import { RoleGuard } from '@/components/guards/role-guard.client';
import DocumentationSection from '@/components/questionnaire/documentation-section';
import MarkCompleteModal from '@/components/questionnaire/mark-complete-modal';
import ProgressBar from '@/components/questionnaire/progress-bar';
import QuestionSection from '@/components/questionnaire/question-section';
import QuestionnaireHeader from '@/components/questionnaire/questionnaire-header';
import QuestionnaireSidebar from '@/components/questionnaire/questionnaire-sidebar';
import SubmitModal from '@/components/questionnaire/submit-modal';
import { Button } from '@/components/ui/button';
import { useDocumentationManager } from '@/hooks/questionnaire/use-documentation-manager';
import { useProgressCalculation } from '@/hooks/questionnaire/use-progress-calculation';
import { useQuestionnaireAnswers } from '@/hooks/questionnaire/use-questionnaire-answers';
import { useSidebarItems } from '@/hooks/questionnaire/use-sidebar-items';
import { cn } from '@/lib/utils';
import {
  type ActiveStep,
  DOCUMENTATION_STEP,
  type Section,
} from '@/models/Question';
import { useQuestionnaireContext } from '@/providers/questionnaire/QuestionnaireContextProvider';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  canSubmitSubmissionAction,
  getSubmissionProgressAction,
  getSubmissionSectionsAction,
  markSectionCompleteAction,
  submitSubmissionAction,
} from '../actions';

export default function QuestionnairePage() {
  const { supplierDetails } = useQuestionnaireContext();
  const { submissionId, supplierId } = supplierDetails;

  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [activeStep, setActiveStep] = useState<ActiveStep | null>(null);
  const [completedSectionIds, setCompletedSectionIds] = useState<Set<number>>(
    new Set()
  );
  const [isDocumentationDisabled, setIsDocumentationDisabled] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMarkCompleteModalOpen, setIsMarkCompleteModalOpen] = useState(false);

  const {
    isQuestionAnswered,
    getTextValue,
    isOptionSelected,
    selectSingleOption,
    toggleOption,
    setTextValue,
    saveDraft,
  } = useQuestionnaireAnswers(submissionId);

  const {
    documentCategories,
    docActiveTab,
    setDocActiveTab,
    isDocumentationComplete,
    getActiveDocuments,
    calculateMissingDocumentation,
    handleFileUpload,
    handleFileRemove,
    uploadedFiles,
  } = useDocumentationManager(supplierId, submissionId);

  const decoratedSections = sections.map((section) => {
    const isComplete = completedSectionIds.has(section.id);
    const disabled = isComplete || isSubmitted;

    return {
      ...section,
      isComplete,
      disabled,
      questions: section.questions.map((question) => ({
        ...question,
        disabled,
      })),
    };
  });

  const {
    calculateOverallProgress,
    calculateStepProgress,
    countUnansweredRequired,
  } = useProgressCalculation(
    decoratedSections,
    documentCategories,
    isQuestionAnswered
  );

  const { sidebarItems } = useSidebarItems(
    decoratedSections,
    isDocumentationComplete
  );

  const currentSection = decoratedSections.find(
    (section) => section.id === activeStep
  );

  useEffect(() => {
    async function loadSections() {
      const data = await getSubmissionSectionsAction(submissionId);
      setSections(data);
      setActiveStep((current) => current ?? data[0]?.id ?? DOCUMENTATION_STEP);
      setIsLoadingSections(false);
    }

    void loadSections();
  }, [submissionId]);

  useEffect(() => {
    async function loadProgress() {
      const result = await getSubmissionProgressAction(submissionId);
      if (!result.success) return;

      setCompletedSectionIds(new Set(result.data.completedSectionIds));

      if (result.data.isDocumentationComplete) {
        setIsDocumentationDisabled(true);
      }

      if (result.data.isSubmitted) {
        setIsSubmitted(true);
        setIsDocumentationDisabled(true);
      }
    }

    void loadProgress();
  }, [submissionId]);

  const handleMarkComplete = () => {
    if (activeStep === DOCUMENTATION_STEP) {
      setIsMarkCompleteModalOpen(true);
      return;
    }

    if (!currentSection) return;

    const missingRequired = currentSection.questions.some(
      (question) => question.required && !isQuestionAnswered(question.id)
    );

    if (missingRequired) {
      toast.error(
        'Please complete all required questions before marking this section as complete'
      );
      return;
    }

    setIsMarkCompleteModalOpen(true);
  };

  const handleMarkCompleteConfirm = async () => {
    if (activeStep === null) return;

    if (
      activeStep !== DOCUMENTATION_STEP &&
      !(await saveDraft({ silent: true }))
    ) {
      return;
    }

    const result = await markSectionCompleteAction(submissionId, activeStep);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    if (activeStep === DOCUMENTATION_STEP) {
      setIsDocumentationDisabled(true);
      toast.success('Documentation section marked as complete and locked');
    } else {
      setCompletedSectionIds((previous) => new Set([...previous, activeStep]));
      toast.success(
        `${currentSection?.title ?? ''} section marked as complete and locked`
      );
    }

    setIsMarkCompleteModalOpen(false);
  };

  const handleSubmitConfirm = async () => {
    if (!(await saveDraft({ silent: true }))) return;

    const canSubmit = await canSubmitSubmissionAction(submissionId);
    if (!canSubmit.success) {
      toast.error(canSubmit.message);
      return;
    }

    const result = await submitSubmissionAction(submissionId);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setIsSubmitted(true);
    setIsDocumentationDisabled(true);
    setCompletedSectionIds(new Set(sections.map((section) => section.id)));
    setIsSubmitModalOpen(false);
    toast.success(
      'Questionnaire submitted successfully and locked for editing'
    );
  };

  const guardEditable = (): boolean => {
    if (isSubmitted) {
      toast.error('This questionnaire has been submitted and cannot be edited');
      return false;
    }

    if (currentSection?.disabled) {
      toast.error(
        'This section has been marked as complete and cannot be edited'
      );
      return false;
    }

    return true;
  };

  if (isLoadingSections || activeStep === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <Loader2 className="text-primary size-16 animate-spin" />
        Loading questionnaire ...
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="font-medium">
          {supplierDetails.questionnaireName} has no questions yet.
        </p>
        <p className="text-muted-foreground">
          An administrator needs to publish a questionnaire before you can
          respond.
        </p>
      </div>
    );
  }

  return (
    <>
      <QuestionnaireHeader
        title="Supplier Evaluation Questionnaire"
        button={
          <RoleGuard roles={['supplier_admin']}>
            <Button
              variant="brandSolid"
              size="pill"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={isSubmitted}
              // disabled:pointer-events-auto overrides the Button base's pointer-events-none so the not-allowed cursor shows
              className={cn(
                'disabled:pointer-events-auto',
                isSubmitted && 'cursor-not-allowed opacity-50'
              )}
            >
              {isSubmitted ? 'questionnaire submitted' : 'submit questionnaire'}
            </Button>
          </RoleGuard>
        }
      />
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <QuestionnaireSidebar
            sidebarItems={sidebarItems}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          />

          <div className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {activeStep === DOCUMENTATION_STEP ? (
                <DocumentationSection
                  documentCategories={documentCategories}
                  submissionId={submissionId}
                  docActiveTab={docActiveTab}
                  onTabChange={setDocActiveTab}
                  categoryProgress={calculateStepProgress(activeStep)}
                  getActiveDocuments={getActiveDocuments}
                  calculateMissingDocumentation={calculateMissingDocumentation}
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  onSaveDraft={() => void saveDraft()}
                  onMarkComplete={handleMarkComplete}
                  uploadedFiles={uploadedFiles}
                  isDisabled={isDocumentationDisabled || isSubmitted}
                />
              ) : (
                currentSection && (
                  <QuestionSection
                    section={currentSection}
                    progress={calculateStepProgress(activeStep)}
                    isQuestionAnswered={isQuestionAnswered}
                    getTextValue={getTextValue}
                    isOptionSelected={isOptionSelected}
                    onSelectSingle={(questionId, optionId) => {
                      if (guardEditable())
                        selectSingleOption(questionId, optionId);
                    }}
                    onToggleOption={(questionId, optionId, checked) => {
                      if (guardEditable())
                        toggleOption(questionId, optionId, checked);
                    }}
                    onTextChange={(questionId, value) => {
                      if (guardEditable()) setTextValue(questionId, value);
                    }}
                    onSaveDraft={() => void saveDraft()}
                    onMarkComplete={handleMarkComplete}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <ProgressBar
          percentage={calculateOverallProgress.percentage}
          completed={calculateOverallProgress.completed}
          total={calculateOverallProgress.total}
        />

        <SubmitModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirm={handleSubmitConfirm}
          incompleteQuestions={countUnansweredRequired}
          missingDocuments={calculateMissingDocumentation()}
        />

        <MarkCompleteModal
          isOpen={isMarkCompleteModalOpen}
          onClose={() => setIsMarkCompleteModalOpen(false)}
          onConfirm={handleMarkCompleteConfirm}
          sectionName={
            activeStep === DOCUMENTATION_STEP
              ? 'Documentation'
              : (currentSection?.title ?? '')
          }
          isDocumentationSection={activeStep === DOCUMENTATION_STEP}
        />
      </div>
    </>
  );
}
