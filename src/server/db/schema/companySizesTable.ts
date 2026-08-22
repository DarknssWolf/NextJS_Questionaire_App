import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const companySizesTable = pgTable('company_sizes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
});
