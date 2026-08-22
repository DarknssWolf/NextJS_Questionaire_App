import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  serial,
  unique,
} from 'drizzle-orm/pg-core';
import { timestamps } from '@/server/db/schema/timestamps';
import { documentTable } from '@/server/db/schema/documentTable';
import { documentCategoryTable } from '@/server/db/schema/documentCategoryTable';

export const documentRequirementTable = pgTable(
  'document_requirements',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id').notNull(),
    documentId: integer('document_id').notNull(),
    isRequired: boolean('is_required').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'category_fk',
      columns: [table.categoryId],
      foreignColumns: [documentCategoryTable.id],
    }),
    foreignKey({
      name: 'document_fk',
      columns: [table.documentId],
      foreignColumns: [documentTable.id],
    }),
    unique('category_document').on(table.categoryId, table.documentId),
  ]
);
