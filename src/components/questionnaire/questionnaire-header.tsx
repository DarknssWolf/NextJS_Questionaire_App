'use client';

import Image from 'next/image';
import { type ReactNode } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';

export default function QuestionnaireHeader({
  title,
  button,
}: {
  title?: string;
  button?: ReactNode;
}) {
  return (
    <header className="bg-surface-header sticky top-0 z-50 flex h-16 w-full items-center border-b px-4 md:px-6">
      <div className="flex h-16 w-full items-center">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt={`${BRAND.name} Logo`}
            width={140}
            height={47}
            priority
            className="mx-4 my-4"
          />
          {title && (
            <>
              <div className="mx-4 h-8 w-px bg-gray-300"></div>
              <h2 className="text-brand-navy text-xl font-bold">{title}</h2>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SignOutButton>
            <Button variant="secondary">Logout</Button>
          </SignOutButton>
          {button && <div>{button}</div>}
        </div>
      </div>
    </header>
  );
}
