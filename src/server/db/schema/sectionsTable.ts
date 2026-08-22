import { index, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { questionnairesTable } from './questionnairesTable';

export const sectionsTable = pgTable(
  'sections',
  {
    id: serial('id').primaryKey(),
    questionnaireId: integer('questionnaire_id')
      .notNull()
      .references(() => questionnairesTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [index('sections_questionnaire_id_idx').on(table.questionnaireId)]
);
