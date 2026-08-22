import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const spendCategoryTable = pgTable('spend_categories', {
  id: serial('id').primaryKey(),
  category1: text('category_1').notNull(),
  category2: text('category_2').notNull(),
  ...timestamps,
});
