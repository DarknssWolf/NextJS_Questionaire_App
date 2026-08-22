import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const companyTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  primaryContactName: text('primary_contact_name').notNull(),
  primaryContactEmail: text('primary_contact_email').notNull(),
  ...timestamps,
});

export type Company = typeof companyTable.$inferSelect;
export type NewCompany = typeof companyTable.$inferInsert;
