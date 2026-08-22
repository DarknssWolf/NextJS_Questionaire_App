import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { timestamps } from '@/server/db/schema/timestamps';
import { supplierTable } from '@/server/db/schema/supplierTable';
import { documentRequirementTable } from '@/server/db/schema/documentRequirementTable';
import { fileUploadTable } from '@/server/db/schema/fileUploadTable';
import { submissionsTable } from './submissionsTable';

export const supplierDocumentStatusTable = pgTable(
  'supplier_document_status',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id').notNull(),
    submissionId: integer('submission_id'),
    documentRequirementId: integer('document_requirement_id').notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'uploaded', 'approved', 'rejected'
    uploadedAt: timestamp('uploaded_at'),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    fileUploadId: integer('file_upload_id'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    unique('supplier_document_requirement').on(
      table.supplierId,
      table.documentRequirementId
    ),
    foreignKey({
      name: 'supplier_fk',
      columns: [table.supplierId],
      foreignColumns: [supplierTable.id],
    }),
    foreignKey({
      name: 'document_requirement_fk',
      columns: [table.documentRequirementId],
      foreignColumns: [documentRequirementTable.id],
    }),
    foreignKey({
      name: 'file_upload_fk',
      columns: [table.fileUploadId],
      foreignColumns: [fileUploadTable.id],
    }),
    foreignKey({
      name: 'submission_fk',
      columns: [table.submissionId],
      foreignColumns: [submissionsTable.id],
    }),
  ]
);
