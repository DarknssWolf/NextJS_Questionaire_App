import {
  index,
  integer,
  pgTable,
  serial,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { questionOptionsTable } from './questionOptionsTable';
import { questionsTable } from './questionsTable';
import { submissionsTable } from './submissionsTable';
import { timestamps } from './timestamps';

export const answersTable = pgTable(
  'answers',
  {
    id: serial('id').primaryKey(),
    submissionId: integer('submission_id')
      .notNull()
      .references(() => submissionsTable.id, { onDelete: 'cascade' }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questionsTable.id, { onDelete: 'cascade' }),
    optionId: integer('option_id').references(() => questionOptionsTable.id, {
      onDelete: 'cascade',
    }),
    value: text('value'),
    ...timestamps,
  },
  (table) => [
    unique('answer_submission_question_option')
      .on(table.submissionId, table.questionId, table.optionId)
      .nullsNotDistinct(),
    index('answers_submission_id_idx').on(table.submissionId),
  ]
);
