'use client';

import { type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { signOutAction } from '@/app/actions/auth.actions';

export function SignOutButton({ children }: { children: ReactNode }) {
  return <Slot onClick={() => void signOutAction()}>{children}</Slot>;
}
