import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { supplierTable } from './supplierTable';
import { submissionStatusEnum } from './enums';
import { questionnairesTable } from './questionnairesTable';
import { timestamps } from './timestamps';

export const submissionsTable = pgTable(
  'submissions',
  {
    id: serial('id').primaryKey(),
    questionnaireId: integer('questionnaire_id')
      .notNull()
      .references(() => questionnairesTable.id),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => supplierTable.id, { onDelete: 'cascade' }),
    status: submissionStatusEnum('status').notNull().default('not_started'),
    dueDate: timestamp('due_date'),
    submittedAt: timestamp('submitted_at'),
    score: integer('score'),
    maxScore: integer('max_score'),
    completedSectionIds: json('completed_section_ids')
      .$type<number[]>()
      .notNull()
      .default([]),
    isDocumentationComplete: boolean('is_documentation_complete')
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => [
    // Deliberately NOT unique on (questionnaireId, supplierId): a supplier can be re-surveyed on the same version in a later cycle.
    index('submissions_supplier_id_idx').on(table.supplierId),
    index('submissions_status_idx').on(table.status),
  ]
);
