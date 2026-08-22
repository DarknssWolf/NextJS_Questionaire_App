'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

interface CompanyNameProps {
  children: ReactNode;
}

export function CompanyName({ children }: CompanyNameProps) {
  const pathname = usePathname();

  if (!pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <span className="text-lg font-semibold text-gray-800">{children}</span>
  );
}
