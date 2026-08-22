import {
  QUESTION_TYPES,
  QUESTIONNAIRE_STATUSES,
  SUBMISSION_STATUSES,
} from '@/types/questionnaire-data';
import { pgEnum } from 'drizzle-orm/pg-core';

export const questionnaireStatusEnum = pgEnum(
  'questionnaire_status',
  QUESTIONNAIRE_STATUSES
);

export const questionTypeEnum = pgEnum('question_type', QUESTION_TYPES);

export const submissionStatusEnum = pgEnum(
  'submission_status',
  SUBMISSION_STATUSES
);
