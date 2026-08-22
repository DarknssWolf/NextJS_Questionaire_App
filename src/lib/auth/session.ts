import { cache } from 'react';
import { cookies } from 'next/headers';
import { type Roles, type SessionPayload } from '@/types/globals';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from './session-token';

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

export const getRoleFromMetadata = async () => {
  const session = await getSession();
  return session?.role ?? null;
};

export const checkRole = async (role: Roles[]) => {
  const roleFromMetadata = await getRoleFromMetadata();

  return (
    roleFromMetadata === 'developer' || role.some((r) => roleFromMetadata === r)
  );
};

export const getSupplierIdFromMetadata = async () => {
  const session = await getSession();
  return session?.supplierId ?? null;
};
