'use client';

import QuestionRenderer from '@/components/questionnaire/question-renderer';
import { Button } from '@/components/ui/button';
import { type Section } from '@/models/Question';
import { getQuestionStatusClasses } from '@/lib/questionnaire-styles';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface QuestionSectionProps {
  section: Section;
  progress: { percentage: number; completed: number; total: number };
  isQuestionAnswered: (questionId: number) => boolean;
  getTextValue: (questionId: number) => string;
  isOptionSelected: (questionId: number, optionId: number) => boolean;
  onSelectSingle: (questionId: number, optionId: number) => void;
  onToggleOption: (
    questionId: number,
    optionId: number,
    checked: boolean
  ) => void;
  onTextChange: (questionId: number, value: string) => void;
  onSaveDraft: () => void;
  onMarkComplete: () => void;
}

export default function QuestionSection({
  section,
  progress,
  isQuestionAnswered,
  getTextValue,
  isOptionSelected,
  onSelectSingle,
  onToggleOption,
  onTextChange,
  onSaveDraft,
  onMarkComplete,
}: QuestionSectionProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-brand-navy text-2xl font-bold">{section.title}</h1>
        {section.contactName && (
          <p className="text-base-700">
            Responsible contact:{' '}
            <span className="font-medium">
              {section.contactName}
              {section.contactEmail ? ` | ${section.contactEmail}` : ''}
            </span>
          </p>
        )}
      </div>

      <div className="text-muted-foreground mb-8 flex flex-wrap items-center justify-between gap-2">
        {section.description && <p>{section.description}</p>}
        <p className="text-sm font-medium">
          {progress.completed} of {progress.total} questions answered
        </p>
      </div>

      <div className="mb-8 space-y-4">
        {section.questions.map((question) => {
          const isExpanded = expandedQuestion === question.id;

          return (
            <div key={question.id} className="border-b pb-4">
              <button
                type="button"
                className="flex w-full cursor-pointer items-start justify-between gap-3 py-2 text-left"
                onClick={() =>
                  setExpandedQuestion(isExpanded ? null : question.id)
                }
                aria-expanded={isExpanded}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={getQuestionStatusClasses(
                      isQuestionAnswered(question.id)
                    )}
                  >
                    {isQuestionAnswered(question.id) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="block h-5 w-5 rounded-full border-2" />
                    )}
                  </span>
                  <span className="text-brand-navy font-medium">
                    {question.text}
                    {!question.required && (
                      <span className="text-muted-foreground ml-2 text-sm font-normal">
                        (optional)
                      </span>
                    )}
                  </span>
                </span>
                {isExpanded ? (
                  <ChevronUp className="text-muted-foreground h-5 w-5 shrink-0" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-5 w-5 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 flex flex-col gap-2 pl-8">
                  {question.helpText && (
                    <p className="text-muted-foreground text-sm">
                      {question.helpText}
                    </p>
                  )}
                  <QuestionRenderer
                    question={question}
                    textValue={getTextValue(question.id)}
                    isOptionSelected={(optionId) =>
                      isOptionSelected(question.id, optionId)
                    }
                    onSelectSingle={(optionId) =>
                      onSelectSingle(question.id, optionId)
                    }
                    onToggleOption={(optionId, checked) =>
                      onToggleOption(question.id, optionId, checked)
                    }
                    onTextChange={(value) => onTextChange(question.id, value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-8 flex justify-between pt-6">
        {section.disabled ? (
          <p className="text-muted-foreground font-medium">
            This section has been marked as complete and is now locked for
            editing.
          </p>
        ) : (
          <>
            <Button variant="brandOutline" size="pill" onClick={onSaveDraft}>
              save draft
            </Button>
            <Button variant="brandSolid" size="pill" onClick={onMarkComplete}>
              mark section complete
            </Button>
          </>
        )}
      </div>
    </>
  );
}
