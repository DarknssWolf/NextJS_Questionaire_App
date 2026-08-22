import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';
import { companyTable } from './companyTable';
import { supplierTable } from './supplierTable';

export const companySupplierTable = pgTable(
  'company_supplier',
  {
    companyId: integer('company_id')
      .notNull()
      .references(() => companyTable.id),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => supplierTable.id),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({
      name: 'pk_company_supplier',
      columns: [table.companyId, table.supplierId],
    }),
  })
);
