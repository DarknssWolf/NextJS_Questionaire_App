import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const countryTable = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
});
