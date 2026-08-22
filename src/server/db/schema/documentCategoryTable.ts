import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from '@/server/db/schema/timestamps';

export const documentCategoryTable = pgTable('document_categories', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(1),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});
