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
import { supplierTable } from './supplierTable';
import { type NotificationType } from '@/types/notification-data';

export const supplierNotificationsTable = pgTable(
  'supplier_notifications',
  {
    id: serial('id'),
    supplierId: integer('supplier_id'),
    body: json('body'), //stores the notification as a json object
    isRead: boolean('is_read').default(false),
    type: text('type').$type<NotificationType>(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'supplier_fk',
      columns: [table.supplierId],
      foreignColumns: [supplierTable.id],
    }),
    primaryKey({
      name: 'pk_supplier_notifications',
      columns: [table.id],
    }),
  ]
);
