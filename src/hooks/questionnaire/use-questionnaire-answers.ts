import {
  loadAnswersAction,
  saveAnswersAction,
} from '@/app/questionnaire/actions';
import { type AnswerInput, type AnswerState } from '@/models/Question';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useQuestionnaireAnswers = (submissionId: number) => {
  const [answers, setAnswers] = useState<AnswerState>({});

  useEffect(() => {
    async function loadExistingAnswers() {
      try {
        const result = await loadAnswersAction(submissionId);
        if (result.success) {
          setAnswers(result.data);
        }
      } catch (error) {
        console.error('Failed to load existing answers:', error);
        toast.error('Failed to load your saved answers');
      }
    }

    void loadExistingAnswers();
  }, [submissionId]);

  const isQuestionAnswered = useCallback(
    (questionId: number): boolean => {
      const answer = answers[questionId];
      if (!answer) return false;
      return answer.optionIds.length > 0 || answer.value.trim() !== '';
    },
    [answers]
  );

  const getTextValue = useCallback(
    (questionId: number): string => answers[questionId]?.value ?? '',
    [answers]
  );

  const isOptionSelected = useCallback(
    (questionId: number, optionId: number): boolean =>
      answers[questionId]?.optionIds.includes(optionId) ?? false,
    [answers]
  );

  const selectSingleOption = useCallback(
    (questionId: number, optionId: number) => {
      setAnswers((previous) => ({
        ...previous,
        [questionId]: { optionIds: [optionId], value: '' },
      }));
    },
    []
  );

  const toggleOption = useCallback(
    (questionId: number, optionId: number, checked: boolean) => {
      setAnswers((previous) => {
        const current = previous[questionId]?.optionIds ?? [];
        const optionIds = checked
          ? [...new Set([...current, optionId])]
          : current.filter((id) => id !== optionId);

        return { ...previous, [questionId]: { optionIds, value: '' } };
      });
    },
    []
  );

  const setTextValue = useCallback((questionId: number, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: [], value },
    }));
  }, []);

  const saveDraft = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const payload: AnswerInput[] = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId: Number(questionId),
          optionIds: answer.optionIds,
          value: answer.value,
        })
      );

      if (payload.length === 0) {
        if (!silent) toast.info('There is nothing to save yet');
        return true;
      }

      const result = await saveAnswersAction(submissionId, payload);

      if (!result.success) {
        toast.error(result.message);
        return false;
      }

      if (!silent) toast.success('Draft saved');
      return true;
    },
    [answers, submissionId]
  );

  return {
    answers,
    isQuestionAnswered,
    getTextValue,
    isOptionSelected,
    selectSingleOption,
    toggleOption,
    setTextValue,
    saveDraft,
  };
};
