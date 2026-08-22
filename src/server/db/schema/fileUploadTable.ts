import { timestamps } from '@/server/db/schema/timestamps';
import { bigint, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const fileUploadTable = pgTable('file_uploads', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  storageKey: text('storage_key').notNull(),
  fileUploadCategory: text('file_upload_category').notNull(),
  status: text('status').notNull().default('active'),
  ...timestamps,
});
