import { createUtcDate } from '@/lib/date';
import { sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at')
    .default(sql`timezone('UTC', now())`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`NULL`)
    .$onUpdate(() => createUtcDate()),
};
