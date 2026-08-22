import { hashPassword } from '@/lib/auth/password';
import { DEFAULT_PASSWORDS } from '@/lib/auth/users';
import { EmailType } from '@/types/emailType';
import { db } from '../..';
import { companySupplierTable } from '../../schema/companySupplierTable';
import { companyTable } from '../../schema/companyTable';
import { emailLogTable } from '../../schema/emailLogTable';
import { supplierTable } from '../../schema/supplierTable';
import { usersTable } from '../../schema/userTable';
import { type LookupIds } from './01-lookups';

export interface SeededOrg {
  companyId: number;
  supplierIds: [number, number, number];
  additionalContactUserId: number | null;
  accounts: {
    email: string;
    password: string;
    role: string;
    landsOn: string;
  }[];
}

export async function seedUsersAndCompanies(
  lookups: LookupIds
): Promise<SeededOrg> {
  const { companySizeIds, spendCategoryIds, industryIds, countryIds } = lookups;

  console.log('  company');
  const [company] = await db
    .insert(companyTable)
    .values({
      name: 'Acme Client Co',
      primaryContactName: 'Dana Client',
      primaryContactEmail: 'client@local.dev',
    })
    .returning({ id: companyTable.id });

  console.log('  suppliers');
  const insertedSuppliers = await db
    .insert(supplierTable)
    .values([
      {
        name: 'Northwind Components',
        registrationNumber: 'NW-2019-0431',
        address: '14 Foundry Road, Sheffield',
        website: 'https://northwind.example',
        primaryContactName: 'Sam Rivera',
        primaryContactPosition: 'Compliance Manager',
        primaryContactEmail: 'supplier@local.dev',
        primaryContactPhone: '+44 114 496 0182',
        industryId: industryIds[0],
        countryId: countryIds[0],
        companySizeId: companySizeIds[2],
        spendCategoryId: spendCategoryIds[2],
        mainProductType: 'Precision machined components',
        annualSpend: 1_850_000,
        fteHeadcount: 140,
        peakSeason: 'Q3',
        lowSeason: 'Q1',
        status: 'active',
        verified: true,
      },
      {
        name: 'Solaris Logistics',
        registrationNumber: 'SL-2016-9902',
        address: '4 Docklands Way, Rotterdam',
        website: 'https://solaris-logistics.example',
        primaryContactName: 'Ingrid Bakker',
        primaryContactPosition: 'Operations Director',
        primaryContactEmail: 'ingrid@solaris-logistics.example',
        primaryContactPhone: '+31 10 555 0114',
        industryId: industryIds[7],
        countryId: countryIds[3],
        companySizeId: companySizeIds[3],
        spendCategoryId: spendCategoryIds[9],
        mainProductType: 'Freight forwarding',
        annualSpend: 3_400_000,
        fteHeadcount: 310,
        peakSeason: 'Q4',
        lowSeason: 'Q2',
        status: 'active',
        verified: true,
      },
      {
        name: 'Fairfield Packaging',
        registrationNumber: 'FP-2021-1177',
        address: '89 Mill Lane, Cork',
        primaryContactName: 'Aoife Doyle',
        primaryContactPosition: 'Managing Director',
        primaryContactEmail: 'aoife@fairfield-packaging.example',
        primaryContactPhone: '+353 21 555 0163',
        industryId: industryIds[0],
        countryId: countryIds[2],
        companySizeId: companySizeIds[1],
        spendCategoryId: spendCategoryIds[0],
        mainProductType: 'Recycled fibre packaging',
        annualSpend: 620_000,
        fteHeadcount: 38,
        peakSeason: 'Q4',
        lowSeason: 'Q1',
        status: 'active',
        verified: false,
      },
    ])
    .returning({ id: supplierTable.id });

  const supplierIds: [number, number, number] = [
    insertedSuppliers[0].id,
    insertedSuppliers[1].id,
    insertedSuppliers[2].id,
  ];

  await db
    .insert(companySupplierTable)
    .values(
      supplierIds.map((supplierId) => ({ companyId: company.id, supplierId }))
    );

  console.log('  users');
  const users = [
    {
      email: 'admin@local.dev',
      name: 'Alex Admin',
      role: 'super_admin' as const,
      landsOn: '/admin/questionnaires',
    },
    {
      email: 'client@local.dev',
      name: 'Dana Client',
      role: 'client_admin' as const,
      companyId: company.id,
      landsOn: '/dashboard',
    },
    {
      email: 'client2@local.dev',
      name: 'Priya Analyst',
      role: 'client_additional_admin' as const,
      companyId: company.id,
      landsOn: '/dashboard',
    },
    {
      email: 'supplier@local.dev',
      name: 'Sam Rivera',
      role: 'supplier_admin' as const,
      supplierId: supplierIds[0],
      landsOn: '/questionnaire',
    },
    {
      email: 'contact@local.dev',
      name: 'Jo Naidoo',
      role: 'supplier_additional_admin' as const,
      supplierId: supplierIds[0],
      landsOn: '/questionnaire/questions',
    },
  ];

  const insertedUsers = await db
    .insert(usersTable)
    .values(
      await Promise.all(
        users.map(async (user) => ({
          email: user.email,
          name: user.name,
          role: user.role,
          passwordHash: await hashPassword(DEFAULT_PASSWORDS[user.role]),
          companyId: 'companyId' in user ? user.companyId : undefined,
          supplierId: 'supplierId' in user ? user.supplierId : undefined,
        }))
      )
    )
    .returning({ id: usersTable.id, email: usersTable.email });

  const additionalContactUserId =
    insertedUsers.find((user) => user.email === 'contact@local.dev')?.id ??
    null;

  console.log('  invitation email log');
  await db.insert(emailLogTable).values(
    supplierIds.map((supplierId) => ({
      companyId: company.id,
      supplierId,
      emailType: EmailType.EVALUATION_INVITATION,
      sentFromUser: 'client@local.dev',
    }))
  );

  return {
    companyId: company.id,
    supplierIds,
    additionalContactUserId,
    accounts: users.map((user) => ({
      email: user.email,
      password: DEFAULT_PASSWORDS[user.role],
      role: user.role,
      landsOn: user.landsOn,
    })),
  };
}
