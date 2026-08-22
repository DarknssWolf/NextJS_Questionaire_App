import { index, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { questionsTable } from './questionsTable';

export const questionOptionsTable = pgTable(
  'question_options',
  {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .references(() => questionsTable.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    score: integer('score').notNull().default(0),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [index('question_options_question_id_idx').on(table.questionId)]
);
