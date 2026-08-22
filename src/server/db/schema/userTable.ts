import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';
import { companyTable } from './companyTable';
import { supplierTable } from './supplierTable';
import { type Roles } from '@/types/globals';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').notNull().$type<Roles>(),
  companyId: integer('company_id').references(() => companyTable.id),
  supplierId: integer('supplier_id').references(() => supplierTable.id),
  ...timestamps,
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
