import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { sectionsTable } from './sectionsTable';
import { timestamps } from './timestamps';
import { usersTable } from './userTable';

export const supplierAdditionalContactsTable = pgTable(
  'supplier_additional_contacts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => usersTable.id),
    supplierId: serial('supplier_id').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(),
    email: text('email').notNull(),
    sectionId: integer('section_id').references(() => sectionsTable.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  }
);
