import {
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  serial,
  json,
  boolean,
  text,
} from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';
import { companyTable } from './companyTable';
import { type NotificationType } from '@/types/notification-data';

export const companyNotificationsTable = pgTable(
  'company_notifications',
  {
    id: serial('id'),
    companyId: integer('company_id'),
    body: json('body'), //stores the notification as a json object
    isRead: boolean('is_read').default(false),
    type: text('type').$type<NotificationType>(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'company_fk',
      columns: [table.companyId],
      foreignColumns: [companyTable.id],
    }),
    primaryKey({
      name: 'pk_company_notifications',
      columns: [table.id],
    }),
  ]
);
