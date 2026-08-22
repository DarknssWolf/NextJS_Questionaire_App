'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignInState = {
  error?: string;
};

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // One generic message for every failure mode so the form doesn't reveal which emails have accounts.
  const failure: SignInState = { error: 'Invalid email or password' };

  if (!parsed.success) {
    return failure;
  }

  const user = await getUserByEmail(parsed.data.email);

  if (!user) {
    return failure;
  }

  const passwordIsValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordIsValid) {
    return failure;
  }

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    companyId: user.companyId ?? undefined,
    supplierId: user.supplierId ?? undefined,
  });

  redirect('/');
}

export async function signOutAction() {
  await destroySession();
  redirect('/sign-in');
}
