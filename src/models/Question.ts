import { type QuestionType } from '@/types/questionnaire-data';

export interface QuestionOption {
  id: number;
  label: string;
  score: number;
}

export interface Question {
  id: number;
  externalId: string;
  text: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  options: QuestionOption[];
  disabled?: boolean;
}

export interface Section {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  contactName?: string;
  contactEmail?: string;
  isComplete?: boolean;
  disabled?: boolean;
}

export const DOCUMENTATION_STEP = 'documentation' as const;

export type ActiveStep = number | typeof DOCUMENTATION_STEP;

export type AnswerState = Record<
  number,
  {
    optionIds: number[];
    value: string;
  }
>;

export interface AnswerInput {
  questionId: number;
  optionIds: number[];
  value: string;
}
