'use server';

import { db } from '@/server/db';
import { companySizesTable } from '@/server/db/schema/companySizesTable';
import { countryTable } from '@/server/db/schema/countryTable';
import { industryTable } from '@/server/db/schema/industryTable';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { asc } from 'drizzle-orm';

export async function getSpendCategories() {
  try {
    const categories = await db
      .select({
        id: spendCategoryTable.id,
        category1: spendCategoryTable.category1,
        category2: spendCategoryTable.category2,
      })
      .from(spendCategoryTable)
      .orderBy(asc(spendCategoryTable.category1));

    return categories;
  } catch (error) {
    console.error('Error fetching spend categories:', error);
    return [];
  }
}

export async function getIndustries() {
  try {
    const industries = await db
      .select({
        id: industryTable.id,
        name: industryTable.name,
      })
      .from(industryTable)
      .orderBy(asc(industryTable.name));

    return industries;
  } catch (error) {
    console.error('Error fetching industries:', error);
    return [];
  }
}

export async function getCountries() {
  try {
    const countries = await db
      .select({
        id: countryTable.id,
        name: countryTable.name,
      })
      .from(countryTable)
      .orderBy(asc(countryTable.name));

    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

export async function getCompanySizes() {
  try {
    return await db.select().from(companySizesTable);
  } catch {
    return [];
  }
}
