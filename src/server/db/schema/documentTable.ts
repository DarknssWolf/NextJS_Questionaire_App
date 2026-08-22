import { timestamps } from '@/server/db/schema/timestamps';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const documentTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
});
