import { integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';
import { questionnaireStatusEnum } from './enums';
import { timestamps } from './timestamps';

export const questionnairesTable = pgTable(
  'questionnaires',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    status: questionnaireStatusEnum('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [unique('questionnaire_key_version').on(table.key, table.version)]
);
