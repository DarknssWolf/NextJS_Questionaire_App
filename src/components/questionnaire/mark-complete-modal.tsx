import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionName: string;
  isDocumentationSection: boolean;
}

export default function MarkCompleteModal({
  isOpen,
  onClose,
  onConfirm,
  sectionName,
  isDocumentationSection,
}: MarkCompleteModalProps) {
  if (!isOpen) return null;

  return (
    // Deliberately not the Dialog primitive: no portal, focus trap or escape handling — adding them would change behaviour.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-lg duration-200">
        <h3 className="text-brand-navy mb-3 text-xl font-semibold">
          Mark Section Complete
        </h3>
        <div className="mb-6 text-zinc-700">
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <div className="text-accent-warning mb-2 flex items-center last:mb-0">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              <span className="font-medium">
                Warning: This action will disable editing
              </span>
            </div>
          </div>

          <p className="mb-4">
            You are about to mark the <strong>{sectionName}</strong> section as
            complete.
          </p>

          {!isDocumentationSection && (
            <p className="mb-4 text-amber-600">
              <strong>After marking this section as complete:</strong>
              <br />
              • All questions in this section will be disabled
              <br />
              • You will not be able to edit your answers
              <br />• This action cannot be undone
            </p>
          )}

          {isDocumentationSection && (
            <p className="mb-4 text-amber-600">
              <strong>After marking this section as complete:</strong>
              <br />
              • The documentation section will be locked
              <br />
              • You will not be able to upload or remove documents
              <br />• This action cannot be undone
            </p>
          )}

          <p>Are you sure you want to proceed?</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="brandOutline" size="pill" onClick={onClose}>
            cancel
          </Button>
          <Button variant="brandSolid" size="pill" onClick={onConfirm}>
            mark complete
          </Button>
        </div>
      </div>
    </div>
  );
}
