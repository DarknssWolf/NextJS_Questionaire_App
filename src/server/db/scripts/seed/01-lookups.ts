import { companySizesTable } from '@/server/db/schema/companySizesTable';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { db } from '../..';
import { countryTable } from '../../schema/countryTable';
import { industryTable } from '../../schema/industryTable';

export interface LookupIds {
  companySizeIds: number[];
  spendCategoryIds: number[];
  industryIds: number[];
  countryIds: number[];
}

export async function seedLookups(): Promise<LookupIds> {
  return await db.transaction(async (tx) => {
    console.log('  company sizes');
    const insertedCompanySizes = await tx
      .insert(companySizesTable)
      .values([
        { name: '1-10' },
        { name: '11-50' },
        { name: '51-200' },
        { name: '201-500' },
        { name: '501-1000' },
        { name: '1000+' },
      ])
      .returning({ id: companySizesTable.id });

    console.log('  spend categories');
    const spendCategories = [
      'Raw Materials, Chemicals, Paper, Fuel',
      'Industrial Equipment & Tools',
      'Components & Supplies',
      'Construction, Transportation & Facility Equipment & Supplies',
      'Medical, Laboratory & Test Equipment & Supplies & Pharmaceuticals',
      'Food, Cleaning & Service Industry Equipment & Supplies',
      'Business, Communication & Technology Equipment & Supplies',
      'Defense, Security & Safety Equipment & Supplies',
      'Personal, Domestic & Consumer Equipment & Supplies',
      'Services',
    ];

    const insertedSpendCategories = await tx
      .insert(spendCategoryTable)
      .values(
        spendCategories.map((category1) => ({ category1, category2: '' }))
      )
      .returning({ id: spendCategoryTable.id });

    console.log('  industries');
    const industries = [
      'Manufacturing',
      'Technology',
      'Healthcare',
      'Financial Services',
      'Retail & E-commerce',
      'Construction',
      'Energy & Utilities',
      'Transportation & Logistics',
      'Professional Services',
      'Education',
    ];

    const insertedIndustries = await tx
      .insert(industryTable)
      .values(industries.map((name) => ({ name })))
      .returning({ id: industryTable.id });

    console.log('  countries');
    const countries = [
      'United Kingdom',
      'Germany',
      'South Africa',
      'India',
      'Canada',
      'Australia',
      'France',
      'Netherlands',
      'Singapore',
      'United States of America',
      'Angola',
      'Botswana',
      'Democratic Republic of the Congo',
      'Ethiopia',
      'Ghana',
      'Kenya',
      'Lesotho',
      'Madagascar',
      'Malawi',
      'Mauritius',
      'Mozambique',
      'Namibia',
      'Nigeria',
      'Republic of the Congo',
      'Rwanda',
      'Swaziland (Eswatini)',
      'Tanzania',
      'Uganda',
      'Zambia',
      'Zimbabwe',
      'Belgium',
      'Finland',
      'Ireland',
      'Italy',
      'Norway',
      'Spain',
      'Sweden',
      'Switzerland',
      'China',
      'Indonesia',
      'United Arab Emirates',
      'Argentina',
      'Brazil',
      'Chile',
      'Colombia',
      'Panama',
      'Peru',
    ];

    const insertedCountries = await tx
      .insert(countryTable)
      .values(countries.map((name) => ({ name })))
      .returning({ id: countryTable.id });

    return {
      companySizeIds: insertedCompanySizes.map((row) => row.id),
      spendCategoryIds: insertedSpendCategories.map((row) => row.id),
      industryIds: insertedIndustries.map((row) => row.id),
      countryIds: insertedCountries.map((row) => row.id),
    };
  });
}
