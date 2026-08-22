import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { countryTable } from '@/server/db/schema/countryTable';
import { industryTable } from '@/server/db/schema/industryTable';
import { companySizesTable } from '@/server/db/schema/companySizesTable';
import { timestamps } from '@/server/db/schema/timestamps';

export const supplierTable = pgTable(
  'supplier',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    registrationNumber: text('registration_number').notNull(),
    industryId: integer('industry_id').references(() => industryTable.id),
    countryId: integer('country_id').references(() => countryTable.id),
    address: text('address').notNull(),
    website: text('website'),
    companySizeId: integer('company_size_id').references(
      () => companySizesTable.id
    ),
    primaryContactName: text('primary_contact_name').notNull(),
    primaryContactPosition: text('primary_contact_position').notNull(),
    primaryContactEmail: text('primary_contact_email').notNull(),
    primaryContactPhone: text('primary_contact_phone').notNull(),
    additionalNotes: text('additional_notes'),
    mainProductType: text('main_product_type'),
    fteHeadcount: integer('fte_headcount'),
    annualSpend: integer('annual_spend'),
    peakSeason: text('peak_season'),
    lowSeason: text('low_season'),
    spendCategoryId: integer('spend_category_id').references(
      () => spendCategoryTable.id
    ),
    affidavitWaiverName: text('affidavit_waiver_name'),
    affidavitWaiverSurname: text('affidavit_waiver_surname'),
    affidavitWaiverSignature: text('affidavit_waiver_signature'),
    affidavitWaiverConfirmation: boolean('affidavit_waiver_confirmation')
      .notNull()
      .default(false),
    status: text('status').notNull(),
    verified: boolean('verified').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'spend_category_fk',
      columns: [table.spendCategoryId],
      foreignColumns: [spendCategoryTable.id],
    }),
    foreignKey({
      name: 'country_fk',
      columns: [table.countryId],
      foreignColumns: [countryTable.id],
    }),
    foreignKey({
      name: 'industry_fk',
      columns: [table.industryId],
      foreignColumns: [industryTable.id],
    }),
    foreignKey({
      name: 'company_size_fk',
      columns: [table.companySizeId],
      foreignColumns: [companySizesTable.id],
    }),
  ]
);
