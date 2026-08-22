'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { type NewCompany, companyTable } from '@/server/db/schema/companyTable';
import { eq } from 'drizzle-orm';

export async function getCompanies() {
  return await db.select().from(companyTable);
}

export async function getCompanyById(id: number) {
  const [company] = await db
    .select()
    .from(companyTable)
    .where(eq(companyTable.id, id));
  return company;
}

export async function getCompany(id: string) {
  const companyId = parseInt(id, 10);
  if (isNaN(companyId)) {
    return undefined;
  }
  return await db.query.companyTable.findFirst({
    where: eq(companyTable.id, companyId),
  });
}

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string;
  const primaryContactEmail = formData.get('primaryContactEmail') as string;
  const primaryContactName = formData.get('primaryContactName') as string;

  if (!name || name.trim() === '') {
    return { error: 'Company name is required' };
  }

  const newCompany: NewCompany = {
    name: name.trim(),
    primaryContactEmail: primaryContactEmail.trim(),
    primaryContactName: primaryContactName.trim(),
  };

  try {
    await db.insert(companyTable).values(newCompany);
    revalidatePath('/companies');
    return { success: true };
  } catch (error) {
    console.error('Failed to create company:', error);
    return { error: 'Failed to create company. Please check server logs.' };
  }
}

export async function updateCompany(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'Company name is required' };
  }

  const companyId = parseInt(id, 10);
  if (isNaN(companyId)) {
    return { error: 'Invalid company ID' };
  }

  try {
    await db
      .update(companyTable)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(eq(companyTable.id, companyId));
    revalidatePath('/companies');
    return { success: true };
  } catch (error) {
    console.error('Failed to update company:', error);
    return { error: 'Failed to update company. Please check server logs.' };
  }
}

export async function deleteCompany(formData: FormData) {
  const id = formData.get('id') as string;
  const companyId = parseInt(id, 10);
  if (isNaN(companyId)) {
    return { error: 'Invalid company ID' };
  }

  try {
    await db.delete(companyTable).where(eq(companyTable.id, companyId));
    revalidatePath('/companies');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete company:', error);
    return { error: 'Failed to delete company. Please check server logs.' };
  }
}
