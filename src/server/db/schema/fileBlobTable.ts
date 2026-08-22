import { customType, integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { fileUploadTable } from './fileUploadTable';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const fileBlobTable = pgTable('file_blobs', {
  id: serial('id').primaryKey(),
  fileUploadId: integer('file_upload_id')
    .notNull()
    .unique()
    .references(() => fileUploadTable.id, { onDelete: 'cascade' }),
  data: bytea('data').notNull(),
});
