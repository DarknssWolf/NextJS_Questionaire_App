import { AlertCircle, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  incompleteQuestions: number;
  missingDocuments: number;
}

export default function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  incompleteQuestions,
  missingDocuments,
}: SubmitModalProps) {
  if (!isOpen) return null;
  const canSubmit: boolean = incompleteQuestions === 0;

  return (
    // Deliberately not the Dialog primitive: no portal, focus trap or escape handling — adding them would change behaviour.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-lg duration-200">
        <h3 className="text-brand-navy mb-3 text-xl font-semibold">
          Submit Questionnaire
        </h3>
        <div className="mb-6 text-zinc-700">
          <p className="mb-4">
            You are about to submit this evaluation for final review by the
            requesting company.
          </p>

          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            {incompleteQuestions > 0 && (
              <div className="text-accent-error mb-2 flex items-center last:mb-0">
                <CircleX className="mr-2 h-5 w-5" />
                <span className="font-medium">
                  {incompleteQuestions} incomplete question
                  {incompleteQuestions !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="text-accent-warning mb-2 flex items-center last:mb-0">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="font-medium">
                {missingDocuments} missing document
                {missingDocuments !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <p className="font-medium text-amber-600">
            <strong>Warning:</strong> After submission, this questionnaire will
            be locked and you will not be able to make any further edits to
            questions or documents.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="brandOutline" size="pill" onClick={onClose}>
            cancel
          </Button>
          <Button
            variant="brandSolid"
            size="pill"
            onClick={canSubmit ? onConfirm : undefined}
            // disabled:pointer-events-auto keeps the not-allowed cursor and title tooltip while disabled, which the Button base's pointer-events-none would suppress.
            className={cn(
              'relative disabled:pointer-events-auto',
              !canSubmit && 'cursor-not-allowed opacity-50'
            )}
            disabled={!canSubmit}
            tabIndex={canSubmit ? 0 : -1}
            aria-disabled={!canSubmit}
            type="button"
            title={
              !canSubmit
                ? 'Please answer all questions before submitting.'
                : undefined
            }
          >
            confirm & submit
          </Button>
        </div>
      </div>
    </div>
  );
}
