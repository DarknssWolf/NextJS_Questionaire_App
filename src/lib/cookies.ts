'use server';

import { cookies } from 'next/headers';

export async function setCompanyIdCookie(companyId: number) {
  'use server';
  const cookieStore = await cookies();

  cookieStore.set('companyId', companyId.toString());
}

export async function getCompanyIdCookie() {
  'use server';

  const cookieStore = await cookies();

  const companyId = cookieStore.get('companyId')?.value;

  if (!companyId) {
    return null;
  }

  return Number(companyId);
}
