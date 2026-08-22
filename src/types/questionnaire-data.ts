export const QUESTIONNAIRE_STATUSES = ['active', 'archived'] as const;
export type QuestionnaireStatus = (typeof QUESTIONNAIRE_STATUSES)[number];

export const QUESTION_TYPES = [
  'text',
  'textarea',
  'radio',
  'checkbox',
  'select',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SUBMISSION_STATUSES = [
  'not_started',
  'in_progress',
  'submitted',
  'auto_submitted',
  'manually_submitted',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SCOREABLE_QUESTION_TYPES = [
  'radio',
  'checkbox',
  'select',
] as const satisfies readonly QuestionType[];

export function isScoreable(type: QuestionType): boolean {
  return (SCOREABLE_QUESTION_TYPES as readonly QuestionType[]).includes(type);
}

export function isSingleChoice(type: QuestionType): boolean {
  return type === 'radio' || type === 'select';
}

export function isSubmitted(status: SubmissionStatus): boolean {
  return (
    status === 'submitted' ||
    status === 'auto_submitted' ||
    status === 'manually_submitted'
  );
}

export interface ParsedOption {
  label: string;
  score: number;
}

export interface ParsedQuestion {
  externalId: string;
  sectionTitle: string;
  text: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  options: ParsedOption[];
}

export interface QuestionnaireValidationError {
  row: number;
  field: string;
  message: string;
}

export type QuestionnaireTarget =
  | { kind: 'new'; name: string; description?: string }
  | { kind: 'version'; questionnaireId: number };

export interface QuestionnaireSummary {
  id: number;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: QuestionnaireStatus;
  createdAt: Date;
  sectionCount: number;
  questionCount: number;
}

export interface QuestionnaireStructure {
  id: number;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: QuestionnaireStatus;
  sections: {
    id: number;
    title: string;
    description: string | null;
    sortOrder: number;
    questions: {
      id: number;
      externalId: string;
      text: string;
      helpText: string | null;
      type: QuestionType;
      required: boolean;
      sortOrder: number;
      options: {
        id: number;
        label: string;
        score: number;
        sortOrder: number;
      }[];
    }[];
  }[];
}
