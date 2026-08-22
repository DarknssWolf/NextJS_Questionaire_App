import {
  type ActiveStep,
  DOCUMENTATION_STEP,
  type Section,
} from '@/models/Question';
import { type DocumentCategory } from '@/server/services/document-requirements.service';
import { useMemo } from 'react';

export const useProgressCalculation = (
  sections: Section[],
  documentCategories: DocumentCategory[],
  isQuestionAnswered: (questionId: number) => boolean
) => {
  const documentTotals = useMemo(() => {
    const total = documentCategories.reduce(
      (sum, category) => sum + category.documents.length,
      0
    );
    const completed = documentCategories.reduce(
      (sum, category) =>
        sum +
        category.documents.filter((document) => document.completed).length,
      0
    );
    return { total, completed };
  }, [documentCategories]);

  const calculateOverallProgress = useMemo(() => {
    const totalQuestions = sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const answeredQuestions = sections.reduce(
      (sum, section) =>
        sum +
        section.questions.filter((question) => isQuestionAnswered(question.id))
          .length,
      0
    );

    const total = totalQuestions + documentTotals.total;
    const completed = answeredQuestions + documentTotals.completed;

    return {
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    };
  }, [sections, documentTotals, isQuestionAnswered]);

  const calculateStepProgress = useMemo(
    () => (step: ActiveStep) => {
      if (step === DOCUMENTATION_STEP) {
        return {
          percentage:
            documentTotals.total > 0
              ? Math.round(
                  (documentTotals.completed / documentTotals.total) * 100
                )
              : 0,
          completed: documentTotals.completed,
          total: documentTotals.total,
        };
      }

      const section = sections.find((candidate) => candidate.id === step);
      if (!section || section.questions.length === 0) {
        return { percentage: 0, completed: 0, total: 0 };
      }

      const completed = section.questions.filter((question) =>
        isQuestionAnswered(question.id)
      ).length;

      return {
        percentage: Math.round((completed / section.questions.length) * 100),
        completed,
        total: section.questions.length,
      };
    },
    [sections, documentTotals, isQuestionAnswered]
  );

  const countUnansweredRequired = useMemo(
    () =>
      sections.reduce(
        (sum, section) =>
          sum +
          section.questions.filter(
            (question) => question.required && !isQuestionAnswered(question.id)
          ).length,
        0
      ),
    [sections, isQuestionAnswered]
  );

  return {
    calculateOverallProgress,
    calculateStepProgress,
    countUnansweredRequired,
  };
};
