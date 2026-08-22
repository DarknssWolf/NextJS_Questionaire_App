import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { questionTypeEnum } from './enums';
import { questionnairesTable } from './questionnairesTable';
import { sectionsTable } from './sectionsTable';

export const questionsTable = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    questionnaireId: integer('questionnaire_id')
      .notNull()
      .references(() => questionnairesTable.id, { onDelete: 'cascade' }),
    sectionId: integer('section_id')
      .notNull()
      .references(() => sectionsTable.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    text: text('text').notNull(),
    helpText: text('help_text'),
    type: questionTypeEnum('type').notNull(),
    required: boolean('required').notNull().default(true),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [
    unique('question_questionnaire_external_id').on(
      table.questionnaireId,
      table.externalId
    ),
    index('questions_section_id_idx').on(table.sectionId),
  ]
);
