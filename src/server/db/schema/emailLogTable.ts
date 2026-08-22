import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { timestamps } from '@/server/db/schema/timestamps';
import { companyTable } from './companyTable';
import { supplierTable } from './supplierTable';
import { type EmailType } from '@/types/emailType';
export const emailLogTable = pgTable(
  'email_logs',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id'),
    supplierId: integer('supplier_id'),
    emailType: text('email_type').notNull().$type<EmailType>(),
    sentFromUser: text('sent_from_user').notNull(), //this is the user who triggered the email send.
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'company_fk',
      columns: [table.companyId],
      foreignColumns: [companyTable.id],
    }),
    foreignKey({
      name: 'supplier_fk',
      columns: [table.supplierId],
      foreignColumns: [supplierTable.id],
    }),
  ]
);
